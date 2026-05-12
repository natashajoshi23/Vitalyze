import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NR={heartRate:{min:60,max:100,unit:'bpm',label:'Heart Rate'},bloodPressureSystolic:{min:90,max:120,unit:'mmHg',label:'Blood Pressure (Systolic)'},bloodPressureDiastolic:{min:60,max:80,unit:'mmHg',label:'Blood Pressure (Diastolic)'},oxygenSaturation:{min:95,max:100,unit:'%',label:'Oxygen Saturation'},temperature:{min:97,max:99,unit:'°F',label:'Body Temperature'},respiratoryRate:{min:12,max:20,unit:'breaths/min',label:'Respiratory Rate'}};
function gs(k,v){const r=NR[k];if(!r||v===''||v===undefined)return null;const n=parseFloat(v);if(n<r.min)return'low';if(n>r.max)return'high';return'normal';}
const ST={
  normal:{color:'#0d9488',bg:'rgba(0,196,180,0.08)',border:'rgba(0,196,180,0.28)',label:'✓ Normal'},
  high:  {color:'#8b2020',bg:'rgba(139,32,32,0.07)',border:'rgba(139,32,32,0.2)', label:'⚠ High'},
  low:   {color:'#b45309',bg:'rgba(180,83,9,0.07)', border:'rgba(180,83,9,0.2)',  label:'⚠ Low'},
};
function warns(vitals){
  const hr=parseFloat(vitals.heartRate),sys=parseFloat(vitals.bloodPressureSystolic),dia=parseFloat(vitals.bloodPressureDiastolic),o2=parseFloat(vitals.oxygenSaturation),temp=parseFloat(vitals.temperature),rr=parseFloat(vitals.respiratoryRate);
  const w=[];
  if(hr>100&&sys>130) w.push({title:'Cardiovascular Disease Risk',msg:'Elevated heart rate and blood pressure together. 71–75% of older adults with these readings are at increased cardiovascular risk.',sev:'high'});
  if(sys>130||dia>80) w.push({title:'Hypertension Risk',msg:'Your blood pressure is elevated — a leading risk factor for stroke and heart failure affecting 60–80% of older adults.',sev:'high'});
  if(hr>100&&(sys>130||dia>80)) w.push({title:'Atrial Fibrillation Risk',msg:'Elevated heart rate with high BP may indicate AFib, affecting 2–4% of older adults and increasing stroke risk.',sev:'high'});
  if(sys>130&&hr>100&&rr>20) w.push({title:'Diabetes Mellitus Risk',msg:'These combined readings are associated with diabetes mellitus, affecting 18–23% of older adults.',sev:'medium'});
  if(sys<90||dia<60) w.push({title:'Orthostatic Hypotension Risk',msg:'Abnormally low BP can cause dizziness and falls — affects 11–50% of older adults.',sev:'medium'});
  if(temp<97) w.push({title:'Malnutrition / Hypothermia Risk',msg:'Low body temperature may signal malnutrition or hypothermia.',sev:'medium'});
  if(o2<95) w.push({title:'Low Oxygen Saturation',msg:'O₂ below 95% may indicate respiratory distress or cardiovascular issues. Seek medical attention if persistent.',sev:'high'});
  return w;
}
async function aiAnalysis(vitals,rx){
  const vl=Object.entries(NR).filter(([k])=>vitals[k]!==''&&vitals[k]!==undefined).map(([k,r])=>`- ${r.label}: ${vitals[k]} ${r.unit} (normal: ${r.min}–${r.max})`).join('\n');
  const rl=rx.filter(p=>p.name).map(p=>`- ${p.name}${p.sideEffects?` (side effects: ${p.sideEffects})`:''}`).join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY_HERE',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are a clinical health assistant. Write a warm, plain-English 2-3 paragraph summary of what these vitals mean together, any patterns of concern, and one or two practical lifestyle suggestions. Do NOT diagnose. No bullet points.\n\nVitals:\n${vl}${rl?`\nMedications:\n${rl}`:''}`}]})});
  const d=await res.json();return d.content?.[0]?.text||'Unable to generate analysis.';
}

export default function Results(){
  const loc=useLocation(),nav=useNavigate();
  // Use state passed from InputData, or fall back to latest localStorage entry
  const stateVitals = loc.state?.vitals;
  const stateRx     = loc.state?.prescriptions;
  const lastEntry   = JSON.parse(localStorage.getItem('vitals_history') || '[]').slice(-1)[0];
  const vitals      = stateVitals || lastEntry?.vitals || {};
  const prescriptions = stateRx || [];
  const w=warns(vitals);
  const fv=Object.entries(NR).filter(([k])=>vitals[k]!==''&&vitals[k]!==undefined);
  const nc=fv.filter(([k])=>gs(k,vitals[k])==='normal').length;
  const [aiText,setAiText]=useState('');
  const [aiLoad,setAiLoad]=useState(false);
  const [aiErr,setAiErr]=useState('');
  const [aiReq,setAiReq]=useState(false);

  useEffect(()=>{
    if(fv.length===0)return;
    const ex=JSON.parse(localStorage.getItem('vitals_history')||'[]');
    const last=ex[ex.length-1];
    if(last&&Date.now()-last.timestamp<5000)return;
    localStorage.setItem('vitals_history',JSON.stringify([...ex,{vitals,prescriptions,timestamp:Date.now()}]));
  },[]);

  const handleAI=async()=>{
    setAiReq(true);setAiLoad(true);setAiErr('');
    try{setAiText(await aiAnalysis(vitals,prescriptions));}
    catch{setAiErr('Could not reach the AI service. Check your API key configuration.');}
    finally{setAiLoad(false);}
  };

  return(
    <div style={s.page}>
      {/* Split banner: left teal/navy for "Results", right red stripe to signal warnings */}
      <div style={s.banner}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={s.ey}>Analysis</div>
            <h1 style={s.ti}>Your Results</h1>
            <p style={s.su}>A clinical analysis of your submitted vital signs.</p>
          </div>
          {fv.length>0&&<button onClick={()=>window.print()} style={s.printBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18"/><rect x="6" y="14" width="12" height="8"/></svg>
            Export PDF
          </button>}
        </div>
      </div>

      {fv.length===0&&(
        <div style={s.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:16}}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
          <p style={{fontFamily:"'Fraunces',serif",fontWeight:300,fontSize:'1.2rem',color:'var(--text-primary)',marginBottom:8}}>No vitals submitted yet</p>
          <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:20}}>Head to the Vitals page to enter your readings.</p>
          <button onClick={()=>nav('/InputData')} style={s.navyBtn}>Enter Vitals →</button>
        </div>
      )}

      {fv.length>0&&(
        <>
          {/* Stats — navy / teal / red */}
          <div style={s.sr}>
            {[
              {val:fv.length,lbl:'Metrics Logged', color:'#0a4a5c',bg:'rgba(10,74,92,0.07)'},
              {val:nc,       lbl:'In Normal Range',color:'#0d9488', bg:'rgba(0,196,180,0.08)'},
              {val:w.length, lbl:'Risk Warnings',  color:w.length>0?'#8b2020':'#0d9488', bg:w.length>0?'rgba(139,32,32,0.07)':'rgba(0,196,180,0.08)'},
            ].map((item,i)=>(
              <div key={i} style={{...s.sc,background:item.bg}}>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:'2.2rem',fontWeight:300,color:item.color,letterSpacing:'-.03em',lineHeight:1}}>{item.val}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6,fontWeight:500,textTransform:'uppercase',letterSpacing:'.05em'}}>{item.lbl}</div>
              </div>
            ))}
          </div>

          {/* Vitals */}
          <div style={s.card}>
            <p style={s.sl}>Vital Signs</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {fv.map(([k,r])=>{const st=gs(k,vitals[k]);const t=ST[st];return(
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:12,background:t.bg,border:`1px solid ${t.border}`}}>
                  <div><div style={{fontWeight:600,fontSize:14,color:'var(--text-primary)'}}>{r.label}</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>Normal: {r.min}–{r.max} {r.unit}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontFamily:"'Fraunces',serif",fontSize:'1.2rem',fontWeight:300,color:t.color}}>{vitals[k]} {r.unit}</div><div style={{fontSize:11,color:t.color,fontWeight:600,marginTop:2}}>{t.label}</div></div>
                </div>
              );})}
            </div>
          </div>

          {/* Risk warnings — RED section (appropriate) */}
          {w.length>0&&(
            <div style={{...s.card,borderColor:'rgba(139,32,32,0.22)',background:'rgba(139,32,32,0.02)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,paddingBottom:14,borderBottom:'1px solid rgba(139,32,32,0.1)'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#8b2020,#e8453c)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div><div style={{fontSize:14,fontWeight:700,color:'#8b2020'}}>{w.length} Risk {w.length===1?'Warning':'Warnings'} Detected</div><div style={{fontSize:11,color:'var(--text-muted)'}}>Consult a healthcare professional if symptoms persist</div></div>
              </div>
              {w.map((x,i)=>(
                <div key={i} style={{borderRadius:12,padding:'14px 16px',marginBottom:i<w.length-1?10:0,background:x.sev==='high'?'rgba(139,32,32,0.06)':'rgba(180,83,9,0.06)',border:`1px solid ${x.sev==='high'?'rgba(139,32,32,0.18)':'rgba(180,83,9,0.18)'}`}}>
                  <div style={{fontWeight:600,fontSize:14,color:x.sev==='high'?'#8b2020':'#b45309',marginBottom:5}}>⚠ {x.title}</div>
                  <div style={{fontSize:13,color:x.sev==='high'?'#6b0f0f':'#92400e',lineHeight:1.6,opacity:.85}}>{x.msg}</div>
                </div>
              ))}
            </div>
          )}

          {w.length===0&&(
            <div style={{...s.card,background:'rgba(0,196,180,0.07)',borderColor:'rgba(0,196,180,0.3)'}}>
              <p style={{color:'#0d9488',fontWeight:600,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
                No risk warnings detected — your vitals look healthy!
              </p>
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.filter(p=>p.name).length>0&&(
            <div style={s.card}>
              <p style={s.sl}>Prescriptions</p>
              {prescriptions.filter(p=>p.name).map((p,i,arr)=>(
                <div key={i} style={{padding:'11px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{fontWeight:600,fontSize:14,color:'var(--text-primary)'}}>{p.name}</div>
                  {p.sideEffects&&<div style={{fontSize:13,color:'var(--text-muted)',marginTop:3}}>Side effects: {p.sideEffects}</div>}
                </div>
              ))}
            </div>
          )}

          {/* AI — teal/navy icon, balanced gradient stripe */}
          <div style={{...s.card,borderColor:'rgba(10,74,92,0.18)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#0a4a5c 0%,#00c4b4 55%,#e8453c 100%)'}}/>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:aiReq?16:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#0a4a5c'}}>AI Health Summary</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>Powered by Claude — not a medical diagnosis</div>
              </div>
              {!aiReq&&<button onClick={handleAI} style={s.aiBtn}>Generate Analysis</button>}
            </div>
            {aiLoad&&<div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-muted)',fontSize:14}}><div style={s.spin}/>Analysing your vitals…</div>}
            {aiText&&!aiLoad&&<div style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.75}}>{aiText}</div>}
            {aiErr&&!aiLoad&&<div style={{fontSize:13,color:'#8b2020',background:'var(--red-soft)',border:'1px solid var(--red-border)',borderRadius:9,padding:'10px 14px'}}>{aiErr}</div>}
          </div>

          {/* Two buttons — navy and red equally prominent */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
            <button onClick={()=>nav('/InputData')} style={s.navyBtn}>Re-enter Vitals</button>
            <button onClick={()=>nav('/Trends')} style={s.redBtn}>View My Trends →</button>
          </div>
        </>
      )}
    </div>
  );
}

const s={
  page:{maxWidth:700,margin:'0 auto',padding:'0 0 80px',fontFamily:"'DM Sans',sans-serif"},
  banner:{background:'linear-gradient(135deg,#0a4a5c 0%,#0d6b80 50%,#1a7a8a 100%)',padding:'40px 32px 36px',marginBottom:24,position:'relative',overflow:'hidden'},
  ey:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.62)',marginBottom:10},
  ti:{fontFamily:"'Fraunces',serif",fontSize:'2rem',fontWeight:300,letterSpacing:'-.02em',color:'#fff',marginBottom:8},
  su:{fontSize:15,color:'rgba(255,255,255,0.6)',lineHeight:1.6},
  printBtn:{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:9,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.12)',color:'white',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'},
  sr:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14},
  sc:{borderRadius:16,border:'1px solid var(--border)',padding:'18px 16px',textAlign:'center',boxShadow:'var(--shadow-sm)'},
  card:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:24,marginBottom:14,boxShadow:'var(--shadow-sm)'},
  sl:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:16},
  empty:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:'48px 24px',textAlign:'center',boxShadow:'var(--shadow-sm)',marginBottom:14},
  aiBtn:{padding:'7px 14px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',color:'white',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'},
  spin:{width:16,height:16,border:'2px solid var(--border)',borderTopColor:'#00c4b4',borderRadius:'50%',animation:'spin .8s linear infinite',flexShrink:0},
  navyBtn:{padding:14,borderRadius:13,border:'none',background:'linear-gradient(135deg,#0a4a5c,#0d6b80)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(10,74,92,0.3)'},
  redBtn: {padding:14,borderRadius:13,border:'none',background:'linear-gradient(135deg,#8b2020,#e8453c)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(139,32,32,0.3)'},
};