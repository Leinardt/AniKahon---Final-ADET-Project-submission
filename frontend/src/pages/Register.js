import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import '../styles/variables.css';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '',
    email: '', contactNum: '', address: '',
    password: '', confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const setField = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last Name validation
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Username validation
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    // Phone validation
    if (!form.contactNum.trim()) {
      newErrors.contactNum = 'Phone number is required';
    } else if (!validatePhone(form.contactNum)) {
      newErrors.contactNum = 'Phone number must be exactly 11 digits (e.g., 09123456789)';
    }

    // Address validation (optional but recommended)
    if (!form.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (form.password !== form.confirm) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setBusy(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      
      // Check for specific error types
      if (errorMsg.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: 'Username already taken. Please choose another.' }));
      } else if (errorMsg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered. Please use another.' }));
      } else {
        setApiError(errorMsg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Brand header */}
        <div style={S.brandBar}>
          <img 
            src="/images/anikahon.png" 
            alt="AniKahon" 
            style={S.brandImage}
          />
          <span style={S.brandName}>AniKahon</span>
        </div>

        <div style={S.body}>
          {/* Left image */}
          <div style={S.imgPanel}>
            <img
              src="/images/auth/login-hero.jpg"
              alt="Handcrafted accessories"
              style={S.img}
              onError={e => { e.target.src = '/images/auth/auth-placeholder.jpg'; }}
            />
          </div>

          {/* Right form */}
          <div style={S.formPanel}>
            <h2 style={S.heading}>Create an account</h2>
            <p style={S.sub}>Enter your details below</p>

            {apiError && <div className="error-msg">{apiError}</div>}

            <form onSubmit={handleSubmit} style={S.form}>
              {/* Row: First + Last name */}
              <div style={S.row}>
                <div style={S.fieldGroup}>
                  <input 
                    className="field-input" 
                    placeholder="First Name *"
                    value={form.firstName} 
                    onChange={setField('firstName')}
                    style={{ borderColor: errors.firstName ? '#f44336' : undefined }}
                  />
                  {errors.firstName && <p style={S.errorText}>{errors.firstName}</p>}
                </div>
                <div style={S.fieldGroup}>
                  <input 
                    className="field-input" 
                    placeholder="Last Name *"
                    value={form.lastName} 
                    onChange={setField('lastName')}
                    style={{ borderColor: errors.lastName ? '#f44336' : undefined }}
                  />
                  {errors.lastName && <p style={S.errorText}>{errors.lastName}</p>}
                </div>
              </div>

              {/* Username */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Username *"
                  value={form.username} 
                  onChange={setField('username')}
                  style={{ borderColor: errors.username ? '#f44336' : undefined }}
                />
                {errors.username && <p style={S.errorText}>{errors.username}</p>}
              </div>

              {/* Email */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Email *" 
                  type="email"
                  value={form.email} 
                  onChange={setField('email')}
                  style={{ borderColor: errors.email ? '#f44336' : undefined }}
                />
                {errors.email && <p style={S.errorText}>{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Phone Number * (11 digits)" 
                  type="tel"
                  value={form.contactNum} 
                  onChange={setField('contactNum')}
                  style={{ borderColor: errors.contactNum ? '#f44336' : undefined }}
                />
                {errors.contactNum && <p style={S.errorText}>{errors.contactNum}</p>}
              </div>

              {/* Delivery Address */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Delivery Address *"
                  value={form.address} 
                  onChange={setField('address')}
                  style={{ borderColor: errors.address ? '#f44336' : undefined }}
                />
                {errors.address && <p style={S.errorText}>{errors.address}</p>}
              </div>

              {/* Password */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Password * (min. 6 characters)" 
                  type="password"
                  value={form.password} 
                  onChange={setField('password')}
                  style={{ borderColor: errors.password ? '#f44336' : undefined }}
                />
                {errors.password && <p style={S.errorText}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div style={S.fieldGroup}>
                <input 
                  className="field-input" 
                  placeholder="Confirm Password *" 
                  type="password"
                  value={form.confirm} 
                  onChange={setField('confirm')}
                  style={{ borderColor: errors.confirm ? '#f44336' : undefined }}
                />
                {errors.confirm && <p style={S.errorText}>{errors.confirm}</p>}
              </div>

              <button
                className="btn-pink"
                type="submit"
                disabled={busy}
                style={{ marginTop: 8, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p style={S.loginLink}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--brown)', fontWeight: 600 }}>Sign in</Link>
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
    background: 'var(--cream)', padding: '24px 16px',
  },
  card: {
    width: '100%', maxWidth: 860,
    background: '#fff', borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(120,80,40,0.14)',
    border: '1px solid var(--border-light)',
  },
  brandBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--brown-nav)', padding: '14px 28px',
  },
  brandName: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff' },
  body: { display: 'flex', minHeight: 560 },
  imgPanel: {
    width: '38%', flexShrink: 0,
    background: 'var(--cream-dark)', overflow: 'hidden',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  formPanel: {
    flex: 1, padding: '36px 44px 36px',
    display: 'flex', flexDirection: 'column',
  },
  heading: {
    fontFamily: 'var(--font-display)', fontSize: 26,
    fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6,
  },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  row: { display: 'flex', gap: 16 },
  fieldGroup: { flex: 1 },
  loginLink: {
    marginTop: 18, fontSize: 13, color: 'var(--text-mid)', textAlign: 'center',
  },
  brandImage: {
    width: 28,
    height: 28,
    objectFit: 'contain',
  },
  errorText: {
    fontSize: 11,
    color: '#f44336',
    marginTop: 4,
    marginBottom: 0,
  },
};