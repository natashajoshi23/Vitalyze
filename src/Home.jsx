import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);
  const show = visible || mounted;
  return (
    <div ref={ref} style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(32px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function Counter({ end, suffix = '', duration = 1600 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t0 = setTimeout(() => {
      let s = 0; const step = end / (duration / 16);
      const t = setInterval(() => { s = Math.min(s + step, end); setCount(Math.floor(s)); if (s >= end) clearInterval(t); }, 16);
      return () => clearInterval(t);
    }, 300);
    return () => clearTimeout(t0);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Floating mock dashboard card shown in hero
function HeroDashboardCard() {
  const vitals = [
    { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal', color: '#00c4b4' },
    { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'normal', color: '#00c4b4' },
    { label: 'O₂ Saturation', value: '98', unit: '%', status: 'normal', color: '#00c4b4' },
    { label: 'Respiratory Rate', value: '22', unit: 'br/min', status: 'high', color: '#e8453c' },
  ];
  return (
    <div style={dc.card}>
      <div style={dc.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={dc.dot} className="pulse-anim" />
          <span style={dc.headerLabel}>Live Analysis</span>
        </div>
        <span style={dc.badge}>4 vitals</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vitals.map((v, i) => (
          <div key={i} style={{ ...dc.row, animationDelay: `${i * 0.15}s` }}>
            <div style={{ flex: 1 }}>
              <div style={dc.vLabel}>{v.label}</div>
              <div style={dc.vValue}>{v.value} <span style={dc.vUnit}>{v.unit}</span></div>
            </div>
            <span style={{ ...dc.statusPill, background: v.status === 'normal' ? 'rgba(0,196,180,0.15)' : 'rgba(232,69,60,0.15)', color: v.status === 'normal' ? '#00c4b4' : '#e8453c', border: `1px solid ${v.status === 'normal' ? 'rgba(0,196,180,0.3)' : 'rgba(232,69,60,0.3)'}` }}>
              {v.status === 'normal' ? '✓ Normal' : '⚠ High'}
            </span>
          </div>
        ))}
      </div>
      <div style={dc.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e8453c" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
          <span style={{ fontSize: 11, color: '#e8453c', fontWeight: 600 }}>1 reading outside normal range</span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Just now</span>
      </div>
    </div>
  );
}

const dc = {
  card: { background: 'rgba(13,34,48,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,196,180,0.2)', borderRadius: 20, padding: '20px', width: 300, boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,196,180,0.1)', fontFamily: "'DM Sans',sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' },
  headerLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.5)' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#e8453c' },
  badge: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,196,180,0.12)', color: '#00c4b4', border: '1px solid rgba(0,196,180,0.2)' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' },
  vLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 },
  vValue: { fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: "'Fraunces',serif", fontWeight: 300 },
  vUnit: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 },
  statusPill: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' },
};

// Scrolling marquee strip
const MARQUEE_ITEMS = ['Heart Rate Analysis', 'Blood Pressure Monitoring', 'O₂ Saturation', 'Respiratory Rate', 'Drug Pricing', 'Risk Detection', 'AI Health Summary', 'Pharmacy Finder', 'Trend Tracking', 'Medication Lookup'];

function Marquee() {
  return (
    <div style={{ overflow: 'hidden', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 0' }}>
      <div style={{ display: 'flex', gap: 0, animation: 'marquee 30s linear infinite', width: 'max-content' }}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '0 32px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: i % 2 === 0 ? '#00c4b4' : '#e8453c', display: 'inline-block', flexShrink: 0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// How it works steps
const STEPS = [
  { n: '01', title: 'Enter your vitals', desc: 'Input heart rate, blood pressure, oxygen saturation, temperature, and more. All optional — enter what you have.', color: '#00c4b4', img: '/images/smartwatch.jpg' },
  { n: '02', title: 'Get instant analysis', desc: 'Vitalyze flags out-of-range readings, detects 12+ risk conditions, and cross-references your medications against clinical thresholds.', color: '#e8453c', img: '/images/health-tech.jpg' },
  { n: '03', title: 'Take informed action', desc: 'Get evidence-based recommendations, cheaper drug alternatives, and nearby pharmacy locations — then share results with your doctor.', color: '#0a4a5c', img: '/images/nurse-consultation.jpg' },
];

function getStreak(history) {
  if (!history.length) return 0;
  let s = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  const days = new Set(history.map(e => new Date(e.timestamp).toISOString().slice(0,10)));
  while (days.has(d.toISOString().slice(0,10))) { s++; d.setDate(d.getDate()-1); }
  return s;
}

export default function Home() {
  const nav = useNavigate();
  const history = JSON.parse(localStorage.getItem('vitals_history') || '[]');
  const user = JSON.parse(localStorage.getItem('user_profile') || 'null');
  const hasData = history.length > 0;

  const streak = getStreak(history);
  const todayStr = new Date().toISOString().slice(0,10);
  const loggedToday = history.some(e => new Date(e.timestamp).toISOString().slice(0,10) === todayStr);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    const asked = localStorage.getItem('notif_asked');
    if (asked) return;
    setTimeout(() => {
      Notification.requestPermission().then(p => {
        localStorage.setItem('notif_asked', '1');
        if (p === 'granted') {
          const now = new Date();
          const next9am = new Date(); next9am.setHours(9,0,0,0);
          if (next9am <= now) next9am.setDate(next9am.getDate()+1);
          const msUntil = next9am - now;
          setTimeout(() => new Notification('Vitalyze', { body: 'Time to log your vitals today 💙', icon: '/favicon.svg' }), msUntil);
        }
      });
    }, 3000);
  }, []);

  return (
    <div style={s.page}>

      {/* ── STREAK / REMINDER BANNER ───────────────────────────────── */}
      {hasData && (
        <div style={{ background: loggedToday ? 'linear-gradient(90deg,rgba(13,148,136,0.12),rgba(0,196,180,0.06))' : 'linear-gradient(90deg,rgba(180,83,9,0.1),rgba(245,158,11,0.05))', borderBottom: `1px solid ${loggedToday ? 'rgba(0,196,180,0.2)' : 'rgba(245,158,11,0.2)'}`, padding:'10px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{loggedToday ? '🔥' : '⏰'}</span>
            <span style={{ fontSize:13, fontWeight:600, color: loggedToday ? '#0d9488' : '#b45309' }}>
              {loggedToday ? `${streak} day streak — great work${user?.name ? `, ${user.name.split(' ')[0]}` : ''}!` : "You haven't logged vitals today yet."}
            </span>
          </div>
          {!loggedToday && (
            <button onClick={() => nav('/InputData')} style={{ padding:'6px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#b45309,#f59e0b)', color:'white', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Log Now →</button>
          )}
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <img src="/images/ecg-hero.jpg" alt="" style={s.heroImg} />
        <div style={s.heroOverlay} />
        <div style={s.ecgWrap}>
          <svg viewBox="0 0 600 60" preserveAspectRatio="none" fill="none" style={{ width: '100%', height: 60 }}>
            <defs><linearGradient id="eg" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#00c4b4" stopOpacity="0"/><stop offset="20%" stopColor="#00c4b4" stopOpacity="0.8"/><stop offset="80%" stopColor="#00c4b4" stopOpacity="0.8"/><stop offset="100%" stopColor="#00c4b4" stopOpacity="0"/></linearGradient></defs>
            <path className="ecg-anim" d="M0,30 L80,30 L100,30 L115,10 L128,52 L138,3 L150,58 L162,30 L220,30 L260,30 L275,14 L288,46 L298,5 L310,56 L322,30 L400,30 L430,30 L445,12 L458,48 L468,4 L480,54 L492,30 L600,30" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        <div style={s.heroInner}>
          <div style={s.heroLeft}>
            <div style={s.heroEyebrow}><span style={s.pulseDot} className="pulse-anim" />Clinical-grade vitals monitoring</div>
            <h1 style={s.heroH1}>Your health,<br /><span style={s.heroEm}>understood.</span></h1>
            <p style={s.heroSub}>Enter your vitals. Vitalyze flags risk conditions, checks your medications for side effects and pricing, and explains what it all means — in plain English.</p>
            <div style={s.heroActions}>
              <button style={s.btnPrimary} onClick={() => nav('/InputData')}>
                Analyze My Vitals
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              {hasData
                ? <button style={s.btnGhost} onClick={() => nav('/Results')}>See My Last Results</button>
                : <button style={s.btnGhost} onClick={() => nav('/Onboarding')}>Create Profile →</button>
              }
            </div>
            <div style={s.heroPills}>
              {['No account required', 'Data stays on device', 'Free forever'].map(p => (
                <span key={p} style={s.heroPill}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div style={s.heroRight}>
            <HeroDashboardCard />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <div style={s.statsBar}>
        {[
          { n: 6,   suf: '',   label: 'Vital metrics tracked' },
          { n: 50,  suf: '+',  label: 'Medications indexed' },
          { n: 12,  suf: '+',  label: 'Risk conditions detected' },
          { n: 100, suf: '%',  label: 'Private & free' },
        ].map((item, i) => (
          <Reveal key={i} delay={i * 80} style={s.statItem}>
            <div style={s.statNum}><Counter end={item.n} suffix={item.suf} /></div>
            <div style={s.statLabel}>{item.label}</div>
          </Reveal>
        ))}
      </div>

      {/* ── MARQUEE ────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section style={s.section}>
        <Reveal style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={s.sectionLabel}>How it works</div>
          <h2 style={s.sectionH2}>Three steps to clarity</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>No signup. No subscription. Just enter your numbers and get real answers.</p>
        </Reveal>
        <div style={s.stepsGrid}>
          {STEPS.map((step, i) => (
            <Reveal key={i} delay={i * 120}>
              <div style={s.stepCard}>
                <div style={{ position: 'relative', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                  <img src={step.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,19,26,0.8) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', top: 16, left: 16, fontFamily: "'Fraunces',serif", fontSize: '2.2rem', fontWeight: 300, color: step.color, lineHeight: 1, opacity: 0.9 }}>{step.n}</div>
                </div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: step.color, marginTop: 16 }} />
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={400} style={{ textAlign: 'center', marginTop: 48 }}>
          <button style={s.btnPrimary} onClick={() => nav('/InputData')}>
            Start Now — It's Free
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </Reveal>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section style={{ ...s.section, paddingTop: 0 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={s.sectionLabel}>What Vitalyze does</div>
          <h2 style={s.sectionH2}>From raw numbers<br />to real understanding</h2>
        </Reveal>
        <div style={s.featureGrid}>
          {[
            { img: '/images/blood-pressure.jpg', title: 'Vitals Analysis', desc: 'Enter heart rate, blood pressure, O₂ saturation and more — get instant clinical context on every reading.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> },
            { img: '/images/monitor.jpg',         title: 'Risk Detection',  desc: 'Detects hypertension, AFib indicators, low oxygen, and 12+ conditions from your vitals in combination.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> },
            { img: '/images/medication.jpg',      title: 'Drug Pricing',    desc: 'Cross-references your prescriptions against NADAC public pricing and surfaces cheaper therapeutic equivalents.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 120} style={{ position: 'relative' }}>
              <div style={s.featureCard} className="feature-card-hover">
                <img src={f.img} alt={f.title} style={s.featureImg} />
                <div style={s.featureCardOverlay}>
                  <div style={s.featureIconWrap}>{f.icon}</div>
                  <div style={s.featureCardTitle}>{f.title}</div>
                  <div style={s.featureCardDesc}>{f.desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={360}>
            <div style={s.aiCard} className="feature-card-hover">
              <div style={s.aiCardGlow} />
              <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.15 }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div style={s.featureIconWrap}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                <div style={s.featureCardTitle}>AI Health Summary</div>
                <div style={{ ...s.featureCardDesc, color: 'rgba(255,255,255,0.7)' }}>Claude synthesizes your vitals and medications into a clear, jargon-free health narrative. Not a diagnosis — genuine, grounded insight.</div>
                <div style={s.aiBadge}>Powered by Claude</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SPLIT: CARE ────────────────────────────────────────────── */}
      <section style={{ ...s.section, ...s.splitSection, paddingTop: 0 }}>
        <Reveal style={s.splitImgSide}>
          <div style={{ position: 'relative' }}>
            <img src="/images/doctor-consultation.jpg" alt="" style={s.splitImg} />
            <div style={s.splitImgBadge}>
              <div style={s.badgePulse} className="pulse-anim" />
              <div><div style={s.badgeNumber}>Trusted</div><div style={s.badgeLabel}>clinical data sources</div></div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={180} style={s.splitTextSide}>
          <div style={s.sectionLabel}>Clinical decision support</div>
          <h2 style={{ ...s.sectionH2, textAlign: 'left', fontSize: '2rem' }}>Built for people<br />who want real answers</h2>
          <p style={s.bodyText}>Most health apps just show you numbers. Vitalyze tells you what those numbers mean <em>together</em> — the relationships between vitals, how your medications interact, and what warrants a call to your doctor.</p>
          <p style={s.bodyText}>Every risk flag is grounded in real clinical thresholds. Every cost comparison uses public government pricing data. Every AI summary is generated fresh from your actual readings.</p>
          <button style={s.btnSecondary} onClick={() => nav('/InputData')}>Start your analysis →</button>
        </Reveal>
      </section>

      {/* ── WELLNESS STRIP ─────────────────────────────────────────── */}
      <section style={s.wellnessSection}>
        <img src="/images/sneakers-steps.jpg" alt="" style={s.wellnessImg} />
        <div style={s.wellnessOverlay} />
        <Reveal style={s.wellnessContent}>
          <div style={{ ...s.sectionLabel, color: 'rgba(255,255,255,0.6)' }}>Track your progress</div>
          <h2 style={s.wellnessH2}>Health isn't just numbers.<br />But numbers help.</h2>
          <p style={{ ...s.heroSub, maxWidth: 480 }}>Log your vitals over time. Spot patterns. See what changes between check-ins. Give your doctor better information at every visit.</p>
          <button style={{ ...s.btnPrimary, marginTop: 8 }} onClick={() => nav('/Trends')}>View My Trends →</button>
        </Reveal>
      </section>

      {/* ── PRIVACY / CTA ──────────────────────────────────────────── */}
      <section style={{ ...s.section, ...s.splitSection, ...s.splitSectionReverse }}>
        <Reveal delay={180} style={s.splitTextSide}>
          <div style={s.sectionLabel}>Privacy-first</div>
          <h2 style={{ ...s.sectionH2, textAlign: 'left', fontSize: '2rem' }}>Your data stays<br />on your device.</h2>
          <p style={s.bodyText}>Vitalyze stores everything locally in your browser. Your vitals history, goals, and profile never leave your device. No accounts required, no data sold, no tracking.</p>
          <div style={s.trustBadges}>
            {['Local storage only', 'No data sold', 'FDA drug data', 'Free forever'].map(b => (
              <span key={b} style={s.trustBadge}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>{b}</span>
            ))}
          </div>
          <button style={s.btnPrimary} onClick={() => nav(user ? '/InputData' : '/Onboarding')}>
            {user ? 'Go to Dashboard' : 'Get Started — Free'}
          </button>
        </Reveal>
        <Reveal style={s.splitImgSide}>
          <img src="/images/medical-team.jpg" alt="" style={{ ...s.splitImg, borderRadius: 24 }} />
        </Reveal>
      </section>

    </div>
  );
}

const s = {
  page: { fontFamily: "'DM Sans', sans-serif", background: 'var(--bg)', minHeight: '100vh' },
  hero: { position: 'relative', minHeight: '94vh', display: 'flex', alignItems: 'center', overflow: 'hidden' },
  heroImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(6,19,26,0.95) 0%, rgba(10,74,92,0.82) 50%, rgba(6,19,26,0.7) 100%)' },
  ecgWrap: { position: 'absolute', bottom: 48, left: 0, right: 0, opacity: 0.4 },
  heroInner: { position: 'relative', zIndex: 2, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '80px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 64 },
  heroLeft: { flex: 1, maxWidth: 580 },
  heroRight: { flexShrink: 0, display: 'flex', justifyContent: 'flex-end' },
  heroEyebrow: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#00c4b4', marginBottom: 24 },
  pulseDot: { width: 8, height: 8, borderRadius: '50%', background: '#e8453c', display: 'inline-block', flexShrink: 0 },
  heroH1: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(2.6rem, 5.5vw, 4.6rem)', fontWeight: 300, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.08, marginBottom: 24 },
  heroEm: { color: '#00c4b4', fontStyle: 'italic' },
  heroSub: { fontSize: 17, color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, marginBottom: 36, maxWidth: 500 },
  heroActions: { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 },
  heroPills: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  heroPill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '.02em' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#8b2020,#e8453c)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(139,32,32,0.45)', transition: 'transform .15s, box-shadow .15s' },
  btnGhost: { padding: '13px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 13, border: '1px solid var(--teal-border)', background: 'var(--teal-soft)', color: '#0a4a5c', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' },
  statItem: { padding: '28px 24px', textAlign: 'center', borderRight: '1px solid var(--border)' },
  statNum: { fontFamily: "'Fraunces', serif", fontSize: '2.4rem', fontWeight: 300, color: '#0a4a5c', letterSpacing: '-0.03em' },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  section: { maxWidth: 1100, margin: '0 auto', padding: '96px 48px' },
  sectionLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12 },
  sectionH2: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 300, letterSpacing: '-0.025em', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 16, textAlign: 'center' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  stepCard: { background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)', transition: 'transform .2s, box-shadow .2s' },
  stepTitle: { fontFamily: "'Fraunces',serif", fontSize: '1.15rem', fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-.01em' },
  stepDesc: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 },
  featureCard: { borderRadius: 20, overflow: 'hidden', position: 'relative', height: 320, cursor: 'default' },
  featureImg: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
  featureCardOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,19,26,0.92) 0%, rgba(6,19,26,0.35) 60%, transparent 100%)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 },
  featureIconWrap: { width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featureCardTitle: { fontFamily: "'Fraunces', serif", fontSize: '1.2rem', fontWeight: 300, color: '#fff', letterSpacing: '-0.01em' },
  featureCardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 },
  aiCard: { borderRadius: 20, background: 'linear-gradient(135deg,#0a4a5c,#0d6b80)', padding: 28, height: 320, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', cursor: 'default' },
  aiCardGlow: { position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,180,0.28) 0%, transparent 70%)' },
  aiBadge: { marginTop: 12, display: 'inline-flex', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 999, background: 'rgba(0,196,180,0.2)', border: '1px solid rgba(0,196,180,0.4)', color: '#00c4b4', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' },
  splitSection: { display: 'flex', gap: 64, alignItems: 'center' },
  splitSectionReverse: { flexDirection: 'row-reverse' },
  splitImgSide: { flex: '0 0 45%' },
  splitImg: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 20, display: 'block' },
  splitImgBadge: { position: 'absolute', bottom: 20, left: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
  badgePulse: { width: 10, height: 10, borderRadius: '50%', background: '#e8453c', flexShrink: 0 },
  badgeNumber: { fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 400, color: '#0a4a5c' },
  badgeLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 },
  splitTextSide: { flex: 1 },
  bodyText: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 16 },
  wellnessSection: { position: 'relative', minHeight: 500, display: 'flex', alignItems: 'center', overflow: 'hidden' },
  wellnessImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  wellnessOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(6,19,26,0.92) 0%, rgba(10,74,92,0.65) 100%)' },
  wellnessContent: { position: 'relative', zIndex: 1, padding: '80px 48px', maxWidth: 680 },
  wellnessH2: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.2, marginBottom: 20 },
  trustBadges: { display: 'flex', flexWrap: 'wrap', gap: 10, margin: '20px 0 28px' },
  trustBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'var(--teal-soft)', border: '1px solid var(--teal-border)', color: '#0a4a5c', fontSize: 12, fontWeight: 500 },
};
