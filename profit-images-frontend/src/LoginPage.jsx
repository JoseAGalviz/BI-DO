import { useState } from 'react';
import { login } from './api';
import logoSrc from './assets/logo.webp';

const IcoEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcoSpinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoImage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#fff" stroke="none"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await login(username, password);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus {
          outline: none;
          border-color: var(--teal-500) !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(47,187,168,0.15) !important;
        }
        .login-btn:hover:not(:disabled) {
          background: var(--teal-700) !important;
          transform: scale(1.015);
        }
        .login-btn:active:not(:disabled) { transform: scale(0.985); }
        .toggle-eye:hover { color: var(--teal-600) !important; }
      `}</style>

      <div style={s.root}>
        {/* ── Panel izquierdo ── */}
        <div style={s.left}>
          <div style={s.leftBg}/>
          <div style={s.leftContent}>
            <div style={s.brand}>
              <img src={logoSrc} alt="Profit" style={s.brandLogo}/>
              <div>
                <div style={s.brandName}>Profit</div>
                <div style={s.brandSub}>Banco de imágenes</div>
              </div>
            </div>

            <div style={s.hero}>
              <h1 style={s.heroTitle}>
                Gestión{' '}
                <span style={s.heroAccent}>de imágenes</span>
              </h1>
              <p style={s.heroDesc}>
                Administra los activos visuales de tu e-commerce directamente en Digital Ocean Spaces.
              </p>
            </div>

            <ul style={s.features}>
              {[
                'Organización por carpetas',
                'Carga y eliminación en lote',
                'CDN global integrado',
                'Acceso seguro con autenticación',
              ].map((f) => (
                <li key={f} style={s.featureItem}>
                  <div style={s.featureCheck}><IcoCheck/></div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div style={s.leftFade}/>
        </div>

        {/* ── Panel derecho ── */}
        <div style={s.right}>
          <div style={s.card}>
            <div style={s.cardHead}>
              <h2 style={s.cardTitle}>Bienvenido</h2>
              <p style={s.cardDesc}>Ingresa tus credenciales para acceder</p>
            </div>

            {error && (
              <div style={s.errorBox}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Usuario</label>
                <input
                  className="login-input"
                  style={s.input}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoFocus
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Contraseña</label>
                <div style={s.inputWrap}>
                  <input
                    className="login-input"
                    style={{ ...s.input, paddingRight: 46 }}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    style={s.eyeBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <IcoEyeOff/> : <IcoEye/>}
                  </button>
                </div>
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={loading || !username || !password}
                style={s.btn}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcoSpinner/> Validando...
                  </span>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh' },

  /* Left panel */
  left: {
    width: '50%', flexShrink: 0,
    background: 'var(--teal-700)',
    display: 'flex', flexDirection: 'column',
    padding: '48px 48px 32px',
    position: 'relative', overflow: 'hidden',
  },
  leftBg: {
    position: 'absolute', inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=1200&auto=format&fit=crop')",
    backgroundSize: 'cover', backgroundPosition: 'center',
    opacity: 0.41, mixBlendMode: 'overlay',
  },
  leftContent: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: 52, justifyContent: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  brandLogo: { height: 48, width: 'auto', flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.92)', padding: '4px 8px', backdropFilter: 'blur(4px)' },
  brandName: { fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  hero: {},
  heroTitle: {
    fontSize: 52, fontWeight: 800, color: '#fff',
    letterSpacing: '-1.2px', lineHeight: 1.15, marginBottom: 18,
  },
  heroAccent: { color: 'rgba(163,243,235,0.9)' },
  heroDesc: { fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 },

  features: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 13,
    fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
  },
  featureCheck: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--green-600)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  leftFade: {
    position: 'absolute', bottom: 0, left: 0,
    width: '100%', height: 120,
    background: 'linear-gradient(to top, var(--teal-700), transparent)',
    zIndex: 1,
  },
  leftFooter: {
    position: 'relative', zIndex: 2,
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    paddingTop: 16,
  },

  /* Right panel */
  right: {
    flex: 1,
    background: 'linear-gradient(135deg, #edfaf8 0%, #f1f5f4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 40,
  },
  card: {
    width: '100%', maxWidth: 440,
    padding: '0 40px',
  },
  cardHead: { marginBottom: 40 },
  cardTitle: { fontSize: 42, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' },
  cardDesc: { fontSize: 18, color: 'var(--text-secondary)', marginTop: 10 },

  errorBox: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '11px 14px', marginBottom: 20,
    background: '#fff5f5', border: '1px solid #fed7d7',
    borderRadius: 12, color: '#c53030',
    fontSize: 13, fontWeight: 500,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 28 },
  field: { display: 'flex', flexDirection: 'column', gap: 9 },
  label: { fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1px' },

  inputWrap: { position: 'relative' },
  input: {
    width: '100%', padding: '16px 20px',
    background: '#f8fafb', border: '1.5px solid var(--border)',
    borderRadius: 14, fontSize: 17, color: 'var(--text-primary)',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', inset: '0 0 0 auto',
    padding: '0 14px',
    background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    transition: 'color 0.15s',
  },

  btn: {
    padding: '17px', width: '100%',
    background: 'var(--teal-600)', color: '#fff',
    border: 'none', borderRadius: 14, fontSize: 16,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
    boxShadow: '0 4px 14px rgba(26,152,136,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnOff: { opacity: 0.5, cursor: 'not-allowed', transform: 'none' },
};
