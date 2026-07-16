import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useAuth } from './Auth';
import AuthModal from './Auth';
import './Navbar.css';
import logo from './assets/logo.png';

const LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/InputData', label: 'Vitals' },
  { to: '/Results',   label: 'Results' },
  { to: '/Trends',    label: 'Trends' },
  { to: '/Profile',   label: 'Profile' },
];

export default function Navbar() {
  useTheme();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase();

  const close = () => setMenuOpen(false);

  return (
    <>
      <header className="navbar">
        <NavLink to="/" className="navbar-logo" onClick={close}>
          <img src={logo} alt="Vitalyze" className="navbar-logo-img" />
          <span className="navbar-logo-text">Vitalyze</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="navbar-links">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              <button className="navbar-signout" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="navbar-cta" onClick={() => setShowAuth(true)}>Sign In</button>
          )}
          {/* Hamburger */}
          <button className="navbar-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span className={menuOpen ? 'bar bar-top open' : 'bar bar-top'} />
            <span className={menuOpen ? 'bar bar-mid open' : 'bar bar-mid'} />
            <span className={menuOpen ? 'bar bar-bot open' : 'bar bar-bot'} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-drawer" onClick={close}>
          <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>
            {LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}
                onClick={close}>
                {l.label}
              </NavLink>
            ))}
            <div className="mobile-drawer-footer">
              {user ? (
                <button className="navbar-signout" onClick={() => { logout(); close(); }}>Sign out</button>
              ) : (
                <button className="navbar-cta" style={{ width: '100%', textAlign: 'center' }}
                  onClick={() => { setShowAuth(true); close(); }}>Sign In</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
