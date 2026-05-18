import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/variables.css';
import '../../styles/admin.css';

export default function AdminLogin() {
  const [form,  setForm]  = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);
  const { loginAdmin: setAdmin } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await loginAdmin(form);
      setAdmin(res.data);
      navigate('/admin');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
  <div style={S.page}>
    <div style={S.card}>

        {/* ── Left: brand panel ── */}
        <div style={S.brandPanel}>
          {/* Subtle pattern overlay */}
          <div style={S.patternOverlay} />
          <div style={S.brandContent}>
            <div style={S.logoBlock}>
              <img 
  src="/images/anikahon.png" 
  alt="AniKahon" 
  style={S.logoImage}
/>
              <span style={S.logoText}>AniKahon</span>
            </div>
            <p style={S.brandTagline}>
              Managing Albayano crafts through a single platform.
            </p>
            <div style={S.brandDivider} />
            <p style={S.brandNote}>Admin Control Panel</p>
          </div>
          {/* Decorative circles */}
          <div style={S.decCircle1} />
          <div style={S.decCircle2} />
        </div>

        {/* ── Right: form ── */}
        <div style={S.formPanel}>
          <div style={S.formInner}>
            <h2 style={S.heading}>Administrator Login</h2>
            <p style={S.sub}>Login for administrators only.</p>

            {error && (
              <div style={S.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.form}>
              <div className="admin-field">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={form.username}
                  onChange={set('username')}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="admin-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                style={{
                  ...S.loginBtn,
                  opacity: busy ? 0.7 : 1,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
                type="submit"
                disabled={busy}
              >
                {busy ? 'Signing in…' : 'Sign In to Admin Panel'}
              </button>
            </form>

            <p style={S.backLink}>
              <a href="/" style={{ color: 'var(--brown)', fontWeight: 600 }}>
                ← Back to store
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

const S = {
  page: {
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundImage: 'url("/images/admin-login-bg.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  position: 'relative',
  padding: '24px 16px',
},
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 0,
},
  card: {
    display: 'flex',
    width: '100%', maxWidth: 820,
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
  },

  /* Left brand panel */
  brandPanel: {
    width: '44%',
    background: 'linear-gradient(145deg, #5C3D1E 0%, #3A2410 60%, #2A1A0A 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 36px',
  },
  patternOverlay: {
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(200,164,122,0.08) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(200,164,122,0.06) 0%, transparent 50%)`,
  },
  brandContent: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  logoBlock: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoIcon: { fontSize: 32 },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 28, fontWeight: 700, color: '#fff',
  },
  brandTagline: {
    fontSize: 13.5, color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6, maxWidth: 220,
  },
  brandDivider: {
    width: 48, height: 2,
    background: 'var(--brown-light)',
    borderRadius: 2,
    margin: '4px 0',
  },
  brandNote: {
    fontSize: 11, fontWeight: 700, letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--brown-light)',
  },
  /* Decorative circles */
  decCircle1: {
    position: 'absolute', bottom: -60, right: -60,
    width: 200, height: 200, borderRadius: '50%',
    border: '1.5px solid rgba(200,164,122,0.12)',
  },
  decCircle2: {
    position: 'absolute', bottom: -30, right: -30,
    width: 120, height: 120, borderRadius: '50%',
    border: '1.5px solid rgba(200,164,122,0.18)',
  },

  /* Right form */
  formPanel: {
    flex: 1,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 44px',
  },
  formInner: {
    width: '100%', maxWidth: 340,
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  formIcon: {
    width: 52, height: 52, borderRadius: 14,
    background: '#F4EFE8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22,
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 24, fontWeight: 700,
    color: '#3A2B1A', marginBottom: -8,
  },
  sub: { fontSize: 13, color: 'var(--text-muted)' },

  errorBox: {
    background: '#FDECEA',
    border: '1px solid rgba(200,100,100,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13, color: '#B71C1C',
    display: 'flex', alignItems: 'center', gap: 8,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 16 },

  loginBtn: {
    width: '100%',
    padding: '13px',
    background: '#3A2B1A',
    color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 700,
    fontFamily: 'var(--font-body)',
    transition: 'background 0.18s',
    marginTop: 4,
  },

  backLink: {
    textAlign: 'center', fontSize: 13,
    color: 'var(--text-muted)',
  },
  logoImage: {
  width: 55,
  height: 55,
  objectFit: 'contain',
},
};