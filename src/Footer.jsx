import { NavLink } from 'react-router-dom';
import logo from './assets/logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={s.footer}>
      <div style={s.inner}>

        {/* Top row */}
        <div style={s.top}>
          {/* Brand */}
          <div style={s.brand}>
            <div style={s.logoRow}>
              <img src={logo} alt="Vitalyze" style={{ width:28, height:28 }} />
              <span style={s.logoText}>Vitalyze</span>
            </div>
            <p style={s.tagline}>
              Evidence-based health monitoring for informed wellness decisions.
            </p>
          </div>

          {/* Nav columns */}
          <div style={s.cols}>
            <div style={s.col}>
              <div style={s.colHead}>Product</div>
              {[
                { to:'/InputData', label:'Check Vitals' },
                { to:'/InputData', label:'Drug Lookup' },
                { to:'/Results',  label:'Your Results' },
                { to:'/Trends',   label:'Trends' },
              ].map(l => (
                <NavLink key={l.label} to={l.to} style={s.link}>{l.label}</NavLink>
              ))}
            </div>
            <div style={s.col}>
              <div style={s.colHead}>Account</div>
              {[
                { to:'/Profile',       label:'Profile' },
                { to:'/Onboarding',    label:'Get Started' },
              ].map(l => (
                <NavLink key={l.label} to={l.to} style={s.link}>{l.label}</NavLink>
              ))}
            </div>
            <div style={s.col}>
              <div style={s.colHead}>Data Sources</div>
              <a href="https://rxnav.nlm.nih.gov" target="_blank" rel="noopener noreferrer" style={s.link}>RxNorm (NIH)</a>
              <a href="https://data.medicaid.gov" target="_blank" rel="noopener noreferrer" style={s.link}>NADAC / CMS</a>
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" style={s.link}>OpenStreetMap</a>
              <a href="https://api.fda.gov" target="_blank" rel="noopener noreferrer" style={s.link}>openFDA</a>
            </div>
          </div>
        </div>

        {/* Disclaimer strip */}
        <div style={s.disclaimer}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>Medical Disclaimer:</strong> Vitalyze is an educational tool only and does not provide medical advice, diagnosis, or treatment. Always consult a licensed physician or qualified healthcare professional before making any health or medication decisions.
          </span>
        </div>

        {/* Bottom bar */}
        <div style={s.bottom}>
          <span style={s.copy}>© {year} Vitalyze. All rights reserved.</span>
          <div style={s.badges}>
            <span style={s.badge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              No data sold
            </span>
            <span style={s.badge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Stored locally
            </span>
            <span style={s.badge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Free to use
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: {
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    marginTop: 60,
    fontFamily: "'DM Sans', sans-serif",
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '48px 32px 0',
  },
  top: {
    display: 'flex',
    gap: 48,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  brand: {
    maxWidth: 240,
    flexShrink: 0,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoText: {
    fontFamily: "'Fraunces', serif",
    fontSize: '1.15rem',
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  tagline: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.65,
  },
  cols: {
    display: 'flex',
    gap: 40,
    flexWrap: 'wrap',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 120,
  },
  colHead: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  link: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color .12s',
  },
  disclaimer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(180,83,9,0.06)',
    border: '1px solid rgba(180,83,9,0.18)',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 12,
    color: '#92400e',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border)',
    padding: '16px 0 20px',
    flexWrap: 'wrap',
    gap: 12,
  },
  copy: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  badges: {
    display: 'flex',
    gap: 10,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-muted)',
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
  },
};
