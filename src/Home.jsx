import { useState } from 'react';
import './Home.css';

const HeartIcon    = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const PulseIcon    = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>;
const ActivityIcon = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const PillIcon     = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>;
const ClipIcon     = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
const ShieldIcon   = ({s=20,c='currentColor'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

function AnimatedEcg() {
  return (
    <div className="hero-ecg-wrap">
      <svg width="420" height="200" viewBox="0 0 340 160" fill="none">
        {/* Grid lines */}
        {[32,64,96,128].map(y=><line key={y} x1="0" y1={y} x2="340" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>)}
        {[0,68,136,204,272,340].map(x=><line key={x} x1={x} y1="0" x2={x} y2="160" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>)}
        {/* ECG line — teal */}
        <path className="ecg-path"
          d="M0,88 L34,88 L48,88 L60,24 L72,138 L80,6 L92,142 L104,88 L138,88 L156,88 L170,50 L182,118 L190,14 L202,134 L214,88 L250,88 L264,88 L278,58 L288,110 L296,32 L308,128 L318,88 L340,88"
          stroke="#00c4b4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* Peak dot — red */}
        <circle className="ecg-dot" cx="80" cy="6" r="6" fill="#e8453c"/>
      </svg>
    </div>
  );
}

// MODAL is built dynamically inside the component now — placeholder kept for reference

const VITAL_RANGES = {
  heartRate:              { label:'Heart Rate',        unit:'bpm',    min:60,  max:100 },
  bloodPressureSystolic:  { label:'BP Systolic',       unit:'mmHg',   min:90,  max:120 },
  bloodPressureDiastolic: { label:'BP Diastolic',      unit:'mmHg',   min:60,  max:80  },
  oxygenSaturation:       { label:'O₂ Saturation',     unit:'%',      min:95,  max:100 },
  temperature:            { label:'Temperature',        unit:'°F',     min:97,  max:99  },
  respiratoryRate:        { label:'Respiratory Rate',   unit:'br/min', min:12,  max:20  },
};

function getStatus(key, val) {
  const r = VITAL_RANGES[key]; const v = parseFloat(val);
  if (!r || isNaN(v)) return null;
  if (v < r.min) return 'low'; if (v > r.max) return 'high'; return 'normal';
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hrs < 24)   return `${hrs}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function Home() {
  const [sel, setSel] = useState(null);

  // Pull real data from localStorage
  const vitalsHistory = JSON.parse(localStorage.getItem('vitals_history') || '[]');
  const goals         = JSON.parse(localStorage.getItem('vital_goals')    || '{}');
  const user          = JSON.parse(localStorage.getItem('user')            || 'null');
  const latest        = vitalsHistory[vitalsHistory.length - 1] || null;
  const prev          = vitalsHistory[vitalsHistory.length - 2] || null;

  // Derive insights from real data
  const insights = [];
  if (latest) {
    Object.entries(VITAL_RANGES).forEach(([key, r]) => {
      const val = latest.vitals[key];
      if (!val || val === '') return;
      const st = getStatus(key, val);
      if (st === 'high') insights.push({ text: `${r.label} is elevated at ${val} ${r.unit}.`, type: 'warn' });
      if (st === 'low')  insights.push({ text: `${r.label} is low at ${val} ${r.unit}.`,     type: 'warn' });
    });
    // Trend insights
    if (prev) {
      Object.entries(VITAL_RANGES).forEach(([key, r]) => {
        const cur = parseFloat(latest.vitals[key]);
        const old = parseFloat(prev.vitals[key]);
        if (isNaN(cur) || isNaN(old)) return;
        const diff = cur - old;
        if (Math.abs(diff) > 5 && key === 'bloodPressureSystolic') {
          insights.push({ text: `BP ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff).toFixed(0)} mmHg since last entry.`, type: 'info' });
        }
        if (Math.abs(diff) > 8 && key === 'heartRate') {
          insights.push({ text: `Heart rate ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff).toFixed(0)} bpm.`, type: 'info' });
        }
      });
    }
  }
  if (insights.length === 0) {
    if (!latest) insights.push({ text: 'No vitals logged yet. Submit your first reading to see insights.', type: 'neutral' });
    else insights.push({ text: 'All logged vitals are within normal ranges.', type: 'ok' });
  }

  // Checklist items — dynamic
  const checklist = [
    { text: "Log today's vitals",        done: latest && new Date(latest.timestamp).toDateString() === new Date().toDateString() },
    { text: 'Set at least one vital goal', done: Object.keys(goals).length > 0 },
    { text: 'Complete your profile',       done: !!user?.name && !!user?.age && !!user?.gender },
    { text: 'Review your Trends page',     done: vitalsHistory.length >= 2 },
  ];

  // Activity feed — real events
  const [expandedActivity, setExpandedActivity] = useState(null);
  const activity = [];
  vitalsHistory.slice(-3).reverse().forEach((e, i) => {
    const abnormal = Object.entries(VITAL_RANGES).filter(([k]) => {
      const st = getStatus(k, e.vitals[k]);
      return st === 'high' || st === 'low';
    });
    const details = abnormal.map(([k, r]) => {
      const val = e.vitals[k];
      const st  = getStatus(k, val);
      return { label: r.label, val, unit: r.unit, st };
    });
    if (abnormal.length > 0) {
      activity.push({ dot:'ad-red',  title:`${abnormal.length} abnormal reading${abnormal.length>1?'s':''} detected`, time:timeAgo(e.timestamp), details, idx: i });
    } else {
      activity.push({ dot:'ad-teal', title:'Vitals logged — all in range', time:timeAgo(e.timestamp), details:[], idx: i });
    }
  });
  if (activity.length === 0) {
    activity.push({ dot:'ad-navy', title:'No activity yet — log your first vitals', time:'', details:[], idx:-1 });
  }

  // Meds — combine from profile, vitals submissions, and directly saved meds
  const medsFromProfile = (user?.drugNames || []).filter(Boolean).map(m => typeof m === 'string' ? m : m?.name).filter(Boolean);
  const medsFromVitals  = vitalsHistory.flatMap(e => (e.prescriptions || []).map(p => p.name).filter(Boolean));
  const medsFromSaved   = JSON.parse(localStorage.getItem('saved_meds') || '[]');
  const meds = [...new Set([...medsFromProfile, ...medsFromVitals, ...medsFromSaved])];

  // Overview stats
  const normalCount = latest ? Object.entries(VITAL_RANGES).filter(([k]) => getStatus(k, latest.vitals[k]) === 'normal').length : 0;
  const warnCount   = latest ? Object.entries(VITAL_RANGES).filter(([k]) => { const s = getStatus(k, latest.vitals[k]); return s === 'high' || s === 'low'; }).length : 0;
  const lastBP      = latest ? `${latest.vitals.bloodPressureSystolic || '—'}/${latest.vitals.bloodPressureDiastolic || '—'}` : '—/—';
  const lastHR      = latest ? (latest.vitals.heartRate || '—') : '—';
  return (
    <>
      <main className="home-page">
        <section className="home-hero">
          <div className="hero-inner">
            <div className="hero-text">
              <div className="hero-eyebrow"><span className="hero-eyebrow-dot"/>Health Monitoring Dashboard</div>
              <h1>Monitor your vitals,<br/><em>understand your health.</em></h1>
              <p className="hero-sub">Track biometric readings, analyse risk indicators, and stay informed about how your medications interact with your body.</p>
            </div>
            <AnimatedEcg/>
          </div>
        </section>

        {/* Stats — 3 teal, 1 red for balance */}
        <div className="hero-stats-bar">
          {[
            {icon:<PulseIcon s={18} c="#00c4b4"/>,   val:'6',    vc:'sv-teal', lbl:'Vitals Tracked',  ic:'si-teal'},
            {icon:<ActivityIcon s={18} c="#e8453c"/>, val:'Live', vc:'sv-red',  lbl:'Risk Analysis',   ic:'si-red' },
            {icon:<PillIcon s={18} c="#00c4b4"/>,     val:'FDA',  vc:'sv-teal', lbl:'Drug Database',   ic:'si-teal'},
            {icon:<ShieldIcon s={18} c="#00c4b4"/>,   val:'AI',   vc:'sv-teal', lbl:'Health Insights', ic:'si-teal'},
          ].map((s,i)=>(
            <div key={i} className="hero-stat-item">
              <div className={`hero-stat-icon ${s.ic}`}>{s.icon}</div>
              <div><div className={`hero-stat-val ${s.vc}`}>{s.val}</div><div className="hero-stat-lbl">{s.lbl}</div></div>
            </div>
          ))}
        </div>

        <section className="summary-grid">
          {/* Overview — teal accent, heart icon */}
          <div className="summary-card large-card" onClick={()=>setSel('overview')}>
            <div className="card-accent-line al-mixed"/>
            <button className="card-arrow" onClick={e=>{e.stopPropagation();setSel('overview')}}>›</button>
            <div className="card-icon-wrap ci-teal"><HeartIcon s={20} c="#00c4b4"/></div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <p className="card-label">Today's Overview</p>
              <span className={`status-pill ${warnCount > 0 ? 'sp-red' : 'sp-green'}`}>{warnCount > 0 ? `${warnCount} Alert${warnCount>1?'s':''}` : 'All Stable'}</span>
            </div>
            <div className="metric-row">
              <div className="metric-box mb-teal">
                <p className="metric-title">Blood Pressure</p>
                <h3 style={{fontSize: lastBP==='—/—'?'1.2rem':'1.55rem'}}>{lastBP}</h3>
                <span className={`metric-tag ${latest ? (getStatus('bloodPressureSystolic', latest.vitals.bloodPressureSystolic) === 'normal' ? 'mt-normal' : 'mt-danger') : 'mt-normal'}`}>
                  {latest ? (getStatus('bloodPressureSystolic', latest.vitals.bloodPressureSystolic) === 'normal' ? 'In Range' : 'Elevated') : 'No data'}
                </span>
              </div>
              <div className="metric-box mb-navy">
                <p className="metric-title">Heart Rate</p>
                <h3>{lastHR}{lastHR !== '—' ? ' bpm' : ''}</h3>
                <span className={`metric-tag ${latest ? (getStatus('heartRate', latest.vitals.heartRate) === 'normal' ? 'mt-teal' : 'mt-danger') : 'mt-teal'}`}>
                  {latest ? (getStatus('heartRate', latest.vitals.heartRate) === 'normal' ? 'Stable' : 'Abnormal') : 'No data'}
                </span>
              </div>
              <div className="metric-box mb-red">
                <p className="metric-title">Entries Logged</p>
                <h3>{vitalsHistory.length}</h3>
                <span className="metric-tag mt-normal">{vitalsHistory.length === 0 ? 'Get started' : 'Total'}</span>
              </div>
            </div>
          </div>

          {/* Insights — real data */}
          <div className="summary-card" onClick={()=>setSel('insights')}>
            <div className="card-accent-line al-teal"/>
            <button className="card-arrow" onClick={e=>{e.stopPropagation();setSel('insights')}}>›</button>
            <div className="card-icon-wrap ci-navy"><ActivityIcon s={20} c="#0a4a5c"/></div>
            <p className="card-label">Pinned Insights</p>
            <h2>Health Insights</h2>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
              {insights.slice(0,3).map((ins,i)=>(
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 10px',borderRadius:9,background: ins.type==='warn'?'rgba(139,32,32,0.06)':ins.type==='ok'?'rgba(0,196,180,0.07)':'rgba(10,74,92,0.05)',border:`1px solid ${ins.type==='warn'?'rgba(139,32,32,0.15)':ins.type==='ok'?'rgba(0,196,180,0.2)':'rgba(10,74,92,0.1)'}`}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:ins.type==='warn'?'#e8453c':ins.type==='ok'?'#00c4b4':'#0a4a5c',flexShrink:0,marginTop:5}}/>
                  <span style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.5}}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist — real data */}
          <div className="summary-card" onClick={()=>setSel('checklist')}>
            <div className="card-accent-line al-teal"/>
            <button className="card-arrow" onClick={e=>{e.stopPropagation();setSel('checklist')}}>›</button>
            <div className="card-icon-wrap ci-teal"><ClipIcon s={20} c="#00c4b4"/></div>
            <p className="card-label">Checklist</p>
            <h2>Your Progress</h2>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
              {checklist.map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:18,height:18,borderRadius:5,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:item.done?'#00c4b4':'transparent',border:`1.5px solid ${item.done?'#00c4b4':'rgba(10,74,92,0.2)'}`,transition:'all .2s'}}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>}
                  </div>
                  <span style={{fontSize:13,color:item.done?'var(--text-muted)':'var(--text-secondary)',textDecoration:item.done?'line-through':'none',lineHeight:1.4}}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,fontSize:11,color:'var(--text-muted)',fontWeight:500}}>
              {checklist.filter(c=>c.done).length} of {checklist.length} completed
            </div>
          </div>

          {/* Activity — real data, expandable */}
          <div className="summary-card" onClick={()=>setSel('activity')}>
            <div className="card-accent-line al-teal"/>
            <button className="card-arrow" onClick={e=>{e.stopPropagation();setSel('activity')}}>›</button>
            <div className="card-icon-wrap ci-navy"><PulseIcon s={20} c="#0d6b80"/></div>
            <p className="card-label">Recent Activity</p>
            <h2>Latest Updates</h2>
            {activity.map((a,i)=>(
              <div key={i}>
                <div className="activity-item"
                  style={{cursor: a.details.length>0?'pointer':'default'}}
                  onClick={e=>{e.stopPropagation(); if(a.details.length>0) setExpandedActivity(expandedActivity===a.idx?null:a.idx);}}>
                  <span className={`activity-dot ${a.dot}`}/>
                  <div style={{flex:1}}>
                    <p className="activity-title">{a.title}</p>
                    {a.time && <p className="activity-time">{a.time}</p>}
                  </div>
                  {a.details.length>0 && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
                      style={{flexShrink:0, transition:'transform .2s', transform: expandedActivity===a.idx?'rotate(180deg)':'rotate(0deg)'}}>
                      <polyline points="6,9 12,15 18,9"/>
                    </svg>
                  )}
                </div>
                {expandedActivity===a.idx && a.details.length>0 && (
                  <div style={{marginBottom:8, marginLeft:20, display:'flex', flexDirection:'column', gap:5}}>
                    {a.details.map((d,j)=>(
                      <div key={j} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:8,
                        background: d.st==='high'?'rgba(139,32,32,0.06)':'rgba(180,83,9,0.06)',
                        border: `1px solid ${d.st==='high'?'rgba(139,32,32,0.15)':'rgba(180,83,9,0.15)'}`}}>
                        <span style={{fontSize:12, color:'var(--text-secondary)', fontWeight:500}}>{d.label}</span>
                        <span style={{fontSize:12, fontWeight:700, color: d.st==='high'?'#8b2020':'#b45309'}}>
                          {d.val} {d.unit} — {d.st==='high'?'⚠ High':'⚠ Low'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Medication — real data */}
          <div className="summary-card" onClick={()=>setSel('medication')}>
            <div className="card-accent-line al-red"/>
            <button className="card-arrow" onClick={e=>{e.stopPropagation();setSel('medication')}}>›</button>
            <div className="card-icon-wrap ci-red"><PillIcon s={20} c="#8b2020"/></div>
            <p className="card-label">Medications</p>
            <h2>Current Prescriptions</h2>
            {meds.length === 0 ? (
              <p className="card-text" style={{color:'var(--text-muted)',fontSize:13}}>No medications added yet. Add prescriptions when logging your vitals.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:7,marginTop:4}}>
                {meds.slice(0,3).map((med,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:9,background:'rgba(139,32,32,0.05)',border:'1px solid rgba(139,32,32,0.12)'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#e8453c',flexShrink:0}}/>
                    <span style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{typeof med==='string'?med:med?.name}</span>
                  </div>
                ))}
                {meds.length > 3 && <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>+{meds.length-3} more</p>}
              </div>
            )}
            <button className="card-button" onClick={e=>{e.stopPropagation();setSel('medication')}}>View Details →</button>
          </div>
        </section>
      </main>

      {sel && (() => {
        const modalData = {
          overview:  { label:"Today's Overview", title:"Your health snapshot",   text: latest ? `You have logged ${vitalsHistory.length} vital ${vitalsHistory.length===1?'entry':'entries'} in total. Your last reading was ${timeAgo(latest.timestamp)}. ${warnCount > 0 ? `${warnCount} reading${warnCount>1?'s are':' is'} outside the normal range — check your Results page for details.` : 'All readings are within normal ranges.'}` : "No vitals logged yet. Head to the Vitals page to submit your first reading and start tracking your health." },
          insights:  { label:"Health Insights",  title:"What the data shows",    text: insights.map(i=>i.text).join(' ') || "Log your vitals to start seeing personalised insights here." },
          checklist: { label:"Your Progress",    title:"Health checklist",       text: `You have completed ${checklist.filter(c=>c.done).length} of ${checklist.length} steps. ${checklist.filter(c=>!c.done).map(c=>c.text).join(', ')} ${checklist.filter(c=>!c.done).length > 0 ? 'still need attention.' : 'Great work — everything is done!'}` },
          activity:  { label:"Recent Activity",  title:"Latest updates",         text: vitalsHistory.length > 0 ? `Your last ${Math.min(vitalsHistory.length,3)} vitals ${vitalsHistory.length===1?'entry was':'entries were'} logged. ${activity[0]?.title || ''}.` : "No activity yet. Log your vitals to start building your health history." },
          medication:{ label:"Medications",      title:"Current prescriptions",  text: meds.length > 0 ? `You currently have ${meds.length} medication${meds.length>1?'s':''} on record: ${meds.map(m=>typeof m==='string'?m:m?.name).join(', ')}. Some medications can affect blood pressure, heart rate, sleep, or hydration.` : "No medications added yet. Add your prescriptions when logging vitals to track potential interactions." },
        };
        const m = modalData[sel];
        return (
          <div className="modal-overlay" onClick={()=>setSel(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <button className="modal-close" onClick={()=>setSel(null)}><span className="modal-close-icon">×</span></button>
              <p className="modal-label">{m.label}</p>
              <h2 className="modal-title">{m.title}</h2>
              <p className="modal-text">{m.text}</p>
            </div>
          </div>
        );
      })()}
    </>
  );
}