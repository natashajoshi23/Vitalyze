import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RANGES = {
  heartRate:              {min:60, max:100, hardMin:20,  hardMax:300,  unit:'bpm',         label:'Heart Rate',                tooltip:'Normal resting heart rate. Below 60 may indicate bradycardia; above 100 tachycardia.'},
  bloodPressureSystolic:  {min:90, max:120, hardMin:50,  hardMax:300,  unit:'mmHg',        label:'Blood Pressure (Systolic)', tooltip:'Pressure when your heart beats. Above 130 mmHg is elevated — a risk factor for heart disease.'},
  bloodPressureDiastolic: {min:60, max:80,  hardMin:20,  hardMax:200,  unit:'mmHg',        label:'Blood Pressure (Diastolic)',tooltip:'Pressure when your heart rests. Consistently above 80 mmHg may indicate hypertension.'},
  oxygenSaturation:       {min:95, max:100, hardMin:50,  hardMax:100,  unit:'%',           label:'Oxygen Saturation',         tooltip:'Percentage of oxygen in your blood. Below 95% may indicate respiratory or cardiovascular issues.'},
  temperature:            {min:97, max:99,  hardMin:85,  hardMax:115,  unit:'°F',          label:'Body Temperature',          tooltip:'Normal body temperature. Below 97°F may suggest hypothermia; above 100.4°F is typically a fever.'},
  respiratoryRate:        {min:12, max:20,  hardMin:1,   hardMax:80,   unit:'breaths/min', label:'Respiratory Rate',          tooltip:'Breaths per minute at rest. Outside this range may indicate respiratory distress.'},
};

function gs(key,val){const r=RANGES[key];if(!r||val==='')return null;const v=parseFloat(val);if(v<r.min)return'low';if(v>r.max)return'high';return'normal';}
const SS={
  normal:{border:'#00c4b4',bg:'rgba(0,196,180,0.07)',badge:{bg:'rgba(13,148,136,0.1)',color:'#0d9488',border:'rgba(13,148,136,0.3)'}},
  high:  {border:'#e8453c',bg:'rgba(232,69,60,0.06)', badge:{bg:'rgba(139,32,32,0.08)',color:'#8b2020',border:'rgba(139,32,32,0.25)'}},
  low:   {border:'#f59e0b',bg:'rgba(245,158,11,0.06)',badge:{bg:'rgba(180,83,9,0.08)',color:'#b45309',border:'rgba(180,83,9,0.2)'}},
};
const InfoIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

export default function InputData() {
  const [vitals,setVitals]=useState({heartRate:'',bloodPressureSystolic:'',bloodPressureDiastolic:'',oxygenSaturation:'',temperature:'',respiratoryRate:''});
  const [rx,setRx]=useState([{name:'',sideEffects:''}]);
  const [showGoals,setShowGoals]=useState(false);
  const saved=JSON.parse(localStorage.getItem('vital_goals')||'{}');
  const nav=useNavigate();
  const saveGoal=(k,v)=>localStorage.setItem('vital_goals',JSON.stringify({...saved,[k]:v}));

  return (
    <div style={s.page}>
      {/* Teal/navy banner — blue dominates this page */}
      <div style={s.banner}>
        <div style={s.bi}>
          <div>
            <div style={s.eyebrow}>Vitals Input</div>
            <h1 style={s.title}>Your Vital Signs</h1>
            <p style={s.sub}>Enter your measurements. Hover <span style={{background:'rgba(255,255,255,0.15)',borderRadius:4,padding:'1px 5px',fontSize:12}}>ⓘ</span> to learn about each vital.</p>
          </div>
          <svg width="130" height="55" viewBox="0 0 200 55" fill="none" style={{opacity:.4,flexShrink:0}}>
            <path d="M0,28 L30,28 L42,28 L52,8 L62,48 L70,3 L80,52 L90,28 L130,28 L145,28 L155,13 L165,42 L173,5 L183,50 L193,28 L200,28" stroke="#00c4b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <p style={s.sl}>Measurements</p>
            {/* Red goal toggle — a small pop of red in the teal-dominated page */}
            <button onClick={()=>setShowGoals(g=>!g)} style={s.goalBtn}>{showGoals?'Hide Goals':'+ Set Goals'}</button>
          </div>
          <div style={s.vg}>
            {Object.entries(RANGES).map(([key,r])=>{
              const st=gs(key,vitals[key]);const ss=st?SS[st]:null;
              const goal=saved[key];const val=parseFloat(vitals[key]);
              const met=goal&&vitals[key]!==''&&!isNaN(val)&&val<=parseFloat(goal);
              return(
                <div key={key}>
                  <div style={s.lr}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <label style={s.lbl}>{r.label}</label>
                      <div className="tooltip-wrap"><InfoIcon/><div className="tooltip-box">{r.tooltip}</div></div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      {goal&&<span style={{fontSize:10,fontWeight:600,padding:'1px 7px',borderRadius:999,background:met?'rgba(13,148,136,0.1)':'rgba(139,32,32,0.08)',color:met?'#0d9488':'#8b2020',border:`1px solid ${met?'rgba(13,148,136,0.3)':'rgba(139,32,32,0.2)'}`}}>Goal: {goal}</span>}
                      {st&&<span style={{...s.badge,background:ss.badge.bg,color:ss.badge.color,border:`1px solid ${ss.badge.border}`}}>{st==='normal'?'✓':'⚠'} {st}</span>}
                    </div>
                  </div>
                  <input type="number" placeholder={`${r.min}–${r.max} ${r.unit}`} value={vitals[key]}
                    onChange={e=>setVitals(p=>({...p,[key]:e.target.value}))}
                    style={{...s.inp,...(ss?{borderColor:ss.border,background:ss.bg}:{})}}/>
                  {showGoals&&<input type="number" placeholder={`Set goal (${r.unit})`} defaultValue={saved[key]||''}
                    onBlur={e=>saveGoal(key,e.target.value)}
                    style={{...s.inp,marginTop:5,borderColor:'rgba(232,69,60,0.25)',background:'rgba(232,69,60,0.03)',fontSize:12}}/>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <p style={s.sl}>Prescriptions</p>
          {rx.map((p,i)=>(
            <div key={i} style={s.rxc}>
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:1}}><div style={s.lbl}>Medication Name</div><input type="text" placeholder="e.g. Metformin" value={p.name} onChange={e=>{const u=[...rx];u[i]={...u[i],name:e.target.value};setRx(u);}} style={s.inp}/></div>
                <div style={{flex:1}}><div style={s.lbl}>Known Side Effects</div><input type="text" placeholder="e.g. dizziness" value={p.sideEffects} onChange={e=>{const u=[...rx];u[i]={...u[i],sideEffects:e.target.value};setRx(u);}} style={s.inp}/></div>
              </div>
              {rx.length>1&&<button onClick={()=>setRx(prev=>prev.filter((_,j)=>j!==i))} style={s.rmv}>Remove</button>}
            </div>
          ))}
          {/* Teal add button */}
          <button onClick={()=>setRx(p=>[...p,{name:'',sideEffects:''}])} style={s.addBtn}>+ Add Prescription</button>
        </div>

        {/* Red submit — urgency / primary action */}
        <button onClick={()=>nav('/Results',{state:{vitals,prescriptions:rx}})} style={s.submit}>
          Analyze My Vitals →
        </button>
      </div>
    </div>
  );
}

const s={
  page:{maxWidth:740,margin:'0 auto',padding:'0 0 80px',fontFamily:"'DM Sans',sans-serif"},
  banner:{background:'linear-gradient(135deg,#0a4a5c 0%,#0d6b80 55%,#00c4b4 100%)',padding:'40px 32px 36px'},
  bi:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20},
  eyebrow:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.65)',marginBottom:10},
  title:{fontFamily:"'Fraunces',serif",fontSize:'2rem',fontWeight:300,letterSpacing:'-0.02em',color:'#fff',marginBottom:8},
  sub:{fontSize:14,color:'rgba(255,255,255,0.62)',lineHeight:1.6},
  body:{padding:'24px 0 0'},
  card:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:'26px',marginBottom:14,boxShadow:'var(--shadow-sm)'},
  sl:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'},
  vg:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18},
  lr:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5},
  lbl:{fontSize:13,fontWeight:500,color:'var(--text-secondary)'},
  badge:{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:999},
  inp:{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface-2)',fontSize:14,color:'var(--text-primary)',fontFamily:'inherit',outline:'none',boxSizing:'border-box',transition:'border-color .15s'},
  goalBtn:{fontSize:12,fontWeight:600,padding:'5px 12px',borderRadius:8,border:'1px solid rgba(232,69,60,0.25)',background:'rgba(232,69,60,0.06)',color:'#8b2020',cursor:'pointer',fontFamily:'inherit'},
  rxc:{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:13,padding:16,marginBottom:10},
  rmv:{marginTop:8,background:'none',border:'none',color:'#e8453c',fontSize:12,fontWeight:500,cursor:'pointer',padding:0,fontFamily:'inherit'},
  addBtn:{padding:'8px 16px',borderRadius:9,border:'1px solid var(--teal-border)',background:'var(--teal-soft)',color:'#0a4a5c',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',marginTop:4},
  submit:{width:'100%',padding:14,borderRadius:13,border:'none',background:'linear-gradient(135deg,#8b2020 0%,#e8453c 100%)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(139,32,32,0.35)',marginTop:8},
};