import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser as loginAPI } from '../api';
import '../styles/variables.css';

export default function Login() {
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await loginAPI(form);
      loginUser(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Outer card */}
      <div style={S.card}>
        {/* Brand header strip */}
        <div style={S.brandBar}>
  <img 
    src="/images/anikahon.png" 
    alt="AniKahon" 
    style={S.brandImage}
  />
  <span style={S.brandName}>AniKahon</span>
</div>

        <div style={S.body}>
          {/* Left — hero image */}
          <div style={S.imgPanel}>
            <img
              src="/images/auth/login-hero.jpg"
              alt="Handcrafted accessories"
              style={S.img}
              onError={e => { e.target.src = '/images/auth/auth-placeholder.jpg'; }}
            />
          </div>

          {/* Right — form */}
          <div style={S.formPanel}>
            <h2 style={S.heading}>Login to AniKahon</h2>
            <p style={S.sub}>Enter your details below</p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} style={S.form}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Username or Email</label>
                <input
                  className="field-input"
                  placeholder="Username or Email"
                  type="text"
                  value={form.email}
                  onChange={set('email')}
                  required
                  autoComplete="email"
                />
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Password</label>
                <input
                  className="field-input"
                  placeholder="••••••••"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                />
              </div>


              <button
                className="btn-green"
                type="submit"
                disabled={busy}
                style={{ marginTop: 8, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Logging in…' : 'Login'}
              </button>

              <div className="divider" style={{ margin: '4px 0' }}>or</div>

              <Link to="/register" style={{ display: 'block' }}>
                <button className="btn-pink" type="button">Sign Up</button>
              </Link>
            </form>
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
    background: 'var(--cream)',
    padding: '24px 16px',
  },
  card: {
    width: '100%', maxWidth: 820,
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(120,80,40,0.14)',
    border: '1px solid var(--border-light)',
  },
  brandBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--brown-nav)',
    padding: '14px 28px',
  },
  brandIcon: { fontSize: 20 },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: 20, fontWeight: 700, color: '#fff',
  },
  body: {
    display: 'flex', minHeight: 440,
  },
  imgPanel: {
    width: '44%', flexShrink: 0,
    background: 'var(--cream-dark)',
    overflow: 'hidden',
  },
  img: {
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  formPanel: {
    flex: 1,
    padding: '44px 44px 40px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 26, fontWeight: 700,
    color: 'var(--text-dark)', marginBottom: 6,
  },
  sub: {
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 28,
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  fieldGroup: {
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  label: {
    fontSize: 12, fontWeight: 600, color: 'var(--text-mid)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  forgotRow: {
    display: 'flex', justifyContent: 'flex-end', marginTop: -6,
  },
  forgot: {
    fontSize: 12, color: 'var(--brown)', fontWeight: 500,
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  brandImage: {
  width: 55,
  height: 55,
  objectFit: 'contain',
},
};