import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VM={
  heartRate:             {label:'Heart Rate',      unit:'bpm',    min:60, max:100,color:'#e8453c'},
  bloodPressureSystolic: {label:'BP Systolic',     unit:'mmHg',   min:90, max:120,color:'#8b2020'},
  bloodPressureDiastolic:{label:'BP Diastolic',    unit:'mmHg',   min:60, max:80, color:'#0a4a5c'},
  oxygenSaturation:      {label:'O₂ Saturation',   unit:'%',      min:95, max:100,color:'#00c4b4'},
  temperature:           {label:'Temperature',      unit:'°F',     min:97, max:99, color:'#e8453c'},
  respiratoryRate:       {label:'Respiratory Rate', unit:'br/min', min:12, max:20, color:'#0d6b80'},
};
function gs(k,v){const m=VM[k];const n=parseFloat(v);if(!m||isNaN(n))return null;if(n<m.min)return'low';if(n>m.max)return'high';return'normal';}
const sc=s=>s==='normal'?'#0d9488':s==='high'?'#8b2020':'#b45309';
const sb=s=>s==='normal'?'rgba(0,196,180,0.08)':s==='high'?'rgba(139,32,32,0.07)':'rgba(180,83,9,0.07)';

function Spark({data,color,w=180,h=50}){
  if(!data||data.length<2)return<div style={{width:w,height:h,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--text-muted)'}}>Not enough data</div>;
  const vs=data.map(d=>d.value),mn=Math.min(...vs),mx=Math.max(...vs),rng=mx-mn||1,p=6;
  const tx=i=>p+(i/(data.length-1))*(w-p*2),ty=v=>p+((mx-v)/rng)*(h-p*2);
  const pts=data.map((d,i)=>`${tx(i)},${ty(d.value)}`).join(' ');
  const area=`${tx(0)},${h-p} ${pts} ${tx(data.length-1)},${h-p}`;
  const uid=color.replace('#','');
  return<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><defs><linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={area} fill={`url(#sg${uid})`}/><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{data.map((d,i)=><circle key={i} cx={tx(i)} cy={ty(d.value)} r="3" fill={color} stroke="white" strokeWidth="1.5"/>)}</svg>;
}

function Chart({data,meta}){
  if(!data||data.length<2)return<div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:13}}>Log at least 2 entries to see your trend.</div>;
  const W=560,H=180,pX=40,pY=16;
  const vs=data.map(d=>d.value),mnV=Math.min(...vs,meta.min)-2,mxV=Math.max(...vs,meta.max)+2,rng=mxV-mnV;
  const ty=v=>pY+((mxV-v)/rng)*(H-pY*2),tx=i=>pX+(i/(data.length-1))*(W-pX-12);
  const pts=data.map((d,i)=>`${tx(i)},${ty(d.value)}`).join(' ');
  const area=`${tx(0)},${H-pY} ${pts} ${tx(data.length-1)},${H-pY}`;
  return<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}><defs><linearGradient id="fcG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={meta.color} stopOpacity=".18"/><stop offset="100%" stopColor={meta.color} stopOpacity="0"/></linearGradient></defs><rect x={pX} y={ty(meta.max)} width={W-pX-12} height={ty(meta.min)-ty(meta.max)} fill="rgba(0,196,180,0.05)" rx="2"/><line x1={pX} y1={ty(meta.min)} x2={W-12} y2={ty(meta.min)} stroke="rgba(0,196,180,0.3)" strokeWidth="1" strokeDasharray="4,3"/><line x1={pX} y1={ty(meta.max)} x2={W-12} y2={ty(meta.max)} stroke="rgba(0,196,180,0.3)" strokeWidth="1" strokeDasharray="4,3"/><text x={pX-4} y={ty(meta.min)+4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{meta.min}</text><text x={pX-4} y={ty(meta.max)+4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{meta.max}</text><polygon points={area} fill="url(#fcG)"/><polyline points={pts} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{data.map((d,i)=><g key={i}><circle cx={tx(i)} cy={ty(d.value)} r="4" fill={meta.color} stroke="white" strokeWidth="2"/><text x={tx(i)} y={H-1} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{d.date}</text></g>)}</svg>;
}

function GoalBar({current,goal,meta}){
  if(!goal||!current)return null;
  const pct=Math.min((parseFloat(current)/parseFloat(goal))*100,100);
  const met=parseFloat(current)<=parseFloat(goal);
  return<div style={{marginTop:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:3}}><span style={{color:'var(--text-muted)'}}>Goal: {goal} {meta.unit}</span><span style={{color:met?'#0d9488':'#8b2020',fontWeight:600}}>{met?'✓ Met':`${parseFloat(current).toFixed(1)} / ${goal}`}</span></div><div style={{height:3,borderRadius:2,background:'var(--border)',overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:met?'#00c4b4':'linear-gradient(90deg,#8b2020,#e8453c)',borderRadius:2,transition:'width .5s ease'}}/></div></div>;
}

export default function Trends(){
  const [history,setHistory]=useState([]);
  const [sel,setSel]=useState('heartRate');
  const [goals,setGoals]=useState({});
  const nav=useNavigate();

  useEffect(()=>{
    const r=localStorage.getItem('vitals_history');if(r)setHistory(JSON.parse(r));
    const g=localStorage.getItem('vital_goals');if(g)setGoals(JSON.parse(g));
  },[]);

  const series={};
  Object.keys(VM).forEach(k=>{series[k]=history.filter(e=>e.vitals[k]!==''&&e.vitals[k]!==undefined).map(e=>({value:parseFloat(e.vitals[k]),date:new Date(e.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'}),timestamp:e.timestamp}));});

  const meta=VM[sel],latest=history[history.length-1];

  return(
    <div style={s.page}>
      {/* Navy/teal banner */}
      <div style={s.banner}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={s.ey}>Health Trends</div>
            <h1 style={s.ti}>Your Progress</h1>
            <p style={s.su}>Track how your vitals change over time. Every analysis is saved here automatically.</p>
          </div>
          <svg width="120" height="48" viewBox="0 0 200 48" fill="none" style={{opacity:.38,flexShrink:0}}>
            <path d="M0,24 L30,24 L42,24 L52,7 L62,41 L70,2 L80,46 L90,24 L130,24 L145,24 L155,10 L165,38 L173,4 L183,44 L193,24 L200,24" stroke="#00c4b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {history.length===0?(
        <div style={s.empty}>
          <svg width="200" height="34" viewBox="0 0 200 34" fill="none" style={{marginBottom:16,opacity:.14}}><line x1="0" y1="17" x2="200" y2="17" stroke="#0a4a5c" strokeWidth="2"/></svg>
          <p style={{fontFamily:"'Fraunces',serif",fontWeight:300,fontSize:'1.2rem',color:'var(--text-primary)',marginBottom:8}}>No data yet</p>
          <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:20,maxWidth:260,textAlign:'center',lineHeight:1.6}}>Submit your vitals to start seeing your health trends.</p>
          <button onClick={()=>nav('/InputData')} style={s.tealBtn}>Enter Vitals →</button>
        </div>
      ):(
        <>
          <div style={s.strip}>
            <div><div style={s.sl2}>Total Entries</div><div style={{fontFamily:"'Fraunces',serif",fontSize:'2rem',color:'#e8453c',fontWeight:300}}>{history.length}</div></div>
            <div style={s.div}/>
            <div><div style={s.sl2}>Last Logged</div><div style={{fontFamily:"'Fraunces',serif",fontSize:'1rem',color:'#0a4a5c',fontWeight:300}}>{latest?new Date(latest.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</div></div>
            <div style={s.div}/>
            <div style={{flex:1}}>
              <div style={s.sl2}>Latest Readings</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:5}}>
                {latest&&Object.entries(VM).map(([k,m])=>{const v=latest.vitals[k];if(!v)return null;const st=gs(k,v);return<span key={k} style={{padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600,background:sb(st),color:sc(st),border:`1px solid ${sc(st)}25`}}>{m.label.split(' ')[0]}: {v}</span>;})}
              </div>
            </div>
          </div>

          <div style={s.grid}>
            {Object.entries(VM).map(([k,m])=>{
              const data=series[k],lt=data[data.length-1],pv=data[data.length-2];
              const delta=lt&&pv?(lt.value-pv.value).toFixed(1):null;
              const isS=sel===k;
              return(
                <div key={k} onClick={()=>setSel(k)} style={{...s.spark,borderColor:isS?m.color:'var(--border)',boxShadow:isS?`0 4px 16px ${m.color}20`:'var(--shadow-sm)'}}>
                  {isS&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:m.color,borderRadius:'16px 16px 0 0'}}/>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:500,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>{m.label}</div>
                      {lt?<div style={{fontFamily:"'Fraunces',serif",fontSize:'1.35rem',color:'var(--text-primary)',fontWeight:300}}>{lt.value} <span style={{fontSize:11,color:'var(--text-muted)'}}>{m.unit}</span></div>:<div style={{fontSize:13,color:'var(--text-muted)'}}>No data</div>}
                    </div>
                    {delta!==null&&<span style={{fontSize:11,fontWeight:600,padding:'2px 7px',borderRadius:999,background:parseFloat(delta)>0?'rgba(139,32,32,0.08)':parseFloat(delta)<0?'rgba(13,148,136,0.08)':'var(--navy-soft)',color:parseFloat(delta)>0?'#8b2020':parseFloat(delta)<0?'#0d9488':'var(--text-muted)'}}>{parseFloat(delta)>0?'↑':parseFloat(delta)<0?'↓':'—'} {Math.abs(delta)}</span>}
                  </div>
                  <Spark data={data} color={m.color} w={180} h={50}/>
                  {goals[k]&&lt&&<GoalBar current={lt.value} goal={goals[k]} meta={m}/>}
                </div>
              );
            })}
          </div>

          <div style={s.chart}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div><div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Detailed View</div><h2 style={{fontFamily:"'Fraunces',serif",fontWeight:300,fontSize:'1.3rem',color:'var(--text-primary)'}}>{meta.label}</h2></div>
              <div style={{display:'flex',gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text-muted)'}}><div style={{width:24,height:2,background:'rgba(0,196,180,0.4)',borderRadius:1}}/>Normal range</div>
                <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text-muted)'}}><div style={{width:24,height:2,background:meta.color,borderRadius:1}}/>Your readings</div>
              </div>
            </div>
            <Chart data={series[sel]} meta={meta}/>
          </div>

          <div style={s.table}>
            <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Full History</div>
            {[...history].reverse().map((e,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<history.length-1?'1px solid var(--border)':'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {/* Alternating red/teal dots in history */}
                  <div style={{width:8,height:8,borderRadius:'50%',background:i%2===0?'#e8453c':'#00c4b4',flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{new Date(e.timestamp).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:1}}>{new Date(e.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  {Object.entries(VM).map(([k,m])=>{const v=e.vitals[k];if(!v)return null;const st=gs(k,v);return<span key={k} style={{fontSize:11,padding:'2px 8px',borderRadius:999,background:sb(st),color:sc(st),fontWeight:500}}>{v} {m.unit}</span>;})}
                </div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
            <button onClick={()=>nav('/InputData')} style={s.tealBtn}>Log New Entry →</button>
            <button onClick={()=>nav('/Results')} style={s.redBtn}>View Results →</button>
          </div>
        </>
      )}
    </div>
  );
}

const s={
  page:{maxWidth:780,margin:'0 auto',padding:'0 0 80px',fontFamily:"'DM Sans',sans-serif"},
  banner:{background:'linear-gradient(135deg,#0a4a5c 0%,#0d6b80 55%,#00c4b4 100%)',padding:'40px 32px 36px',marginBottom:24},
  ey:{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.62)',marginBottom:10},
  ti:{fontFamily:"'Fraunces',serif",fontSize:'2rem',fontWeight:300,letterSpacing:'-.02em',color:'#fff',marginBottom:8},
  su:{fontSize:15,color:'rgba(255,255,255,0.6)',lineHeight:1.6},
  empty:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:'56px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',boxShadow:'var(--shadow-sm)'},
  strip:{background:'var(--surface)',borderRadius:18,border:'1px solid var(--border)',padding:'20px 24px',marginBottom:14,display:'flex',alignItems:'center',gap:24,boxShadow:'var(--shadow-sm)'},
  sl2:{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4},
  div:{width:1,height:48,background:'var(--border)',flexShrink:0},
  grid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14},
  spark:{background:'var(--surface)',borderRadius:16,border:'1px solid',padding:16,cursor:'pointer',transition:'all .15s',position:'relative',overflow:'hidden'},
  chart:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:24,marginBottom:14,boxShadow:'var(--shadow-sm)',overflowX:'auto'},
  table:{background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:24,marginBottom:14,boxShadow:'var(--shadow-sm)'},
  tealBtn:{padding:14,borderRadius:13,border:'none',background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(10,74,92,0.3)'},
  redBtn: {padding:14,borderRadius:13,border:'none',background:'linear-gradient(135deg,#8b2020,#e8453c)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 16px rgba(139,32,32,0.3)'},
};