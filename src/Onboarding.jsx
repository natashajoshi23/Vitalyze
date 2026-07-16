import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NR={heartRate:{min:60,max:100,unit:'bpm',label:'Heart Rate'},bloodPressureSystolic:{min:90,max:120,unit:'mmHg',label:'BP Systolic'},bloodPressureDiastolic:{min:60,max:80,unit:'mmHg',label:'BP Diastolic'},oxygenSaturation:{min:95,max:100,unit:'%',label:'O₂ Saturation'},temperature:{min:97,max:99,unit:'°F',label:'Temperature'},respiratoryRate:{min:12,max:20,unit:'breaths/min',label:'Respiratory Rate'}};

export default function Onboarding(){
  const [step,setStep]=useState(1);
  const [profile,setProfile]=useState({name:'',age:'',gender:'',conditions:''});
  const [vitals,setVitals]=useState({heartRate:'',bloodPressureSystolic:'',bloodPressureDiastolic:'',oxygenSaturation:'',temperature:'',respiratoryRate:''});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const nav=useNavigate();

  const doProfile=async()=>{
    if(!profile.name||!profile.age||!profile.gender)return setError('Please fill in all fields.');
    setError('');setLoading(true);
    try{localStorage.setItem('user_profile',JSON.stringify(profile));}
    catch{localStorage.setItem('user_profile',JSON.stringify(profile));}
    finally{setLoading(false);setStep(2);}
  };

  const doVitals=()=>{
    if(!Object.values(vitals).some(v=>v!==''))return setError('Please enter at least one vital sign.');
    setError('');
    const ex=JSON.parse(localStorage.getItem('vitals_history')||'[]');
    localStorage.setItem('vitals_history',JSON.stringify([...ex,{vitals,timestamp:Date.now()}]));
    setStep(3);
  };

  // Step colours: navy → teal → red
  const dotColors=['#0a4a5c','#00c4b4','#e8453c'];
  const ecgColors=['#0a4a5c','#00c4b4','#e8453c'];
  const labels=['Create profile','Enter vitals','All set'];

  return(
    <div style={s.page}>
      {/* Full-page background image */}
      <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:'url(/images/digital-health.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%' }}/>
      <div style={{ position:'fixed', inset:0, zIndex:0, background:'linear-gradient(135deg,rgba(8,24,34,0.88) 0%,rgba(10,74,92,0.82) 60%,rgba(0,138,125,0.6) 100%)' }}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={s.progress}>
        {labels.map((label,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{...s.dot,background:step>=i+1?dotColors[i]:'var(--border)',color:step>=i+1?'white':'var(--text-muted)',boxShadow:step>=i+1?`0 3px 10px ${dotColors[i]}50`:'none'}}>
              {step>i+1?<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>:i+1}
            </div>
            <span style={{fontSize:12,fontWeight:500,color:step>=i+1?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.4)'}}>{label}</span>
            {i<2&&<div style={{width:36,height:1,background:step>i+1?dotColors[i]:'rgba(255,255,255,0.15)',margin:'0 4px',transition:'background .3s'}}/>}
          </div>
        ))}
      </div>

      <div style={s.card}>
        {/* ECG decoration changes colour per step */}
        <svg width="100%" height="30" viewBox="0 0 500 30" fill="none" style={{marginBottom:24,opacity:.3}}>
          <path d="M0,15 L80,15 L100,15 L115,3 L130,27 L140,1 L152,29 L165,15 L210,15 L240,15 L255,5 L270,25 L285,15 L340,15 L360,15 L375,4 L390,26 L405,15 L500,15"
            stroke={ecgColors[step-1]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {step===1&&(
          <>
            <div style={{...s.ey,color:'#0a4a5c'}}>Step 1 of 3</div>
            <h1 style={s.ti}>Create your profile</h1>
            <p style={s.su}>Tell us about yourself to personalise your health insights.</p>
            <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:24}}>
              {[{k:'name',l:'Full Name',p:'Jane Smith',t:'text'},{k:'age',l:'Age',p:'42',t:'number',min:0,max:130}].map(f=>(
                <div key={f.k}><label style={s.lbl}>{f.l}</label><input type={f.t} placeholder={f.p} value={profile[f.k]} min={f.min} max={f.max} onChange={e=>setProfile(p=>({...p,[f.k]:e.target.value}))} onBlur={e=>{if(f.t!=="number"||e.target.value==="")return;const n=parseFloat(e.target.value);if(!isNaN(n))setProfile(p=>({...p,[f.k]:String(Math.min(Math.max(n,f.min??0),f.max??999))}))}} style={s.inp}/></div>
              ))}
              <div>
                <label style={s.lbl}>Gender</label>
                <select value={profile.gender} onChange={e=>setProfile(p=>({...p,gender:e.target.value}))} style={{...s.inp,cursor:'pointer'}}>
                  <option value="" disabled>Select gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                  <option>Transgender Female</option>
                  <option>Transgender Male</option>
                  <option>Genderqueer</option>
                  <option>Prefer not to say</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={s.lbl}>Health Conditions <span style={{fontWeight:400,color:'#999'}}>(optional)</span></label>
                <input type="text" placeholder="e.g. diabetes, hypertension, asthma" value={profile.conditions} onChange={e=>setProfile(p=>({...p,conditions:e.target.value}))} style={s.inp}/>
                <div style={{fontSize:11,color:'#999',marginTop:4}}>Separate multiple conditions with commas</div>
              </div>
              {error&&<div style={s.err}>{error}</div>}
              {/* Navy button for step 1 */}
              <button onClick={doProfile} disabled={loading} style={{...s.btn,background:'linear-gradient(135deg,#0a4a5c,#0d6b80)',boxShadow:'0 4px 14px rgba(10,74,92,0.35)'}}>
                {loading?'Saving…':'Continue →'}
              </button>
            </div>
          </>
        )}

        {step===2&&(
          <>
            <div style={{...s.ey,color:'#00c4b4'}}>Step 2 of 3</div>
            <h1 style={s.ti}>Enter your first vitals</h1>
            <p style={s.su}>Log your current measurements. Skip any you don't have.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:14,marginTop:24}}>
              {Object.entries(NR).map(([k,r])=>(
                <div key={k}><label style={s.lbl}>{r.label}</label><input type="number" placeholder={`${r.min}–${r.max} ${r.unit}`} value={vitals[k]} onChange={e=>setVitals(p=>({...p,[k]:e.target.value}))} style={s.inp}/></div>
              ))}
            </div>
            {error&&<div style={{...s.err,marginTop:14}}>{error}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:20}}>
              <button onClick={()=>{setError('');setStep(3);}} style={s.ghost}>Skip for now</button>
              {/* Teal button for step 2 */}
              <button onClick={doVitals} style={{...s.btn,background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',boxShadow:'0 4px 14px rgba(10,74,92,0.3)'}}>Save & Continue →</button>
            </div>
          </>
        )}

        {step===3&&(
          <div style={{textAlign:'center',padding:'20px 0'}}>
            {/* Success ring is red — the exciting completion */}
            <div style={{...s.ring,background:'linear-gradient(135deg,#8b2020,#e8453c)',boxShadow:'0 8px 24px rgba(139,32,32,0.35)'}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <h1 style={{...s.ti,marginBottom:10}}>You're all set!</h1>
            <p style={{...s.su,marginBottom:32}}>Your profile is ready. Explore your dashboard, log vitals, and track your progress over time.</p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={()=>nav('/')} style={{...s.btn,background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',boxShadow:'0 4px 14px rgba(10,74,92,0.3)'}}>Go to Dashboard →</button>
              {JSON.parse(localStorage.getItem('vitals_history')||'[]').length > 0
                ? <button onClick={()=>nav('/Results')} style={{...s.btn,background:'linear-gradient(135deg,#8b2020,#e8453c)',boxShadow:'0 4px 14px rgba(139,32,32,0.35)'}}>View My Results →</button>
                : <button onClick={()=>nav('/InputData')} style={s.ghost}>Log Vitals First</button>
              }
            </div>
          </div>
        )}
      </div>

      {step===1&&(
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginTop:20}}>
          {['6 vitals tracked','AI analysis','FDA drug database','Progress trends'].map((f,i)=>(
            <span key={i} style={{padding:'5px 14px',borderRadius:999,fontSize:12,fontWeight:500,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',color:'rgba(255,255,255,0.8)'}}>{f}</span>
          ))}
        </div>
      )}
      </div>{/* close zIndex wrapper */}
    </div>
  );
}

const s={
  page:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',background:'var(--bg)',fontFamily:"'DM Sans',sans-serif",position:'relative',overflow:'hidden'},
  progress:{display:'flex',alignItems:'center',gap:6,marginBottom:28,flexWrap:'wrap',justifyContent:'center'},
  dot:{width:28,height:28,borderRadius:'50%',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'},
  card:{width:'100%',maxWidth:520,background:'rgba(255,255,255,0.97)',borderRadius:24,border:'1px solid rgba(255,255,255,0.5)',padding:'28px 20px',boxShadow:'0 24px 80px rgba(0,0,0,0.35)'},
  ey:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10},
  ti:{fontFamily:"'Fraunces',serif",fontSize:'1.8rem',fontWeight:300,letterSpacing:'-.02em',color:'var(--text-primary)',marginBottom:8},
  su:{fontSize:14,color:'var(--text-secondary)',lineHeight:1.65},
  lbl:{display:'block',fontSize:13,fontWeight:500,color:'var(--text-secondary)',marginBottom:5},
  inp:{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface-2)',color:'var(--text-primary)',fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'},
  err:{background:'var(--red-soft)',border:'1px solid var(--red-border)',borderRadius:9,padding:'10px 14px',fontSize:13,color:'#8b2020',fontWeight:500},
  btn:{padding:12,borderRadius:12,border:'none',color:'white',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  ghost:{padding:12,borderRadius:12,border:'1px solid var(--border)',background:'transparent',color:'var(--text-secondary)',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'inherit'},
  ring:{width:72,height:72,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'},
};