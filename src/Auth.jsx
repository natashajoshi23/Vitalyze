import { useEffect, useState } from 'react';

// Netlify Identity widget — lazy-loaded to avoid SSR issues
let netlifyIdentity = null;

async function getIdentity() {
  if (netlifyIdentity) return netlifyIdentity;
  const mod = await import('netlify-identity-widget');
  netlifyIdentity = mod.default;
  netlifyIdentity.init({ logo: false, APIUrl: 'https://vitalyzer.netlify.app/.netlify/identity' });
  return netlifyIdentity;
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nl_user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    getIdentity().then(ni => {
      const current = ni.currentUser();
      if (current) { setUser(current); localStorage.setItem('nl_user', JSON.stringify(current)); }
      ni.on('login', u => { setUser(u); localStorage.setItem('nl_user', JSON.stringify(u)); ni.close(); });
      ni.on('logout', () => { setUser(null); localStorage.removeItem('nl_user'); });
    });
  }, []);

  const login  = async () => (await getIdentity()).open('login');
  const signup = async () => (await getIdentity()).open('signup');
  const logout = async () => (await getIdentity()).logout();

  return { user, login, signup, logout };
}

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.top}>
          <div style={s.top3} />
          <div style={s.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 style={s.title}>Sign in to Vitalyze</h2>
          <p style={s.sub}>Save your vitals history and access it from any device.</p>
        </div>
        <div style={s.body}>
          <button style={s.btnPrimary} onClick={login}>Sign In</button>
          <button style={s.btnSecondary} onClick={signup}>Create Account</button>
          <p style={s.note}>
            Or continue without an account — your data is stored locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(6,19,26,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' },
  top: { background: 'linear-gradient(135deg,#0a4a5c,#0d6b80)', padding: '36px 32px 28px', position: 'relative', overflow: 'hidden', textAlign: 'center' },
  top3: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#00c4b4,#8b2020)' },
  icon: { width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  title: { fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 300, color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 },
  body: { padding: 28, display: 'flex', flexDirection: 'column', gap: 12 },
  btnPrimary: { padding: '14px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#0a4a5c,#0d6b80)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  note: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, marginTop: 4 },
};
