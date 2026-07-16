import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CostAccessibility from './CostAccessibility';
import useIsMobile from './useIsMobile';

// ── Voice Input ───────────────────────────────────────────────────────────────
function parseVitalsFromSpeech(text, setVitals) {
  const updates = {};
  const hr  = text.match(/(?:heart rate|pulse|hr)\s*(?:is|of|was)?\s*(\d+)/);
  if (hr) updates.heartRate = hr[1];
  const bp  = text.match(/(?:blood pressure|bp)\s*(?:is|of|was)?\s*(\d+)\s*(?:over|\/)\s*(\d+)/);
  if (bp) { updates.bloodPressureSystolic = bp[1]; updates.bloodPressureDiastolic = bp[2]; }
  const o2  = text.match(/(?:oxygen|o2|spo2|saturation)\s*(?:saturation|level|is|of|was)?\s*(\d+)/);
  if (o2) updates.oxygenSaturation = o2[1];
  const tmp = text.match(/(?:temperature|temp)\s*(?:is|of|was)?\s*(\d+\.?\d*)/);
  if (tmp) updates.temperature = tmp[1];
  const rr  = text.match(/(?:respiratory rate|breathing rate|respirations|breaths)\s*(?:per minute|is|of|was)?\s*(\d+)/);
  if (rr) updates.respiratoryRate = rr[1];
  if (Object.keys(updates).length) setVitals(prev => ({ ...prev, ...updates }));
  return Object.keys(updates).length;
}

function VoiceButton({ setVitals }) {
  const [state, setState] = useState('idle'); // idle | listening | done | error
  const [msg, setMsg]     = useState('');
  const recRef = useRef(null);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setState('error'); setMsg('Not supported in this browser. Try Chrome.'); return; }
    if (state === 'listening') { recRef.current?.stop(); return; }
    const rec = new SR();
    recRef.current = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onstart  = () => { setState('listening'); setMsg('Speak now… e.g. "heart rate 72, blood pressure 120 over 80"'); };
    rec.onresult = e => {
      const text = e.results[0][0].transcript.toLowerCase();
      const n = parseVitalsFromSpeech(text, setVitals);
      setState('done');
      setMsg(n ? `Got it — filled in ${n} field${n>1?'s':''}` : `Heard: "${text}" — no vitals recognised`);
    };
    rec.onerror  = () => { setState('error'); setMsg('Could not access microphone.'); };
    rec.onend    = () => { if (state === 'listening') setState('idle'); };
    rec.start();
  };

  const col = state==='listening'?'#e8453c':state==='done'?'#0d9488':state==='error'?'#b45309':'#0a4a5c';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <button onClick={toggle} title="Voice input" style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:9,border:`1px solid ${col}30`,background:`${col}10`,color:col,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .2s' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
        </svg>
        {state==='listening' ? 'Listening…' : '🎙 Voice Input'}
      </button>
      {msg && <span style={{ fontSize:11, color:col, maxWidth:220 }}>{msg}</span>}
    </div>
  );
}

// ── Medication Interactions ───────────────────────────────────────────────────
const INTERACTIONS = [
  {a:'warfarin',   b:'aspirin',      sev:'high',     msg:'Significantly increased bleeding risk — aspirin amplifies warfarin\'s anticoagulant effect.'},
  {a:'warfarin',   b:'ibuprofen',    sev:'high',     msg:'NSAIDs increase warfarin effect and GI bleeding risk. Avoid unless directed by your doctor.'},
  {a:'warfarin',   b:'naproxen',     sev:'high',     msg:'Naproxen can raise warfarin levels and increase bleeding risk.'},
  {a:'lisinopril', b:'potassium',    sev:'moderate', msg:'ACE inhibitors can raise blood potassium — avoid potassium supplements without monitoring.'},
  {a:'lisinopril', b:'spironolactone',sev:'moderate',msg:'Combining ACE inhibitors with spironolactone risks dangerously high potassium (hyperkalemia).'},
  {a:'metformin',  b:'alcohol',      sev:'moderate', msg:'Heavy alcohol with metformin raises the risk of lactic acidosis.'},
  {a:'simvastatin',b:'amlodipine',   sev:'moderate', msg:'Amlodipine raises simvastatin levels — increases muscle injury (myopathy) risk. Dose limits apply.'},
  {a:'simvastatin',b:'diltiazem',    sev:'moderate', msg:'Diltiazem inhibits simvastatin metabolism, raising myopathy risk.'},
  {a:'atorvastatin',b:'clarithromycin',sev:'high',   msg:'Clarithromycin markedly increases atorvastatin levels — risk of severe muscle damage (rhabdomyolysis).'},
  {a:'clopidogrel',b:'omeprazole',   sev:'moderate', msg:'Omeprazole reduces clopidogrel\'s antiplatelet effect by ~40%. Use pantoprazole instead.'},
  {a:'digoxin',    b:'amiodarone',   sev:'high',     msg:'Amiodarone doubles digoxin levels — close monitoring or dose reduction required.'},
  {a:'methotrexate',b:'ibuprofen',   sev:'high',     msg:'NSAIDs reduce methotrexate clearance — risk of toxicity. Avoid without specialist guidance.'},
  {a:'fluoxetine', b:'tramadol',     sev:'high',     msg:'SSRIs + tramadol can cause serotonin syndrome — a potentially life-threatening condition.'},
  {a:'sertraline', b:'tramadol',     sev:'high',     msg:'Combining sertraline with tramadol raises serotonin syndrome risk.'},
  {a:'lithium',    b:'ibuprofen',    sev:'high',     msg:'NSAIDs reduce lithium excretion — can cause lithium toxicity.'},
  {a:'sildenafil', b:'nitroglycerin',sev:'high',     msg:'This combination causes severe, potentially fatal blood pressure drop. Never combine.'},
  {a:'sildenafil', b:'isosorbide',   sev:'high',     msg:'Nitrates + sildenafil cause dangerous hypotension. Contraindicated.'},
  {a:'ciprofloxacin',b:'antacids',   sev:'moderate', msg:'Antacids reduce ciprofloxacin absorption — take ciprofloxacin 2 hours before or 6 hours after.'},
  {a:'levothyroxine',b:'calcium',    sev:'moderate', msg:'Calcium supplements reduce levothyroxine absorption — separate doses by at least 4 hours.'},
  {a:'levothyroxine',b:'iron',       sev:'moderate', msg:'Iron reduces levothyroxine absorption significantly — take thyroid medication on an empty stomach.'},
  {a:'apixaban',   b:'aspirin',      sev:'moderate', msg:'Aspirin increases bleeding risk when combined with apixaban.'},
  {a:'apixaban',   b:'ibuprofen',    sev:'high',     msg:'NSAIDs significantly increase bleeding risk with anticoagulants like apixaban.'},
  {a:'amlodipine', b:'simvastatin',  sev:'moderate', msg:'Amlodipine can raise simvastatin levels — risk of muscle toxicity increases.'},
  {a:'metoprolol', b:'verapamil',    sev:'high',     msg:'Combining beta-blockers with verapamil risks severe bradycardia and heart block.'},
  {a:'metoprolol', b:'diltiazem',    sev:'moderate', msg:'Both slow heart rate — combination can cause excessive bradycardia.'},
];

function checkInteractions(meds) {
  const names = meds.map(m => m.name.trim().toLowerCase()).filter(Boolean);
  const found = [];
  INTERACTIONS.forEach(({a,b,sev,msg}) => {
    const hasA = names.some(n => n.includes(a) || a.includes(n.split(' ')[0]));
    const hasB = names.some(n => n.includes(b) || b.includes(n.split(' ')[0]));
    if (hasA && hasB) found.push({pair:`${a} + ${b}`,sev,msg});
  });
  return found;
}

function InteractionWarnings({ rx }) {
  const warnings = checkInteractions(rx);
  const filled = rx.filter(r => r.name.trim());
  if (!filled.length) return null;
  if (!warnings.length) return (
    <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, padding:'9px 13px', borderRadius:10, background:'rgba(13,148,136,0.06)', border:'1px solid rgba(13,148,136,0.2)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
      <span style={{ fontSize:12, color:'#0d9488', fontWeight:500 }}>No known interactions detected between your medications.</span>
    </div>
  );
  return (
    <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
      {warnings.map((w,i) => {
        const col = w.sev==='high'?'#8b2020':'#b45309';
        const bg  = w.sev==='high'?'rgba(139,32,32,0.07)':'rgba(180,83,9,0.07)';
        const bdr = w.sev==='high'?'rgba(139,32,32,0.2)':'rgba(180,83,9,0.2)';
        return (
          <div key={i} style={{ borderRadius:10, padding:'11px 14px', background:bg, border:`1px solid ${bdr}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:col, marginBottom:3 }}>
              {w.sev==='high'?'⚠️':'ℹ️'} Interaction: {w.pair}
            </div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.55 }}>{w.msg}</div>
          </div>
        );
      })}
    </div>
  );
}

const RANGES = {
  heartRate:              { min:60,  max:100, unit:'bpm',         label:'Heart Rate',                icon:'❤️', tooltip:'Normal resting HR. Below 60 may indicate bradycardia; above 100 tachycardia.' },
  bloodPressureSystolic:  { min:90,  max:120, unit:'mmHg',        label:'Systolic BP',               icon:'🩺', tooltip:'Pressure when your heart beats. Above 130 mmHg is elevated.' },
  bloodPressureDiastolic: { min:60,  max:80,  unit:'mmHg',        label:'Diastolic BP',              icon:'🩺', tooltip:'Pressure when your heart rests. Above 80 mmHg may indicate hypertension.' },
  oxygenSaturation:       { min:95,  max:100, unit:'%',           label:'O₂ Saturation',             icon:'💨', tooltip:'% of oxygen in your blood. Below 95% may indicate respiratory issues.' },
  temperature:            { min:97,  max:99,  unit:'°F',          label:'Body Temperature',          icon:'🌡️', tooltip:'Normal body temp. Above 100.4°F is typically a fever.' },
  respiratoryRate:        { min:12,  max:20,  unit:'breaths/min', label:'Respiratory Rate',          icon:'🫁', tooltip:'Breaths per minute at rest. Outside 12–20 may indicate distress.' },
};

function getStatus(key, val) {
  if (val === '') return null;
  const r = RANGES[key]; const v = parseFloat(val);
  if (isNaN(v)) return null;
  if (v < r.min) return 'low'; if (v > r.max) return 'high'; return 'normal';
}

const STATUS_STYLE = {
  normal: { color:'#0d9488', bg:'rgba(0,196,180,0.1)',  border:'rgba(0,196,180,0.3)',  label:'Normal',  icon:'✓' },
  high:   { color:'#e8453c', bg:'rgba(232,69,60,0.1)',  border:'rgba(232,69,60,0.3)',  label:'High',    icon:'↑' },
  low:    { color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)', label:'Low',     icon:'↓' },
};

// Range bar — shows where the value sits relative to the normal range
function RangeBar({ value, min, max }) {
  const v = parseFloat(value);
  if (isNaN(v) || value === '') return (
    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginTop: 8 }} />
  );
  const lo = min * 0.75, hi = max * 1.25, range = hi - lo;
  const pct = Math.max(0, Math.min(100, ((v - lo) / range) * 100));
  const normalLeft  = ((min - lo) / range) * 100;
  const normalWidth = ((max - min) / range) * 100;
  const color = v < min ? '#f59e0b' : v > max ? '#e8453c' : '#00c4b4';
  return (
    <div style={{ marginTop: 8, position: 'relative' }}>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `${normalLeft}%`, width: `${normalWidth}%`, height: '100%', background: 'rgba(0,196,180,0.25)', borderRadius: 2 }} />
      </div>
      <div style={{ position: 'absolute', top: 0, left: `${pct}%`, transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid white', boxShadow: `0 0 6px ${color}`, marginTop: -3 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{min}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{max}</span>
      </div>
    </div>
  );
}

// Live preview panel
function LivePreviewPanel({ vitals, rx }) {
  const entries = Object.entries(RANGES).filter(([k]) => vitals[k] !== '');
  const entered = entries.length;
  const normal  = entries.filter(([k]) => getStatus(k, vitals[k]) === 'normal').length;
  const issues  = entered - normal;
  const filledRx = rx.filter(r => r.name.trim());

  return (
    <div style={lp.panel}>

      {/* Header */}
      <div style={lp.header}>
        <div style={lp.headerLeft}>
          <div style={lp.liveDot} />
          <span style={lp.headerLabel}>Live Preview</span>
        </div>
        {entered > 0 && (
          <span style={{ ...lp.badge, background: issues > 0 ? 'rgba(232,69,60,0.12)' : 'rgba(0,196,180,0.12)', color: issues > 0 ? '#e8453c' : '#00c4b4', border: `1px solid ${issues > 0 ? 'rgba(232,69,60,0.3)' : 'rgba(0,196,180,0.3)'}` }}>
            {entered} entered
          </span>
        )}
      </div>

      {/* Score circle */}
      <div style={lp.scoreWrap}>
        {entered === 0 ? (
          <div style={lp.emptyScore}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            <div style={lp.emptyHint}>Enter vitals to see your live status</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={issues === 0 ? '#00c4b4' : issues <= 1 ? '#f59e0b' : '#e8453c'}
                strokeWidth="8"
                strokeDasharray={`${(normal / Math.max(entered, 1)) * 263.9} 263.9`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray .6s ease, stroke .4s ease' }}
              />
              <text x="50" y="44" textAnchor="middle" fontSize="22" fontWeight="300" fill="white" fontFamily="Fraunces">{entered > 0 ? Math.round((normal/entered)*100) : '—'}</text>
              <text x="50" y="56" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="DM Sans" letterSpacing="1">% NORMAL</text>
            </svg>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {issues === 0 ? 'All readings normal' : `${issues} reading${issues > 1 ? 's' : ''} outside range`}
            </div>
          </div>
        )}
      </div>

      {/* Vital status list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {Object.entries(RANGES).map(([key, r]) => {
          const st = getStatus(key, vitals[key]);
          const ss = st ? STATUS_STYLE[st] : null;
          return (
            <div key={key} style={{ ...lp.vrow, opacity: vitals[key] !== '' ? 1 : 0.35 }}>
              <span style={lp.vLabel}>{r.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {vitals[key] !== '' && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: ss ? ss.color : 'rgba(255,255,255,0.5)', fontFamily: "'Fraunces',serif" }}>
                    {vitals[key]} <span style={{ fontSize: 10, fontWeight: 400, opacity: .6 }}>{r.unit}</span>
                  </span>
                )}
                <span style={{ ...lp.pill, ...(ss ? { background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)' }) }}>
                  {ss ? `${ss.icon} ${ss.label}` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Medications summary */}
      {filledRx.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={lp.rxHead}>Medications ({filledRx.length})</div>
          {filledRx.map((rx, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00c4b4', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{rx.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const lp = {
  panel:       { background: 'linear-gradient(160deg,#0a2030 0%,#0d2a3c 100%)', borderRadius: 20, border: '1px solid rgba(0,196,180,0.15)', padding: '28px 22px 24px', position: 'sticky', top: 88, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 7 },
  liveDot:     { width: 7, height: 7, borderRadius: '50%', background: '#00c4b4', boxShadow: '0 0 6px #00c4b4' },
  headerLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.4)' },
  badge:       { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 },
  scoreWrap:   { minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyScore:  { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  emptyHint:   { fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, maxWidth: 180 },
  vrow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'opacity .2s' },
  vLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  pill:        { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, transition: 'all .2s' },
  rxHead:      { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
};

// ── Vitals Tab ────────────────────────────────────────────────────────────────

function VitalsTab({ mob }) {
  const [vitals, setVitals] = useState({ heartRate:'', bloodPressureSystolic:'', bloodPressureDiastolic:'', oxygenSaturation:'', temperature:'', respiratoryRate:'' });
  const [rx, setRx]         = useState([{ name:'', sideEffects:'' }]);
  const [showGoals, setShowGoals] = useState(false);
  const saved = JSON.parse(localStorage.getItem('vital_goals') || '{}');
  const nav   = useNavigate();
  const saveGoal = (k, v) => localStorage.setItem('vital_goals', JSON.stringify({ ...saved, [k]: v }));

  return (
    <div style={{ ...s.splitLayout, gridTemplateColumns: mob ? '1fr' : '280px 1fr' }}>
      {/* Left: live preview panel — hidden on mobile */}
      {!mob && <div style={s.previewCol}>
        <LivePreviewPanel vitals={vitals} rx={rx} />
      </div>}

      {/* Right: form */}
      <div style={s.formCol}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={s.sl}>Vital Signs</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Enter any or all — each adds more context</div>
            </div>
            <button onClick={() => setShowGoals(g => !g)} style={s.goalBtn}>{showGoals ? 'Hide Goals' : '+ Goals'}</button>
          </div>
          <div style={{ marginBottom: 18 }}>
            <VoiceButton setVitals={setVitals} />
          </div>
          <div style={{ ...s.vitalsGrid, gridTemplateColumns: mob ? '1fr' : '1fr 1fr' }}>
            {Object.entries(RANGES).map(([key, r]) => {
              const st = getStatus(key, vitals[key]);
              const ss = st ? { normal: { border:'#00c4b4', bg:'rgba(0,196,180,0.06)' }, high: { border:'#e8453c', bg:'rgba(232,69,60,0.05)' }, low: { border:'#f59e0b', bg:'rgba(245,158,11,0.05)' } }[st] : null;
              const goal = saved[key];
              return (
                <div key={key} style={{ ...s.vitalCard, ...(ss ? { borderColor: ss.border, background: ss.bg } : {}) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={s.vLabel}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.min}–{r.max} {r.unit}</div>
                    </div>
                    {st && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: STATUS_STYLE[st].bg, color: STATUS_STYLE[st].color, border: `1px solid ${STATUS_STYLE[st].border}` }}>
                        {STATUS_STYLE[st].icon} {STATUS_STYLE[st].label}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder={`e.g. ${Math.round((r.min + r.max) / 2)}`}
                    value={vitals[key]}
                    onChange={e => setVitals(p => ({ ...p, [key]: e.target.value }))}
                    style={{ ...s.inp, ...(ss ? { borderColor: ss.border } : {}) }}
                  />
                  <RangeBar value={vitals[key]} min={r.min} max={r.max} />
                  {showGoals && (
                    <input type="number" placeholder={`Set goal (${r.unit})`} defaultValue={saved[key] || ''}
                      onBlur={e => saveGoal(key, e.target.value)}
                      style={{ ...s.inp, marginTop: 8, borderColor: 'rgba(139,32,32,0.22)', background: 'rgba(139,32,32,0.03)', fontSize: 12 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sl}>Prescriptions <span style={{ fontWeight:400, fontSize:10, textTransform:'none', letterSpacing:0, color:'var(--text-muted)', marginLeft:6 }}>(optional)</span></div>
          {rx.map((p, i) => (
            <div key={i} style={s.rxCard}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={s.lbl}>Medication Name</div>
                  <input type="text" placeholder="e.g. Metformin" value={p.name}
                    onChange={e => { const u=[...rx]; u[i]={...u[i],name:e.target.value}; setRx(u); }} style={s.inp}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.lbl}>Known Side Effects</div>
                  <input type="text" placeholder="e.g. dizziness" value={p.sideEffects}
                    onChange={e => { const u=[...rx]; u[i]={...u[i],sideEffects:e.target.value}; setRx(u); }} style={s.inp}/>
                </div>
              </div>
              {rx.length > 1 && <button onClick={() => setRx(prev => prev.filter((_,j) => j!==i))} style={s.rmv}>Remove</button>}
            </div>
          ))}
          <button onClick={() => setRx(p => [...p, { name:'', sideEffects:'' }])} style={s.addBtn}>+ Add Prescription</button>
          <InteractionWarnings rx={rx} />
        </div>

        <button onClick={() => nav('/Results', { state:{ vitals, prescriptions: rx } })} style={s.submit}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
          Analyze My Vitals
        </button>
      </div>
    </div>
  );
}

// ── Drug Lookup Tab ───────────────────────────────────────────────────────────

function DrugLookupTab() {
  const [drugs, setDrugs]   = useState([{ name:'' }]);
  const [checkKey, setCheckKey] = useState(0);
  const updateDrug = (i, val) => { const u=[...drugs]; u[i].name=val; setDrugs(u); };
  const filledDrugs = drugs.filter(d => d.name.trim());

  return (
    <div style={s.formColWide}>
      {/* Pills image strip */}
      <div style={{ borderRadius:18, overflow:'hidden', height:110, position:'relative' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/pills-colorful.jpg)', backgroundSize:'cover', backgroundPosition:'center 55%' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(10,74,92,0.95) 0%,rgba(10,74,92,0.6) 55%,transparent 100%)' }}/>
        <div style={{ position:'relative', zIndex:1, padding:'22px 28px', height:'100%', display:'flex', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:'1.1rem', fontWeight:300, color:'white', marginBottom:3 }}>Medication Cost Guide</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Pricing data · alternatives · nearby pharmacies</div>
          </div>
        </div>
      </div>

      <div style={{ ...s.card, borderColor: 'rgba(10,74,92,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#0a4a5c,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(10,74,92,0.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Fraunces',serif", fontWeight: 300, letterSpacing: '-.01em' }}>Medication Lookup</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Check pricing, alternatives & nearby pharmacies — no vitals required</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {drugs.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--teal-soft)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0a4a5c' }}>{i+1}</span>
              </div>
              <input type="text"
                placeholder={`Drug name (e.g. ${['Lisinopril','Metformin','Atorvastatin'][i] || 'Medication'})`}
                value={d.name}
                onChange={e => updateDrug(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && i === drugs.length-1) setDrugs(p => [...p, { name:'' }]); }}
                style={{ ...s.inp, flex: 1 }}
              />
              {drugs.length > 1 && (
                <button onClick={() => setDrugs(p => p.filter((_,j) => j!==i))}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setDrugs(p => [...p, { name:'' }])} style={s.addBtn}>+ Add drug</button>
          <button onClick={() => { if (filledDrugs.length) setCheckKey(k => k + 1); }}
            disabled={!filledDrugs.length}
            style={{ ...s.submit, flex: 1, margin: 0, padding: '11px 20px', fontSize: 14, boxShadow: 'none', opacity: filledDrugs.length ? 1 : 0.5 }}>
            Check Medications →
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {['NADAC pricing', 'Therapeutic alternatives', 'Nearby pharmacies', 'OpenStreetMap'].map(f => (
            <span key={f} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'var(--navy-soft)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>{f}</span>
          ))}
        </div>
      </div>

      {checkKey > 0 && filledDrugs.length > 0 && <CostAccessibility key={checkKey} prescriptions={filledDrugs} autoRun />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InputData() {
  const [tab, setTab] = useState('vitals');
  const mob = useIsMobile();
  return (
    <div style={s.page}>
      <div style={{ ...s.banner, minHeight: mob ? 160 : 220, padding: mob ? '28px 0 0' : '52px 0 0' }}>
        {/* Full-bleed image with smooth left fade */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/images/blood-pressure.jpg)', backgroundSize:'cover', backgroundPosition:'center 60%' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(8,28,38,1) 0%, rgba(10,74,92,0.97) 30%, rgba(10,74,92,0.7) 55%, rgba(10,74,92,0.25) 78%, rgba(10,74,92,0.05) 100%)' }}/>
        {/* ECG line decoration */}
        <svg style={{ position:'absolute',bottom:0,left:0,right:0,opacity:0.1,pointerEvents:'none' }} height="36" viewBox="0 0 1200 36" preserveAspectRatio="none">
          <path d="M0,18 L180,18 L220,18 L245,4 L270,32 L288,2 L308,34 L328,18 L560,18 L600,18 L625,5 L650,31 L668,2 L688,34 L708,18 L1200,18" stroke="#00c4b4" strokeWidth="2" fill="none"/>
        </svg>
        <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding: mob ? '0 16px' : '0 32px' }}>
          <div style={{ marginBottom: mob ? 16 : 32 }}>
            <div>
              <div style={s.eyebrow}>Health Analysis</div>
              <h1 style={{ ...s.title, fontSize: mob ? '1.5rem' : '2rem' }}>What would you like to check?</h1>
              {!mob && <p style={s.sub}>Full vitals analysis with AI-powered insights, or look up any medication — your choice.</p>}
              <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
                {[{icon:'💓',label:'6 vital signs'},{icon:'💊',label:'Drug database'},{icon:'🎙',label:'Voice input'}].map((f,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>
                    <span>{f.icon}</span>{f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab==='vitals' ? s.tabActive : {}) }} onClick={() => setTab('vitals')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
              Vitals Check
            </button>
            <button style={{ ...s.tab, ...(tab==='drugs' ? s.tabActive : {}) }} onClick={() => setTab('drugs')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
              </svg>
              Drug Lookup
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...s.body, padding: mob ? '20px 16px 0' : '28px 32px 0' }}>
        {tab === 'vitals' ? <VitalsTab mob={mob} /> : <DrugLookupTab />}
      </div>
    </div>
  );
}

const s = {
  page:       { fontFamily:"'DM Sans',sans-serif", background:'var(--bg)', minHeight:'100vh', paddingBottom: 80 },
  banner:     { minHeight:220, padding:'52px 0 0', position:'relative', overflow:'hidden' },
  eyebrow:    { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.55)', marginBottom:10 },
  title:      { fontFamily:"'Fraunces',serif", fontSize:'2rem', fontWeight:300, letterSpacing:'-.02em', color:'#fff', marginBottom:8 },
  sub:        { fontSize:14, color:'rgba(255,255,255,0.58)', lineHeight:1.6 },
  tabs:       { display:'flex', gap:4 },
  tab:        { display:'inline-flex', alignItems:'center', gap:7, padding:'11px 22px', borderRadius:'12px 12px 0 0', border:'none', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.65)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' },
  tabActive:  { background:'var(--bg)', color:'var(--text-primary)', fontWeight:600 },
  body:       { padding:'28px 32px 0', maxWidth:1200, margin:'0 auto' },

  // Split layout for vitals
  splitLayout: { display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' },
  previewCol:  { position:'sticky', top:80 },
  formCol:     { display:'flex', flexDirection:'column', gap:14 },
  formColWide: { maxWidth:720, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 },

  card:       { background:'var(--surface)', borderRadius:20, border:'1px solid var(--border)', padding:'24px', boxShadow:'var(--shadow-sm)' },
  sl:         { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:4 },
  lbl:        { fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:5 },

  vitalsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  vitalCard:  { background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:14, padding:16, transition:'border-color .15s, background .15s' },
  vLabel:     { fontSize:13, fontWeight:600, color:'var(--text-primary)' },

  inp:        { width:'100%', padding:'10px 13px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', fontSize:14, color:'var(--text-primary)', fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color .15s' },
  goalBtn:    { fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:8, border:'1px solid rgba(232,69,60,0.22)', background:'rgba(232,69,60,0.05)', color:'#8b2020', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
  rxCard:     { background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:13, padding:16, marginBottom:10 },
  rmv:        { marginTop:8, background:'none', border:'none', color:'#e8453c', fontSize:12, cursor:'pointer', padding:0, fontFamily:'inherit' },
  addBtn:     { padding:'8px 16px', borderRadius:9, border:'1px solid var(--teal-border)', background:'var(--teal-soft)', color:'#0a4a5c', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  submit:     { width:'100%', padding:14, borderRadius:14, border:'none', background:'linear-gradient(135deg,#8b2020,#e8453c)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(139,32,32,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 },
};
