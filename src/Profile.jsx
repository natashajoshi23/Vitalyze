import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMobile from './useIsMobile';

const NR = {
  heartRate:              { min:60, max:100, label:'Heart Rate',    unit:'bpm',    color:'#e8453c' },
  bloodPressureSystolic:  { min:90, max:120, label:'BP Systolic',   unit:'mmHg',   color:'#8b2020' },
  bloodPressureDiastolic: { min:60, max:80,  label:'BP Diastolic',  unit:'mmHg',   color:'#0a4a5c' },
  oxygenSaturation:       { min:95, max:100, label:'O₂ Saturation', unit:'%',      color:'#00c4b4' },
  temperature:            { min:97, max:99,  label:'Temperature',   unit:'°F',     color:'#f59e0b' },
  respiratoryRate:        { min:12, max:20,  label:'Resp. Rate',    unit:'br/min', color:'#0d6b80' },
};
function gs(k, v) {
  const r = NR[k]; if (!r||v===''||v===undefined) return null;
  const n = parseFloat(v); return n < r.min ? 'low' : n > r.max ? 'high' : 'normal';
}
function calcStreak(history) {
  if (!history.length) return 0;
  let s = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  const days = new Set(history.map(e => new Date(e.timestamp).toISOString().slice(0,10)));
  while (days.has(d.toISOString().slice(0,10))) { s++; d.setDate(d.getDate()-1); }
  return s;
}

const ACHIEVEMENTS = [
  { id:'first_entry',    icon:'🩺', title:'First Checkup',   desc:'Logged your first vitals',    check: h => h.length >= 1 },
  { id:'streak_3',       icon:'🔥', title:'3-Day Streak',    desc:'Logged 3 days in a row',       check: h => calcStreak(h) >= 3 },
  { id:'streak_7',       icon:'⚡', title:'Weekly Warrior',  desc:'7-day logging streak',         check: h => calcStreak(h) >= 7 },
  { id:'streak_30',      icon:'🏆', title:'30-Day Champion', desc:'30-day logging streak',        check: h => calcStreak(h) >= 30 },
  { id:'ten_entries',    icon:'📊', title:'Data Driven',     desc:'Logged 10+ readings',          check: h => h.length >= 10 },
  { id:'all_normal',     icon:'✅', title:'All Green',        desc:'All vitals normal at once',   check: h => h.some(e => Object.keys(NR).filter(k=>e.vitals?.[k]).every(k=>gs(k,e.vitals[k])==='normal')) },
  { id:'all_vitals',     icon:'🔬', title:'Full Panel',       desc:'All 6 vitals logged at once', check: h => h.some(e => Object.keys(NR).every(k=>e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined)) },
  { id:'twenty_entries', icon:'🚀', title:'Power User',       desc:'Logged 20+ readings',         check: h => h.length >= 20 },
];

export default function Profile() {
  const mob = useIsMobile();
  const nav = useNavigate();
  const history = JSON.parse(localStorage.getItem('vitals_history') || '[]');
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('user_profile') || '{}'));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:'', age:'', gender:'', conditions:'', ...profile });

  const streak   = calcStreak(history);
  const n        = history.length;
  const unlocked = ACHIEVEMENTS.filter(a => a.check(history));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(history));

  const totalVitals = history.reduce((acc,e) => acc + Object.keys(NR).filter(k=>e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined).length, 0);
  const totalNormal = history.reduce((acc,e) => {
    const fv = Object.keys(NR).filter(k=>e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined);
    return acc + fv.filter(k=>gs(k,e.vitals[k])==='normal').length;
  }, 0);
  const score      = totalVitals ? Math.round((totalNormal/totalVitals)*100) : null;
  const scoreColor = score===null?'rgba(255,255,255,0.15)':score>=80?'#00c4b4':score>=60?'#f59e0b':'#e8453c';
  const scoreDash  = score ? (score/100)*188.5 : 0;
  const scoreLabel = score===null?'No data yet':score>=80?'Excellent health score':score>=60?'Fair — room to improve':'Needs attention';

  const lastEntry  = history.length ? new Date(history[history.length-1].timestamp) : null;
  const lastLabel  = lastEntry ? lastEntry.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null;
  const latestEntry = history.length ? history[history.length-1] : null;
  const initials   = (profile.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  const save = () => { localStorage.setItem('user_profile', JSON.stringify(form)); setProfile(form); setEditing(false); };
  const startEdit = () => {
    // Re-read from localStorage so we always have the latest saved values
    const latest = JSON.parse(localStorage.getItem('user_profile') || '{}');
    setForm({ name:'', age:'', gender:'', conditions:'', ...latest });
    setEditing(true);
  };

  return (
    <div style={s.page}>
      {/* ── Banner ── */}
      <div style={s.banner}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'url(/images/wellness-walk.jpg)',backgroundSize:'cover',backgroundPosition:'center 35%' }}/>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(110deg,rgba(8,24,34,0.97) 0%,rgba(10,74,92,0.92) 45%,rgba(0,138,125,0.55) 80%,rgba(0,138,125,0.15) 100%)' }}/>
        {/* decorative rings */}
        <div style={{ position:'absolute',right:-60,top:-60,width:300,height:300,borderRadius:'50%',border:'1px solid rgba(0,196,180,0.1)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',right:-20,top:-20,width:180,height:180,borderRadius:'50%',border:'1px solid rgba(0,196,180,0.08)',pointerEvents:'none' }}/>

        <div style={{ position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto' }}>
          <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,0.45)',marginBottom:24 }}>Your Profile</div>

          <div style={{ display:'flex',alignItems:'center',gap:22,marginBottom:32 }}>
            {/* Avatar */}
            <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,196,180,0.4),rgba(10,74,92,0.8))',border:'2px solid rgba(0,196,180,0.45)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 0 6px rgba(0,196,180,0.08)' }}>
              <span style={{ fontFamily:"'Fraunces',serif",fontSize:'1.8rem',fontWeight:300,color:'white' }}>{initials}</span>
            </div>
            <div>
              <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:'2.2rem',fontWeight:300,letterSpacing:'-.02em',color:'#fff',lineHeight:1,marginBottom:6 }}>
                {profile.name || 'Your Profile'}
              </h1>
              <p style={{ fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.5 }}>
                {[profile.age && `${profile.age} yrs`, profile.gender, profile.conditions].filter(Boolean).join(' · ') || 'Add your details below'}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(5,1fr)', gap:0, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            {[
              { val: score !== null ? `${score}` : '—', suffix: score !== null ? '%' : '', lbl:'Health Score', color: scoreColor },
              { val: n,       suffix:'',    lbl:'Total Entries',   color:'rgba(255,255,255,0.9)' },
              { val: streak,  suffix: streak > 0 ? ' day' : '',  lbl:'Current Streak', color: streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.9)' },
              { val: unlocked.length, suffix:`/${ACHIEVEMENTS.length}`, lbl:'Achievements', color:'#00c4b4' },
              { val: lastLabel || '—', suffix:'', lbl:'Last Entry', color:'rgba(255,255,255,0.9)' },
            ].map((item, i, arr) => (
              <div key={i} style={{ padding: mob ? '12px 14px' : '18px 20px', borderRight: (!mob && i < arr.length-1) ? '1px solid rgba(255,255,255,0.07)' : 'none', borderBottom: mob ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily:"'Fraunces',serif",fontSize: mob ? '1.1rem' : '1.4rem',fontWeight:300,color:item.color,lineHeight:1,marginBottom:4 }}>
                  {item.val}<span style={{ fontSize:'0.8rem' }}>{item.suffix}</span>
                </div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.07em' }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...s.inner, padding: mob ? '20px 16px 0' : '20px 32px 0' }}>
        <div style={{ display:'grid',gridTemplateColumns: mob ? '1fr' : '1fr 1fr',gap:14,alignItems:'start' }}>

          {/* ── Left column ── */}
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>

            {/* Health score card */}
            <div style={{ ...s.card, background:'linear-gradient(135deg,rgba(10,74,92,0.04),rgba(0,196,180,0.04))', borderColor:'rgba(0,196,180,0.2)', display:'flex', alignItems:'center', gap:20 }}>
              <svg width="90" height="90" viewBox="0 0 80 80" style={{ flexShrink:0 }}>
                <circle cx="40" cy="40" r="30" fill="rgba(10,74,92,0.06)" stroke="var(--border)" strokeWidth="6"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke={scoreColor === 'rgba(255,255,255,0.15)' ? 'var(--border)' : scoreColor} strokeWidth="6"
                  strokeDasharray={`${scoreDash} 188.5`} strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition:'stroke-dasharray .8s ease' }}/>
                <text x="40" y="35" textAnchor="middle" fontSize="16" fontWeight="300" fill="var(--text-primary)" fontFamily="Fraunces">{score ?? '—'}</text>
                <text x="40" y="47" textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontFamily="DM Sans">HEALTH</text>
              </svg>
              <div>
                <div style={{ fontFamily:"'Fraunces',serif",fontSize:'1.05rem',fontWeight:300,color:'var(--text-primary)',marginBottom:5 }}>{scoreLabel}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)',lineHeight:1.6 }}>Based on {n} reading{n!==1?'s':''} across all your logged vitals</div>
                {lastLabel && <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Last entry: {lastLabel}</div>}
              </div>
            </div>

            {/* Nature strip */}
            <div style={{ borderRadius:20, overflow:'hidden', height:110, position:'relative' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/runner.jpg)', backgroundSize:'cover', backgroundPosition:'center 30%' }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(8,24,34,0.94) 0%,rgba(10,74,92,0.65) 55%,transparent 100%)' }}/>
              <div style={{ position:'relative', zIndex:1, padding:'22px 26px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.05rem', fontWeight:300, color:'white', lineHeight:1.4, marginBottom:3 }}>
                    Your health journey, all in one place.
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Every reading tells a story.</div>
                </div>
              </div>
            </div>

            {/* Smart Features quick-access */}
            <div style={s.card}>
              <p style={{ ...s.sl, marginBottom:14 }}>Smart Features</p>
              <div style={{ display:'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap:10 }}>
                <div onClick={() => nav('/Results')} style={{ cursor:'pointer', borderRadius:14, padding:'14px 16px', background:'rgba(13,107,128,0.05)', border:'1px solid rgba(13,107,128,0.18)', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(13,107,128,0.1)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(13,107,128,0.05)'}>
                  <div style={{ fontSize:22, marginBottom:7 }}>🧬</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:3 }}>Biological Age</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>See how your vitals compare to your chronological age.</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#0d6b80', marginTop:8 }}>View on Results →</div>
                </div>
                <div onClick={() => nav('/InputData')} style={{ cursor:'pointer', borderRadius:14, padding:'14px 16px', background:'rgba(13,107,128,0.05)', border:'1px solid rgba(13,107,128,0.18)', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(13,107,128,0.1)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(13,107,128,0.05)'}>
                  <div style={{ fontSize:22, marginBottom:7 }}>💊</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:3 }}>Drug Interactions</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>Check your medications for known dangerous combinations.</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#0d6b80', marginTop:8 }}>Go to Vitals → Prescriptions →</div>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div style={s.card}>
              {/* Incomplete profile nudge */}
              {!editing && (!profile.age || !profile.gender) && (
                <div onClick={startEdit} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,background:'rgba(13,107,128,0.08)',border:'1px solid rgba(13,107,128,0.2)',marginBottom:14,cursor:'pointer' }}>
                  <span style={{ fontSize:16 }}>✏️</span>
                  <div>
                    <div style={{ fontSize:12,fontWeight:600,color:'#0d6b80' }}>Complete your profile</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>Add your age &amp; gender to unlock the Biological Age Estimator on Results</div>
                  </div>
                  <span style={{ marginLeft:'auto',fontSize:11,fontWeight:600,color:'#0d6b80' }}>Edit →</span>
                </div>
              )}
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
                <p style={s.sl}>Personal Info</p>
                {!editing ? (
                  <button onClick={startEdit} style={s.editBtn}>Edit</button>
                ) : (
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={save} style={{ ...s.editBtn,background:'linear-gradient(135deg,#0a4a5c,#00c4b4)',color:'white',border:'none',padding:'5px 16px' }}>Save</button>
                    <button onClick={() => { setEditing(false); setForm({name:'',age:'',gender:'',conditions:'',...profile}); }} style={s.editBtn}>Cancel</button>
                  </div>
                )}
              </div>
              {!editing ? (
                <div>
                  {[
                    { lbl:'Name', val:profile.name||'—', icon:'👤' },
                    { lbl:'Age', val:profile.age?`${profile.age} years`:'—', icon:'🗓' },
                    { lbl:'Gender', val:profile.gender||'—', icon:'⚧' },
                    { lbl:'Conditions', val:profile.conditions||'—', icon:'🏥' },
                  ].map((row,i,arr) => (
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                      <span style={{ fontSize:15,width:24,textAlign:'center',flexShrink:0 }}>{row.icon}</span>
                      <span style={{ fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',width:80,flexShrink:0 }}>{row.lbl}</span>
                      <span style={{ fontSize:13,color:'var(--text-primary)',fontWeight:500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {[
                    { key:'name', label:'Name', placeholder:'Full name', type:'text' },
                    { key:'age',  label:'Age',  placeholder:'e.g. 28',   type:'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={s.fldLabel}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                        placeholder={f.placeholder} style={s.fldInp}/>
                    </div>
                  ))}
                  <div>
                    <label style={s.fldLabel}>Gender</label>
                    <select value={form.gender} onChange={e => setForm({...form, gender:e.target.value})} style={s.fldInp}>
                      <option value="">Select gender</option>
                      <option>Female</option><option>Male</option><option>Non-binary</option>
                      <option>Transgender Female</option><option>Transgender Male</option>
                      <option>Genderqueer</option><option>Prefer not to say</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.fldLabel}>Health Conditions</label>
                    <input type="text" value={form.conditions} onChange={e => setForm({...form, conditions:e.target.value})}
                      placeholder="e.g. Hypertension, Diabetes" style={s.fldInp}/>
                    <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:4 }}>Separate with commas — used for personalised insights</div>
                  </div>
                  {/* Bio age nudge */}
                  {!form.age && (
                    <div style={{ fontSize:12,color:'#0d6b80',background:'rgba(13,107,128,0.07)',border:'1px solid rgba(13,107,128,0.18)',borderRadius:9,padding:'8px 12px' }}>
                      💡 Add your age to unlock the <strong>Biological Age Estimator</strong> on the Results page
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Latest vitals snapshot */}
            {latestEntry && (
              <div style={s.card}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
                  <p style={s.sl}>Latest Snapshot</p>
                  <button onClick={() => nav('/Results')} style={s.editBtn}>Full Results →</button>
                </div>
                <div style={{ display:'grid',gridTemplateColumns: mob ? '1fr' : '1fr 1fr',gap:8 }}>
                  {Object.entries(NR).filter(([k]) => latestEntry.vitals?.[k]!==''&&latestEntry.vitals?.[k]!==undefined).map(([k,r]) => {
                    const st = gs(k, latestEntry.vitals[k]);
                    const c  = st==='normal'?'#0d9488':st==='high'?'#8b2020':'#b45309';
                    const bg = st==='normal'?'rgba(0,196,180,0.06)':st==='high'?'rgba(139,32,32,0.05)':'rgba(180,83,9,0.05)';
                    const bdr= st==='normal'?'rgba(0,196,180,0.2)':st==='high'?'rgba(139,32,32,0.15)':'rgba(180,83,9,0.15)';
                    return (
                      <div key={k} style={{ padding:'10px 12px',borderRadius:12,background:bg,border:`1px solid ${bdr}` }}>
                        <div style={{ fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3 }}>{r.label}</div>
                        <div style={{ fontFamily:"'Fraunces',serif",fontSize:'1.2rem',fontWeight:300,color:'var(--text-primary)',lineHeight:1 }}>
                          {latestEntry.vitals[k]} <span style={{ fontSize:10,color:'var(--text-muted)',fontFamily:"'DM Sans',sans-serif" }}>{r.unit}</span>
                        </div>
                        <div style={{ fontSize:10,fontWeight:700,color:c,marginTop:4 }}>{st==='normal'?'✓ Normal':st==='high'?'↑ High':'↓ Low'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>

            {/* Medical book strip */}
            <div style={{ borderRadius:20, overflow:'hidden', height:110, position:'relative' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/stethoscope-notes.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%' }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(8,24,34,0.95) 0%,rgba(10,74,92,0.7) 55%,transparent 100%)' }}/>
              <div style={{ position:'relative', zIndex:1, padding:'22px 26px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.05rem', fontWeight:300, color:'white', lineHeight:1.4, marginBottom:3 }}>
                    Knowledge is the best medicine.
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Track. Understand. Improve.</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div style={s.card}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
                <p style={s.sl}>Achievements</p>
                <span style={{ fontSize:11,fontWeight:700,color:'#00c4b4',background:'rgba(0,196,180,0.1)',padding:'3px 11px',borderRadius:999,border:'1px solid rgba(0,196,180,0.25)' }}>
                  {unlocked.length} / {ACHIEVEMENTS.length}
                </span>
              </div>

              {n === 0 && (
                <div style={{ textAlign:'center',padding:'28px 0',color:'var(--text-muted)',fontSize:13 }}>
                  Log your first vitals to start earning achievements
                </div>
              )}

              {unlocked.length > 0 && (
                <div style={{ display:'grid',gridTemplateColumns: mob ? '1fr' : '1fr 1fr',gap:8,marginBottom: locked.length > 0 ? 14 : 0 }}>
                  {unlocked.map(a => (
                    <div key={a.id} style={{ borderRadius:14,padding:'16px 14px',background:'linear-gradient(135deg,rgba(0,196,180,0.09),rgba(10,74,92,0.05))',border:'1px solid rgba(0,196,180,0.28)',position:'relative',overflow:'hidden' }}>
                      <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,#00c4b4,#0a4a5c)' }}/>
                      <div style={{ fontSize:24,marginBottom:8 }}>{a.icon}</div>
                      <div style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',marginBottom:3 }}>{a.title}</div>
                      <div style={{ fontSize:11,color:'var(--text-muted)',lineHeight:1.5 }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {locked.length > 0 && (
                <>
                  <p style={{ fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8 }}>Locked</p>
                  <div style={{ display:'grid',gridTemplateColumns: mob ? '1fr' : '1fr 1fr',gap:8 }}>
                    {locked.map(a => (
                      <div key={a.id} style={{ borderRadius:14,padding:'16px 14px',background:'var(--surface-2)',border:'1px solid var(--border)',opacity:.5 }}>
                        <div style={{ fontSize:24,marginBottom:8,filter:'grayscale(1)' }}>{a.icon}</div>
                        <div style={{ fontSize:13,fontWeight:700,color:'var(--text-secondary)',marginBottom:3 }}>{a.title}</div>
                        <div style={{ fontSize:11,color:'var(--text-muted)',lineHeight:1.5 }}>{a.desc}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick actions */}
            <div style={s.card}>
              <p style={{ ...s.sl,marginBottom:14 }}>Quick Actions</p>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {[
                  { label:'Log New Vitals', path:'/InputData', grad:'linear-gradient(135deg,#0a4a5c,#0d6b80)',
                    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
                  { label:'View Results',   path:'/Results',   grad:'linear-gradient(135deg,#0d9488,#00c4b4)',
                    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> },
                  { label:'View Trends',    path:'/Trends',    grad:'linear-gradient(135deg,#8b2020,#e8453c)',
                    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg> },
                ].map((item,i) => (
                  <button key={i} onClick={() => nav(item.path)}
                    style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface-2)',color:'var(--text-primary)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = item.grad; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                    {item.icon}
                    {item.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft:'auto' }}><polyline points="9,18 15,12 9,6"/></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Data & privacy */}
            <div style={{ ...s.card, background:'rgba(139,32,32,0.02)', borderColor:'rgba(139,32,32,0.12)' }}>
              <p style={{ ...s.sl,marginBottom:10,color:'#8b2020' }}>Data & Privacy</p>
              <p style={{ fontSize:12,color:'var(--text-muted)',lineHeight:1.7,marginBottom:14 }}>
                All your vitals are stored <strong>locally in your browser</strong>. We never send your personal data to any server. You own your data completely.
              </p>
              <button onClick={() => { if(confirm('Delete ALL your data? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }}
                style={{ fontSize:12,color:'#8b2020',background:'rgba(139,32,32,0.07)',border:'1px solid rgba(139,32,32,0.18)',borderRadius:9,padding:'7px 14px',cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}>
                Delete All My Data
              </button>
            </div>
          </div>
        </div>

        {/* ── Motivational strip ── */}
        <div style={{ borderRadius:20,overflow:'hidden',height:150,position:'relative',marginTop:14 }}>
          <div style={{ position:'absolute',inset:0,backgroundImage:'url(/images/warrior-sunset.jpg)',backgroundSize:'cover',backgroundPosition:'center 15%' }}/>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(8,20,30,0.88) 0%,rgba(10,74,92,0.5) 45%,rgba(10,74,92,0.1) 100%)' }}/>
          <div style={{ position:'relative',zIndex:1,padding: mob ? '20px 20px' : '32px 36px',height:'100%',display:'flex',flexDirection: mob ? 'column' : 'row',alignItems: mob ? 'flex-start' : 'center',gap:16,justifyContent:'center' }}>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif",fontSize: mob ? '1rem' : '1.15rem',fontWeight:300,color:'white',marginBottom:5 }}>Consistency is the key to better health.</div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)' }}>Even one reading a day builds a picture your doctor can act on.</div>
            </div>
            <button onClick={() => nav('/InputData')} style={{ flexShrink:0,padding:'9px 20px',borderRadius:10,border:'none',background:'white',color:'#0a4a5c',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',boxShadow:'0 2px 12px rgba(0,0,0,0.2)', marginLeft: mob ? 0 : 'auto' }}>
              Log Today's Vitals →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:    { fontFamily:"'DM Sans',sans-serif",background:'var(--bg)',minHeight:'100vh',paddingBottom:80 },
  banner:  { minHeight:260, padding:'52px 16px 0',position:'relative',overflow:'hidden' },
  inner:   { maxWidth:1100,margin:'0 auto',padding:'20px 32px 0' },
  card:    { background:'var(--surface)',borderRadius:20,border:'1px solid var(--border)',padding:22,boxShadow:'var(--shadow-sm)' },
  sl:      { fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',margin:0 },
  editBtn:  { fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface-2)',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'inherit' },
  fldLabel: { fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:5 },
  fldInp:   { width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface-2)',color:'var(--text-primary)',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box' },
};
