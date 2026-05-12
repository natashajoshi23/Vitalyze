import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VITAL_RANGES = {
  heartRate:              { label:'Heart Rate',                unit:'bpm',         min:60,  max:100, warnMin:50,  warnMax:110 },
  bloodPressureSystolic:  { label:'BP Systolic',               unit:'mmHg',        min:90,  max:120, warnMin:80,  warnMax:140 },
  bloodPressureDiastolic: { label:'BP Diastolic',              unit:'mmHg',        min:60,  max:80,  warnMin:50,  warnMax:90  },
  oxygenSaturation:       { label:'O₂ Saturation',             unit:'%',           min:95,  max:100, warnMin:90,  warnMax:100 },
  temperature:            { label:'Body Temperature',           unit:'°F',          min:97,  max:99,  warnMin:96,  warnMax:101 },
  respiratoryRate:        { label:'Respiratory Rate',           unit:'breaths/min', min:12,  max:20,  warnMin:10,  warnMax:25  },
};

function calcScore(vitals) {
  if (!vitals) return null;
  const filled = Object.entries(VITAL_RANGES).filter(([k]) => vitals[k] && vitals[k] !== '');
  if (filled.length === 0) return null;
  let total = 0;
  filled.forEach(([k, r]) => {
    const v = parseFloat(vitals[k]);
    if (v >= r.min && v <= r.max)              total += 100;
    else if (v >= r.warnMin && v <= r.warnMax) total += 65;
    else                                        total += 30;
  });
  return Math.round(total / filled.length);
}

function vitalScore(key, val) {
  const r = VITAL_RANGES[key]; const v = parseFloat(val);
  if (!r || isNaN(v)) return null;
  if (v >= r.min && v <= r.max)              return 100;
  if (v >= r.warnMin && v <= r.warnMax)      return 65;
  return 30;
}

function scoreToGrade(score) {
  if (score === null) return { grade:'—', color:'var(--text-muted)', label:'No data' };
  if (score >= 90) return { grade:'A', color:'#0d9488', label:'Excellent' };
  if (score >= 75) return { grade:'B', color:'#00c4b4', label:'Good' };
  if (score >= 60) return { grade:'C', color:'#f59e0b', label:'Fair' };
  return            { grade:'D', color:'#e8453c', label:'Needs Attention' };
}

function getStatus(key, val) {
  const r = VITAL_RANGES[key]; const v = parseFloat(val);
  if (!r || isNaN(v)) return null;
  if (v < r.min) return 'low'; if (v > r.max) return 'high'; return 'normal';
}

function calcStreak(history) {
  if (!history.length) return 0;
  const days = [...new Set(history.map(e => new Date(e.timestamp).toDateString()))].sort((a,b) => new Date(b)-new Date(a));
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  for (const day of days) {
    const d = new Date(day); d.setHours(0,0,0,0);
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

const RiskIcons = {
  // Hypertension: blood pressure cuff gauge — two arcs with a needle
  hypertension: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
      <path d="M5 17A7 7 0 0 1 19 17" strokeLinejoin="round"/>
      <path d="M12 10v4" strokeWidth="2"/>
      <path d="M12 17l4.5-4" strokeWidth="1.4" opacity="0.5"/>
      <circle cx="12" cy="17" r="1.2" fill={color} stroke="none"/>
      <line x1="6.5" y1="17" x2="5" y2="17" strokeWidth="1.4"/>
      <line x1="17.5" y1="17" x2="19" y2="17" strokeWidth="1.4"/>
    </svg>
  ),
  // Cardiovascular: two concentric heartbeat rings — unique radial pulse design
  cardiovascular: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeWidth="1" opacity="0.3"/>
      <circle cx="12" cy="12" r="5.5" strokeWidth="1" opacity="0.55"/>
      <circle cx="12" cy="12" r="2" fill={color} stroke="none"/>
      <line x1="12" y1="3" x2="12" y2="6" strokeWidth="1.5"/>
      <line x1="12" y1="18" x2="12" y2="21" strokeWidth="1.5"/>
      <line x1="3" y1="12" x2="6" y2="12" strokeWidth="1.5"/>
      <line x1="18" y1="12" x2="21" y2="12" strokeWidth="1.5"/>
    </svg>
  ),
  // Respiratory: two lung lobes as mirrored teardrop shapes
  respiratory: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5 C12 5 8 6 7 10 C6 14 7 18 9 19 C11 20 12 18 12 18"/>
      <path d="M12 5 C12 5 16 6 17 10 C18 14 17 18 15 19 C13 20 12 18 12 18"/>
      <line x1="12" y1="5" x2="12" y2="3" strokeWidth="1.5"/>
    </svg>
  ),
};

function calcRiskProfiles(history) {
  if (!history.length) return [];
  const risks = [];
  const entries = history.slice(-10); // last 10 entries

  // Hypertension risk
  const bpHigh = entries.filter(e => parseFloat(e.vitals.bloodPressureSystolic) > 130 || parseFloat(e.vitals.bloodPressureDiastolic) > 80);
  const bpFilled = entries.filter(e => e.vitals.bloodPressureSystolic || e.vitals.bloodPressureDiastolic);
  if (bpFilled.length > 0) {
    const pct = bpHigh.length / bpFilled.length;
    risks.push({ name:'Hypertension', level: pct >= 0.6 ? 'High' : pct >= 0.3 ? 'Moderate' : 'Low', iconKey:'hypertension', desc: pct >= 0.6 ? 'BP frequently elevated across recent entries.' : pct >= 0.3 ? 'BP occasionally elevated — monitor closely.' : 'BP consistently in healthy range.' });
  }

  // Cardiovascular risk (HR + BP combined)
  const cvHigh = entries.filter(e => parseFloat(e.vitals.heartRate) > 100 && parseFloat(e.vitals.bloodPressureSystolic) > 130);
  const cvFilled = entries.filter(e => e.vitals.heartRate && e.vitals.bloodPressureSystolic);
  if (cvFilled.length > 0) {
    const pct = cvHigh.length / cvFilled.length;
    risks.push({ name:'Cardiovascular', level: pct >= 0.4 ? 'High' : pct >= 0.2 ? 'Moderate' : 'Low', iconKey:'cardiovascular', desc: pct >= 0.4 ? 'Elevated HR and BP detected together in multiple entries.' : pct >= 0.2 ? 'Occasional HR/BP combination flagged.' : 'Heart rate and BP look healthy together.' });
  }

  // Respiratory risk
  const respHigh = entries.filter(e => parseFloat(e.vitals.oxygenSaturation) < 95 || parseFloat(e.vitals.respiratoryRate) > 20);
  const respFilled = entries.filter(e => e.vitals.oxygenSaturation || e.vitals.respiratoryRate);
  if (respFilled.length > 0) {
    const pct = respHigh.length / respFilled.length;
    risks.push({ name:'Respiratory', level: pct >= 0.5 ? 'High' : pct >= 0.25 ? 'Moderate' : 'Low', iconKey:'respiratory', desc: pct >= 0.5 ? 'Low O₂ or elevated respiratory rate in multiple entries.' : pct >= 0.25 ? 'Occasional respiratory readings outside normal range.' : 'Oxygen and breathing rate look healthy.' });
  }

  return risks;
}

const riskColor = l => l==='High' ? { text:'#8b2020', bg:'rgba(139,32,32,0.08)', border:'rgba(139,32,32,0.2)' }
                     : l==='Moderate' ? { text:'#b45309', bg:'rgba(180,83,9,0.08)', border:'rgba(180,83,9,0.2)' }
                     : { text:'#0d9488', bg:'rgba(0,196,180,0.08)', border:'rgba(0,196,180,0.25)' };

const statusColor  = st => st==='normal'?'#0d9488':st==='high'?'#8b2020':'#b45309';
const statusBg     = st => st==='normal'?'rgba(0,196,180,0.08)':st==='high'?'rgba(139,32,32,0.07)':'rgba(180,83,9,0.07)';
const statusBorder = st => st==='normal'?'rgba(0,196,180,0.28)':st==='high'?'rgba(139,32,32,0.2)':'rgba(180,83,9,0.2)';
const statusLabel  = st => st==='normal'?'✓ Normal':st==='high'?'⚠ High':'⚠ Low';

function timeAgo(ts) {
  const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), dy=Math.floor(d/86400000);
  if (m<1) return 'Just now'; if (m<60) return `${m}m ago`;
  if (h<24) return `${h}h ago`; if (dy===1) return 'Yesterday'; return `${dy}d ago`;
}

export default function Profile() {
  const [user,      setUser]      = useState(null);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed,    setNewMed]    = useState('');
  const [savedMeds, setSavedMeds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_meds') || '[]'); } catch { return []; }
  });
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return setUser(null);
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) return setUser(parsed);
        const res = await fetch(`http://localhost:8080/api/users/${parsed}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      } catch { setUser(null); }
    };
    load();
  }, []);

  const saveMed = () => {
    const t = newMed.trim();
    if (!t || savedMeds.includes(t)) return;
    const updated = [...savedMeds, t];
    setSavedMeds(updated);
    localStorage.setItem('saved_meds', JSON.stringify(updated));
    setNewMed(''); setAddingMed(false);
  };

  const removeMed = i => {
    const updated = savedMeds.filter((_,j) => j!==i);
    setSavedMeds(updated);
    localStorage.setItem('saved_meds', JSON.stringify(updated));
  };

  const vh           = JSON.parse(localStorage.getItem('vitals_history') || '[]');
  const latestEntry  = vh[vh.length - 1] || null;
  const latestVitals = latestEntry?.vitals || null;
  const score        = calcScore(latestVitals);
  const scoreDash    = score === null ? 0 : (score / 100) * 188;
  const scoreColor   = score === null ? 'rgba(255,255,255,0.3)' : score >= 80 ? '#00c4b4' : score >= 60 ? '#f59e0b' : '#e8453c';
  const scoreLabel   = score === null ? '' : score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
  const streak       = calcStreak(vh);
  const risks        = calcRiskProfiles(vh);
  const reportCard   = latestVitals ? Object.entries(VITAL_RANGES).map(([key, r]) => {
    const val = latestVitals[key];
    if (!val || val === '') return null;
    const sc = vitalScore(key, val);
    const g  = scoreToGrade(sc);
    return { key, label: r.label, unit: r.unit, val, score: sc, grade: g };
  }).filter(Boolean) : [];
  const overallGrade = scoreToGrade(score);

  if (!user) return (
    <div style={s.emptyPage}>
      <div style={s.emptyCard}>
        <div style={s.emptyIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:300, fontSize:'1.4rem', color:'var(--text-primary)', marginBottom:8 }}>No profile found</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6, marginBottom:24 }}>Create a profile to track your medications and health history.</p>
        <button onClick={() => nav('/Onboarding')} style={s.tealBtn}>Get Started →</button>
      </div>
    </div>
  );

  const initials = user.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '?';

  return (
    <div style={s.page}>
      {/* Banner */}
      <div style={s.banner}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={s.avatar}>{initials}</div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:'1.8rem', fontWeight:300, color:'#fff', marginBottom:6 }}>{user.name}</h1>
            <div style={{ display:'flex', gap:20 }}>
              {[['Age', user.age], ['Gender', user.gender], ['Entries', vh.length]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>{v||'—'}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Health score ring */}
          <div style={{ textAlign:'center' }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="6"
                strokeDasharray={`${scoreDash} 188`} strokeLinecap="round" transform="rotate(-90 36 36)"/>
              <text x="36" y="33" textAnchor="middle" fontSize="13" fontWeight="600" fill="white" fontFamily="Fraunces">
                {score === null ? '—' : score}
              </text>
              <text x="36" y="46" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.45)" fontFamily="DM Sans">SCORE</text>
            </svg>
            {scoreLabel && <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:4, textTransform:'uppercase', letterSpacing:'.05em' }}>{scoreLabel}</div>}
          </div>
        </div>
      </div>

      {/* ── Streak + Risk side by side ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Streak tracker */}
        <div style={s.card}>
          <p style={s.sl}>Logging Streak</p>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="5"/>
                <circle cx="32" cy="32" r="28" fill="none"
                  stroke={streak >= 7 ? '#e8453c' : streak >= 3 ? '#f59e0b' : '#00c4b4'}
                  strokeWidth="5"
                  strokeDasharray={`${Math.min(streak/14,1)*175.9} 175.9`}
                  strokeLinecap="round" transform="rotate(-90 32 32)"/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:"'Fraunces',serif", fontSize:'1.3rem', fontWeight:400, color:'var(--text-primary)', lineHeight:1 }}>{streak}</span>
                <span style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>days</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1rem', fontWeight:300, color:'var(--text-primary)', marginBottom:4 }}>
                {streak === 0 ? 'Start your streak' : streak === 1 ? 'First day!' : `${streak}-day streak`}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
                {streak === 0 ? 'Log vitals today to begin.' : streak < 3 ? 'Keep going — 3 days builds a habit.' : streak < 7 ? 'Great consistency! Aim for 7 days.' : 'Outstanding commitment — keep it up!'}
              </div>
              {streak > 0 && (
                <div style={{ display:'flex', gap:4, marginTop:8 }}>
                  {Array.from({ length:7 }).map((_,i) => (
                    <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < streak ? (streak>=7?'#e8453c':'#00c4b4') : 'var(--border)' }}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Latest Vitals summary */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ ...s.sl, marginBottom:0 }}>Latest Vitals</p>
            {latestEntry && <span style={{ fontSize:10, color:'var(--text-muted)' }}>{timeAgo(latestEntry.timestamp)}</span>}
          </div>
          {!latestVitals || Object.values(latestVitals).every(v=>!v||v==='') ? (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>No vitals logged yet.</p>
              <button onClick={() => nav('/InputData')} style={{ ...s.tealBtn, width:'auto', padding:'6px 14px', fontSize:12 }}>Log Now →</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {Object.entries(VITAL_RANGES).map(([key, r]) => {
                const val = latestVitals[key];
                if (!val || val==='') return null;
                const st = getStatus(key, val);
                return (
                  <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 8px', borderRadius:8, background:statusBg(st), border:`1px solid ${statusBorder(st)}` }}>
                    <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500 }}>{r.label.split(' ')[0]}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:statusColor(st) }}>{val} {r.unit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Health Report Card ── */}
      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <p style={{ ...s.sl, marginBottom:4 }}>Health Report Card</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>Individual grades based on your latest vitals</p>
          </div>
          {/* Overall grade badge */}
          <div style={{ textAlign:'center', background: score===null?'var(--surface-2)': overallGrade.color+'15', border:`2px solid ${score===null?'var(--border)':overallGrade.color}`, borderRadius:14, padding:'8px 16px', minWidth:64 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.8rem', fontWeight:400, color: score===null?'var(--text-muted)':overallGrade.color, lineHeight:1 }}>{overallGrade.grade}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3, textTransform:'uppercase', letterSpacing:'.05em' }}>Overall</div>
          </div>
        </div>

        {reportCard.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>Log your vitals to receive your report card.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {reportCard.map(item => (
              <div key={item.key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                {/* Grade badge */}
                <div style={{ width:36, height:36, borderRadius:9, background:`${item.grade.color}15`, border:`1.5px solid ${item.grade.color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:"'Fraunces',serif", fontSize:'1rem', fontWeight:400, color:item.grade.color }}>{item.grade.grade}</span>
                </div>
                {/* Label + bar */}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)' }}>{item.label}</span>
                    <span style={{ fontSize:11, color:item.grade.color, fontWeight:600 }}>{item.val} {item.unit} — {item.grade.label}</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${item.score}%`, background:item.grade.color, borderRadius:3, transition:'width .6s ease' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Risk Profile Badges ── */}
      <div style={s.card}>
        <p style={{ ...s.sl, marginBottom:4 }}>Risk Profile</p>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Based on patterns across your last {Math.min(vh.length,10)} {vh.length===1?'entry':'entries'}</p>
        {risks.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>Log at least one entry to see your risk profile.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {risks.map((r, i) => {
              const c = riskColor(r.level);
              return (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', borderRadius:13, background:c.bg, border:`1px solid ${c.border}` }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {RiskIcons[r.iconKey](c.text)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.name} Risk</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:999, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>{r.level}</span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{r.desc}</p>
                  </div>
                  {/* Risk level bar */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
                    {['High','Moderate','Low'].map((lvl,j) => (
                      <div key={j} style={{ width:6, height:6, borderRadius:'50%', background: r.level===lvl?c.text:'var(--border)' }}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {vh.length < 3 && risks.length > 0 && (
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:12, fontStyle:'italic' }}>⚠ Risk profile improves in accuracy with more entries. Log regularly for better insights.</p>
        )}
      </div>

      {/* ── Medications ── */}
      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ ...s.sl, marginBottom:0 }}>Medications</p>
          <button onClick={() => setAddingMed(a=>!a)} style={{ ...s.tealBtn, width:'auto', padding:'6px 14px', fontSize:12 }}>
            {addingMed ? 'Cancel' : '+ Add'}
          </button>
        </div>
        {addingMed && (
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <input type="text" placeholder="Medication name (e.g. Metformin)" value={newMed}
              onChange={e => setNewMed(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') saveMed(); }}
              style={s.inp} autoFocus/>
            <button onClick={saveMed} style={{ ...s.tealBtn, width:'auto', padding:'8px 16px', fontSize:13, flexShrink:0 }}>Add</button>
          </div>
        )}
        {savedMeds.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 0' }}>No medications added yet.</p>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {savedMeds.map((med, i) => (
              <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:999, border:'1px solid var(--border)', background:'var(--surface-2)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a4a5c" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
                  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
                </svg>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{med}</span>
                <button onClick={() => removeMed(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0, display:'flex', alignItems:'center', marginLeft:2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── History ── */}
      <div style={s.card}>
        <p style={s.sl}>Analysis History</p>
        {vh.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 0' }}>No history yet.</p>
        ) : (
          [...vh].reverse().slice(0,5).map((entry, i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 0', borderBottom: i<Math.min(vh.length,5)-1?'1px solid var(--border)':'none' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:i%2===0?'#00c4b4':'#e8453c', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>
                  {new Date(entry.timestamp).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {Object.entries(VITAL_RANGES).filter(([k]) => entry.vitals[k]&&entry.vitals[k]!=='').map(([k,r]) => `${r.label.split(' ')[0]}: ${entry.vitals[k]}`).join(' · ')}
                </div>
              </div>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{timeAgo(entry.timestamp)}</span>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button onClick={() => nav('/Trends')} style={s.tealBtn}>View Trends →</button>
        <button onClick={() => nav('/InputData')} style={s.redBtn}>Log Vitals →</button>
      </div>
    </div>
  );
}

const s = {
  page:      { maxWidth:720, margin:'0 auto', padding:'0 0 80px', fontFamily:"'DM Sans',sans-serif" },
  banner:    { background:'linear-gradient(135deg,#0a4a5c 0%,#0d6b80 55%,#008a7d 100%)', padding:'36px 32px', marginBottom:24 },
  avatar:    { width:58, height:58, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.35)', color:'white', fontSize:'1.1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  card:      { background:'var(--surface)', borderRadius:20, border:'1px solid var(--border)', padding:'22px 26px', marginBottom:14, boxShadow:'var(--shadow-sm)' },
  sl:        { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:16 },
  inp:       { flex:1, padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-2)', fontSize:14, color:'var(--text-primary)', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  tealBtn:   { width:'100%', padding:12, borderRadius:12, border:'none', background:'linear-gradient(135deg,#0a4a5c,#00c4b4)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(10,74,92,0.28)' },
  redBtn:    { padding:12, borderRadius:12, border:'none', background:'linear-gradient(135deg,#8b2020,#e8453c)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(139,32,32,0.28)' },
  emptyPage: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'var(--bg)', fontFamily:"'DM Sans',sans-serif" },
  emptyCard: { background:'var(--surface)', borderRadius:24, border:'1px solid var(--border)', padding:'48px 40px', textAlign:'center', maxWidth:360, width:'100%', boxShadow:'var(--shadow-md)' },
  emptyIcon: { width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#0a4a5c,#00c4b4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 6px 20px rgba(10,74,92,0.3)' },
};