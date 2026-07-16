import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMobile from './useIsMobile';

const NR = {
  heartRate:              { min:60,  max:100, unit:'bpm',    label:'Heart Rate',   color:'#e8453c', short:'HR' },
  bloodPressureSystolic:  { min:90,  max:120, unit:'mmHg',   label:'BP Systolic',  color:'#8b2020', short:'BPS' },
  bloodPressureDiastolic: { min:60,  max:80,  unit:'mmHg',   label:'BP Diastolic', color:'#0a4a5c', short:'BPD' },
  oxygenSaturation:       { min:95,  max:100, unit:'%',      label:'O₂ Sat',       color:'#00c4b4', short:'O₂' },
  temperature:            { min:97,  max:99,  unit:'°F',     label:'Temperature',  color:'#f59e0b', short:'Temp' },
  respiratoryRate:        { min:12,  max:20,  unit:'br/min', label:'Resp. Rate',   color:'#0d6b80', short:'RR' },
};

function gs(k, v) {
  const r = NR[k]; if (!r||v===''||v===undefined) return null;
  const n = parseFloat(v); return n < r.min ? 'low' : n > r.max ? 'high' : 'normal';
}

function ScoreTrendChart({ history }) {
  const scores = history.map(e => {
    const fv = Object.keys(NR).filter(k => e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined);
    return fv.length ? Math.round(fv.filter(k=>gs(k,e.vitals[k])==='normal').length/fv.length*100) : null;
  }).filter(s => s !== null);
  if (scores.length < 2) return null;
  const W=300, H=70;
  const pts = scores.map((s,i) => `${(i/(scores.length-1))*W},${H-((s/100)*(H-12)+6)}`).join(' ');
  const area = `${pts} ${W},${H} 0,${H}`;
  const trend = scores[scores.length-1] - scores[0];
  const trendCol = trend >= 0 ? '#0d9488' : '#e8453c';
  return (
    <div style={{ background:'var(--surface)', borderRadius:18, border:'1px solid var(--border)', padding:'18px 22px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)' }}>Health Score Trend</span>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontFamily:"'Fraunces',serif", fontSize:'1.1rem', fontWeight:300, color:trendCol }}>{trend>=0?'+':''}{trend}%</span>
            <span style={{ fontSize:10, color:'var(--text-muted)', marginLeft:4 }}>overall</span>
          </div>
          <div style={{ fontSize:22, fontWeight:300, fontFamily:"'Fraunces',serif", color: scores[scores.length-1]>=80?'#0d9488':scores[scores.length-1]>=60?'#b45309':'#e8453c' }}>{scores[scores.length-1]}%</div>
        </div>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block'}}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c4b4" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#00c4b4" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#scoreGrad)"/>
        <polyline points={pts} fill="none" stroke="#00c4b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {scores.map((sc,i) => <circle key={i} cx={(i/(scores.length-1))*W} cy={H-((sc/100)*(H-12)+6)} r="3.5" fill="#00c4b4" stroke="white" strokeWidth="1.5"/>)}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>First entry</span>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>Latest</span>
      </div>
    </div>
  );
}

function AnomalyAlerts({ history }) {
  if (history.length < 3) return null;
  const alerts = [];
  Object.entries(NR).forEach(([key, r]) => {
    const vals = history.slice(-5).map(e => parseFloat(e.vitals?.[key])).filter(v => !isNaN(v));
    if (vals.length < 3) return;
    const delta = vals[vals.length-1] - vals[0];
    const rising   = vals.every((v,i) => i===0 || v >= vals[i-1]-0.5);
    const falling  = vals.every((v,i) => i===0 || v <= vals[i-1]+0.5);
    const threshold = (r.max - r.min) * 0.12;
    if (Math.abs(delta) >= threshold) {
      if (rising && delta > 0)  alerts.push({ key, label:r.label, unit:r.unit, dir:'rising',  delta:Math.abs(delta).toFixed(1), n:vals.length, bad: vals[vals.length-1] > r.max });
      if (falling && delta < 0) alerts.push({ key, label:r.label, unit:r.unit, dir:'falling', delta:Math.abs(delta).toFixed(1), n:vals.length, bad: vals[vals.length-1] < r.min });
    }
  });
  if (!alerts.length) return null;
  return (
    <div style={{ background:'var(--surface)', borderRadius:18, border:'1px solid rgba(245,158,11,0.25)', padding:'18px 22px', marginBottom:12, boxShadow:'var(--shadow-sm)' }}>
      <p style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)',marginBottom:12 }}>Trend Alerts</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {alerts.map((a,i) => {
          const col = a.bad ? '#8b2020' : '#b45309';
          const bg  = a.bad ? 'rgba(139,32,32,0.06)' : 'rgba(180,83,9,0.06)';
          const bdr = a.bad ? 'rgba(139,32,32,0.18)' : 'rgba(180,83,9,0.18)';
          return (
            <div key={i} style={{ borderRadius:12, padding:'12px 14px', background:bg, border:`1px solid ${bdr}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:col, marginBottom:4 }}>
                {a.label} {a.dir === 'rising' ? '↑' : '↓'} {a.dir} {a.delta} {a.unit} over {a.n} readings
              </div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {a.bad ? '⚠️ Now outside the normal range — consider discussing this trend with your doctor.' : `Consistent ${a.dir} trend detected. Monitor closely over your next few readings.`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sparkline({ values, color }) {
  if (values.length < 2) return <div style={{ height:36 }}/>;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 36;
  const pts = values.map((v,i) => `${(i/(values.length-1))*W},${H-(((v-min)/range)*(H-6)+3)}`).join(' ');
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function VitalCard({ vKey, r, history }) {
  const vals = history.map(e => parseFloat(e.vitals?.[vKey])).filter(v => !isNaN(v));
  if (!vals.length) return null;
  const latest = vals[vals.length - 1];
  const prev   = vals.length > 1 ? vals[vals.length - 2] : null;
  const delta  = prev !== null ? latest - prev : null;
  const pct    = Math.round(history.filter(e => gs(vKey, e.vitals?.[vKey]) === 'normal').length / history.length * 100);
  const status = gs(vKey, latest);
  const col    = status === 'normal' ? '#0d9488' : status === 'high' ? '#8b2020' : '#b45309';
  const bg     = status === 'normal' ? 'rgba(0,196,180,0.05)' : status === 'high' ? 'rgba(232,69,60,0.04)' : 'rgba(245,158,11,0.04)';
  const bdr    = status === 'normal' ? 'rgba(0,196,180,0.22)' : status === 'high' ? 'rgba(232,69,60,0.18)' : 'rgba(245,158,11,0.18)';

  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:16, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      {/* colored top accent */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:r.color,opacity:0.5 }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-muted)', marginBottom:3 }}>{r.label}</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.6rem', fontWeight:300, color:'var(--text-primary)', letterSpacing:'-.02em', lineHeight:1 }}>
            {latest}<span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontWeight:400, marginLeft:4 }}>{r.unit}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          {delta !== null && delta !== 0 && (
            <div style={{ fontSize:11, fontWeight:700, color: delta > 0 ? '#8b2020' : '#0d9488', marginBottom:2 }}>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </div>
          )}
          <div style={{ fontSize:12, fontWeight:700, color: col }}>{pct}%</div>
          <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>normal</div>
        </div>
      </div>
      <Sparkline values={vals} color={r.color} />
    </div>
  );
}

export default function Trends() {
  const mob = useIsMobile();
  const nav = useNavigate();
  const history = JSON.parse(localStorage.getItem('vitals_history') || '[]');
  const n = history.length;

  const lastDate  = n ? new Date(history[n-1].timestamp) : null;
  const daysSince = lastDate ? Math.floor((Date.now() - lastDate) / 86400000) : null;
  const lastLabel = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : daysSince !== null ? `${daysSince}d ago` : '—';

  const streak = useMemo(() => {
    if (!n) return 0;
    let s = 0;
    const d = new Date(); d.setHours(0,0,0,0);
    const days = new Set(history.map(e => new Date(e.timestamp).toISOString().slice(0,10)));
    while (days.has(d.toISOString().slice(0,10))) { s++; d.setDate(d.getDate()-1); }
    return s;
  }, [history]);

  const totalNormal = history.reduce((acc,e) => {
    const fv = Object.keys(NR).filter(k=>e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined);
    return acc + fv.filter(k=>gs(k,e.vitals[k])==='normal').length;
  }, 0);
  const totalVitals = history.reduce((acc,e) => acc + Object.keys(NR).filter(k=>e.vitals?.[k]!==''&&e.vitals?.[k]!==undefined).length, 0);
  const overallPct  = totalVitals ? Math.round((totalNormal/totalVitals)*100) : null;
  const ringColor   = overallPct >= 80 ? '#00c4b4' : overallPct >= 60 ? '#f59e0b' : '#e8453c';
  const ringDash    = overallPct ? (overallPct/100)*188.5 : 0;

  return (
    <div style={s.page}>
      {/* ── Banner ── */}
      <div style={s.banner}>
        <div style={{ position:'absolute',inset:0,backgroundImage:'url(/images/running-road.jpg)',backgroundSize:'cover',backgroundPosition:'center 40%' }}/>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(110deg,rgba(8,26,36,0.97) 0%,rgba(10,74,92,0.9) 50%,rgba(0,138,125,0.4) 100%)' }}/>
        {/* Wave decoration */}
        <svg style={{ position:'absolute',bottom:-1,left:0,right:0,pointerEvents:'none' }} height="28" viewBox="0 0 1440 28" preserveAspectRatio="none">
          <path d="M0,28 C360,0 720,28 1080,8 C1260,0 1380,12 1440,28 Z" fill="var(--bg)"/>
        </svg>
        <div style={{ position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding: mob ? '0 16px' : '0 32px',display:'flex',justifyContent:'space-between',alignItems:'flex-end' }}>
          <div style={{ paddingBottom:8 }}>
            <div style={s.ey}>History</div>
            <h1 style={s.ti}>Your Trends</h1>
            <p style={{ fontSize:14,color:'rgba(255,255,255,0.55)',marginTop:8,lineHeight:1.6 }}>Track how your vitals evolve over time.</p>
            {n > 0 && (
              <div style={{ display:'flex',gap:24,marginTop:20,flexWrap:'wrap' }}>
                {[
                  { val:n,      lbl:'total entries',   color:'rgba(255,255,255,0.9)' },
                  { val:streak > 0 ? `${streak} day` : '—', lbl:'streak', color:'#f59e0b' },
                  { val:lastLabel, lbl:'last entry',   color:'rgba(255,255,255,0.9)' },
                ].map((item,i) => (
                  <div key={i}>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:'1.3rem',fontWeight:300,color:item.color,lineHeight:1 }}>{item.val}</div>
                    <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.07em',marginTop:4 }}>{item.lbl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {overallPct !== null && !mob && (
            <div style={{ textAlign:'center',flexShrink:0 }}>
              <svg width="90" height="90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke={ringColor} strokeWidth="6"
                  strokeDasharray={`${ringDash} 188.5`} strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition:'stroke-dasharray .8s ease' }}/>
                <text x="40" y="35" textAnchor="middle" fontSize="16" fontWeight="300" fill="white" fontFamily="Fraunces">{overallPct}%</text>
                <text x="40" y="47" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="DM Sans">NORMAL</text>
              </svg>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.05em',marginTop:4 }}>all time</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.inner, padding: mob ? '20px 16px 0' : '20px 32px 0' }}>
        {n === 0 && (
          <div style={s.empty}>
            <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,rgba(10,74,92,0.08),rgba(0,196,180,0.08))',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            </div>
            <p style={{ fontFamily:"'Fraunces',serif",fontWeight:300,fontSize:'1.25rem',color:'var(--text-primary)',marginBottom:8 }}>No history yet</p>
            <p style={{ color:'var(--text-muted)',fontSize:14,marginBottom:24 }}>Submit your first vitals reading to see trends here.</p>
            <button onClick={() => nav('/InputData')} style={s.btn}>Enter Vitals →</button>
          </div>
        )}

        {n > 0 && (
          <>
            {/* Score trend chart */}
            <ScoreTrendChart history={history} />

            {/* Anomaly alerts */}
            <AnomalyAlerts history={history} />

            {/* Vital sparkline cards */}
            <div style={{ display:'grid',gridTemplateColumns: mob ? '1fr' : '1fr 1fr',gap:10,marginBottom:14 }}>
              {Object.entries(NR).map(([k,r]) => <VitalCard key={k} vKey={k} r={r} history={history}/>)}
            </div>

            {/* Balance strip */}
            <div style={{ borderRadius:20, overflow:'hidden', height:120, position:'relative', marginBottom:10 }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/meditation-sunset.jpg)', backgroundSize:'cover', backgroundPosition:'center 45%' }}/>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(8,26,36,0.93) 0%,rgba(10,74,92,0.65) 55%,rgba(10,74,92,0.1) 100%)' }}/>
              <div style={{ position:'relative', zIndex:1, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'100%' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.15rem', fontWeight:300, color:'white', lineHeight:1.4, marginBottom:4 }}>
                    Balance is built one reading at a time.
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:"'DM Sans',sans-serif" }}>Your full history is logged below.</div>
                </div>
              </div>
            </div>

            {/* Entry log */}
            <div style={s.card}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
                <div>
                  <span style={s.sl}>Entry Log</span>
                  <span style={{ fontSize:11,color:'var(--text-muted)',marginLeft:10 }}>{n} reading{n!==1?'s':''}</span>
                </div>
                <button onClick={() => { if(confirm('Delete all history?')) { localStorage.removeItem('vitals_history'); window.location.reload(); } }}
                  style={{ fontSize:12,color:'#8b2020',background:'rgba(139,32,32,0.06)',border:'1px solid rgba(139,32,32,0.15)',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontFamily:'inherit' }}>
                  Clear All
                </button>
              </div>
              {[...history].reverse().map((entry,i) => {
                const d   = new Date(entry.timestamp);
                const fv  = Object.entries(NR).filter(([k]) => entry.vitals?.[k]!==''&&entry.vitals?.[k]!==undefined);
                const nc  = fv.filter(([k]) => gs(k,entry.vitals[k])==='normal').length;
                const pct = fv.length ? Math.round((nc/fv.length)*100) : null;
                const sc  = pct>=80?'#0d9488':pct>=60?'#b45309':'#8b2020';
                return (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:i<history.length-1?'1px solid var(--border)':'none' }}>
                    {/* Score dot */}
                    <div style={{ width:36,height:36,borderRadius:10,background:`${sc}12`,border:`1px solid ${sc}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:5 }}>
                        {d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                      <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                        {fv.map(([k,r]) => {
                          const st = gs(k,entry.vitals[k]);
                          const c  = st==='normal'?'#0d9488':st==='high'?'#8b2020':'#b45309';
                          return <span key={k} style={{ fontSize:10,padding:'1px 7px',borderRadius:999,background:`${c}10`,color:c,border:`1px solid ${c}22`,fontWeight:600 }}>{r.short} {entry.vitals[k]}</span>;
                        })}
                      </div>
                    </div>
                    {pct !== null && (
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontFamily:"'Fraunces',serif",fontSize:'1.15rem',fontWeight:300,color:sc,lineHeight:1 }}>{pct}%</div>
                        <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>normal</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA strip with image */}
            <div style={{ borderRadius:18,overflow:'hidden',height:200,position:'relative',marginTop:4 }}>
              <div style={{ position:'absolute',inset:0,backgroundImage:'url(/images/sneakers-steps.jpg)',backgroundSize:'cover',backgroundPosition:'center 40%' }}/>
              <div style={{ position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(10,74,92,0.93) 0%,rgba(10,74,92,0.55) 55%,transparent 100%)' }}/>
              <div style={{ position:'relative',zIndex:1,padding: mob ? '20px 20px' : '32px 36px',height:'100%',display:'flex',flexDirection: mob ? 'column' : 'row',alignItems: mob ? 'flex-start' : 'center',gap: mob ? 12 : 20,boxSizing:'border-box',justifyContent:'center' }}>
                <div>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize: mob ? '1.05rem' : '1.3rem',fontWeight:300,color:'white',marginBottom:6 }}>Keep moving. Keep tracking.</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,0.6)' }}>Consistent logging reveals patterns medicine misses.</div>
                </div>
                <button onClick={() => nav('/InputData')} style={{ flexShrink:0,padding:'11px 22px',borderRadius:12,border:'none',background:'white',color:'#0a4a5c',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,0.25)', marginLeft: mob ? 0 : 'auto' }}>
                  Log New Reading →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:  { fontFamily:"'DM Sans',sans-serif",background:'var(--bg)',minHeight:'100vh',paddingBottom:80 },
  banner:{ minHeight:220, padding:'52px 0 44px',position:'relative',overflow:'hidden' },
  ey:    { fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,0.5)',marginBottom:10 },
  ti:    { fontFamily:"'Fraunces',serif",fontSize:'2rem',fontWeight:300,letterSpacing:'-.02em',color:'#fff' },
  inner: { maxWidth:900,margin:'0 auto',padding:'20px 32px 0' },
  card:  { background:'var(--surface)',borderRadius:18,border:'1px solid var(--border)',padding:'20px 22px',marginBottom:12,boxShadow:'var(--shadow-sm)' },
  sl:    { fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)' },
  empty: { background:'var(--surface)',borderRadius:18,border:'1px solid var(--border)',padding:'56px 24px',textAlign:'center',boxShadow:'var(--shadow-sm)',marginTop:24 },
  btn:   { padding:'9px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#0a4a5c,#0d6b80)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit' },
};
