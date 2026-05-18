import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getUserProfile, updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';

const AddressIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const OrdersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function Profile() {
  const { user, logoutUser, loginUser } = useAuth();
  const navigate = useNavigate();
  const addressRef = useRef(null);
  const passwordRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    username: '', contactNum: '',
    address: '', barangay: '', municipality: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmNew: '',
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!form.contactNum.trim()) {
      newErrors.contactNum = 'Phone number is required';
    } else if (!validatePhone(form.contactNum)) {
      newErrors.contactNum = 'Phone number must be exactly 11 digits (e.g., 09123456789)';
    }

    if (!form.address.trim()) {
      newErrors.address = 'Street address is required';
    }
    if (!form.barangay.trim()) {
      newErrors.barangay = 'Barangay is required';
    }
    if (!form.municipality.trim()) {
      newErrors.municipality = 'Municipality/City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmNew) {
      newErrors.confirmNew = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.userID)
      .then(res => {
        const d = res.data;
        setProfile(d);
        setForm({
          firstName:    d.FirstName    || '',
          lastName:     d.LastName     || '',
          email:        d.Email        || '',
          username:     d.Username     || '',
          contactNum:   d.ContactNum   || '',
          address:      d.Address      || '',
          barangay:     d.Barangay     || '',
          municipality: d.Municipality || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const setField = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const setPasswordField = (k) => (e) => {
    setPasswordForm(f => ({ ...f, [k]: e.target.value }));
    if (passwordErrors[k]) {
      setPasswordErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const scrollToAddress = () => {
    addressRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPassword = () => {
    passwordRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaved(false);

    if (!validateProfileForm()) {
      return;
    }

    try {
      const updatedData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        contactNum: form.contactNum,
        address: form.address,
        barangay: form.barangay,
        municipality: form.municipality,
      };

      await updateProfile(user.userID, updatedData);

      loginUser({
        ...user,
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile.';
      if (errorMsg.includes('username') || errorMsg.includes('Username')) {
        setErrors(prev => ({ ...prev, username: 'Username already taken. Please choose another.' }));
      } else if (errorMsg.includes('email') || errorMsg.includes('Email')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered. Please use another.' }));
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSaved(false);

    if (!validatePasswordForm()) {
      return;
    }

    try {
      await updateProfile(user.userID, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSaved(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNew: '',
      });
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update password.';
      if (errorMsg.includes('Current password')) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleSignOut = () => {
    logoutUser();
    navigate('/');
  };

  if (loading) return (
    <div><Navbar /><div className="spinner-wrap" style={{ height: '60vh' }}><div className="spinner" /></div></div>
  );

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        <div style={S.welcomeRow}>
          <p style={S.welcome}>
            Welcome, <span style={{ color: 'var(--brown)', fontWeight: 700 }}>
              {profile?.FirstName || profile?.Username || user?.username}
            </span>!
          </p>
        </div>

        <div style={S.layout}>
          {/* Left sidebar with navigation */}
          <aside style={S.sidebar}>
            <p style={S.sidebarHeading}>My Account</p>
            <nav style={S.sideNav}>
              <span style={S.sideActive}>
                <UserIcon />
                <span>Profile</span>
              </span>
              <span style={S.sideLink} onClick={scrollToAddress}>
                <AddressIcon />
                <span>Address Book</span>
              </span>
              <span style={S.sideLink} onClick={scrollToPassword}>
                <LockIcon />
                <span>Password & Security</span>
              </span>
              <Link to="/orders" style={S.sideLink}>
                <OrdersIcon />
                <span>My Orders</span>
              </Link>
              <Link to="/cart" style={S.sideLink}>
                <CartIcon />
                <span>My Cart</span>
              </Link>
              <Link to="/favorites" style={S.sideLink}>
                <HeartIcon />
                <span>Favorites</span>
              </Link>
              <button style={S.signOutBtn} onClick={handleSignOut}>
                <SignOutIcon />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Right: edit profile and password sections */}
          <div style={S.formCard}>
            <h2 style={S.formTitle}>Edit Your Profile</h2>

            {saved && (
              <div style={S.successBanner}>
                ✓ Profile updated successfully.
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              {/* Row: First + Last name */}
              <div style={S.row}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>First Name *</label>
                  <input 
                    className="field-filled" 
                    value={form.firstName} 
                    onChange={setField('firstName')}
                    style={{ borderColor: errors.firstName ? '#f44336' : undefined }}
                  />
                  {errors.firstName && <p style={S.errorText}>{errors.firstName}</p>}
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Last Name *</label>
                  <input 
                    className="field-filled" 
                    value={form.lastName}  
                    onChange={setField('lastName')}
                    style={{ borderColor: errors.lastName ? '#f44336' : undefined }}
                  />
                  {errors.lastName && <p style={S.errorText}>{errors.lastName}</p>}
                </div>
              </div>

              {/* Row: Email + Username */}
              <div style={S.row}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Email *</label>
                  <input 
                    className="field-filled" 
                    type="email" 
                    value={form.email} 
                    onChange={setField('email')}
                    style={{ borderColor: errors.email ? '#f44336' : undefined }}
                  />
                  {errors.email && <p style={S.errorText}>{errors.email}</p>}
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Username *</label>
                  <input 
                    className="field-filled" 
                    value={form.username} 
                    onChange={setField('username')}
                    style={{ borderColor: errors.username ? '#f44336' : undefined }}
                  />
                  {errors.username && <p style={S.errorText}>{errors.username}</p>}
                </div>
              </div>

              {/* Phone */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Phone Number * (11 digits)</label>
                <input 
                  className="field-filled" 
                  value={form.contactNum} 
                  onChange={setField('contactNum')}
                  placeholder="09123456789"
                  style={{ borderColor: errors.contactNum ? '#f44336' : undefined }}
                />
                {errors.contactNum && <p style={S.errorText}>{errors.contactNum}</p>}
              </div>

              {/* Address Section */}
              <div ref={addressRef} style={S.addressSection}>
                <p style={S.addressTitle}>
                  <AddressIcon />
                  <span>Delivery Address</span>
                </p>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Street Address *</label>
                  <textarea
                    className="field-filled"
                    value={form.address}
                    onChange={setField('address')}
                    rows="2"
                    placeholder="House/Unit #, Street, Subdivision"
                    style={{ resize: 'vertical', borderColor: errors.address ? '#f44336' : undefined }}
                  />
                  {errors.address && <p style={S.errorText}>{errors.address}</p>}
                </div>
                <div style={S.row}>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Barangay *</label>
                    <input 
                      className="field-filled" 
                      value={form.barangay} 
                      onChange={setField('barangay')}
                      placeholder="Barangay"
                      style={{ borderColor: errors.barangay ? '#f44336' : undefined }}
                    />
                    {errors.barangay && <p style={S.errorText}>{errors.barangay}</p>}
                  </div>
                  <div style={S.fieldGroup}>
                    <label style={S.label}>Municipality / City *</label>
                    <input 
                      className="field-filled" 
                      value={form.municipality} 
                      onChange={setField('municipality')}
                      placeholder="e.g., Legazpi City, Daraga, Tabaco"
                      style={{ borderColor: errors.municipality ? '#f44336' : undefined }}
                    />
                    {errors.municipality && <p style={S.errorText}>{errors.municipality}</p>}
                  </div>
                </div>
                <p style={S.addressHint}>
                  This address will be pre-filled during checkout for COD orders.
                </p>
              </div>

              {/* Actions for Profile */}
              <div style={S.actions}>
                <button type="button" style={S.cancelBtn} onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button className="btn-green" type="submit" style={{ width: 'auto', padding: '10px 36px' }}>
                  Save Profile
                </button>
              </div>
            </form>

            {/* Divider */}
            <div style={S.divider} />

            {/* Password Section */}
            <div ref={passwordRef}>
              <h2 style={S.formTitle}>Change Password</h2>

              {passwordSaved && (
                <div style={S.successBanner}>
                  ✓ Password changed successfully.
                </div>
              )}

              <form onSubmit={handleSavePassword}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Current Password *</label>
                  <input
                    className="field-filled"
                    type="password"
                    placeholder="Enter your current password"
                    value={passwordForm.currentPassword}
                    onChange={setPasswordField('currentPassword')}
                    style={{ borderColor: passwordErrors.currentPassword ? '#f44336' : undefined }}
                  />
                  {passwordErrors.currentPassword && <p style={S.errorText}>{passwordErrors.currentPassword}</p>}
                </div>

                <div style={S.fieldGroup}>
                  <label style={S.label}>New Password * (min. 6 characters)</label>
                  <input
                    className="field-filled"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={setPasswordField('newPassword')}
                    style={{ borderColor: passwordErrors.newPassword ? '#f44336' : undefined }}
                  />
                  {passwordErrors.newPassword && <p style={S.errorText}>{passwordErrors.newPassword}</p>}
                </div>

                <div style={S.fieldGroup}>
                  <label style={S.label}>Confirm New Password *</label>
                  <input
                    className="field-filled"
                    type="password"
                    placeholder="Confirm your new password"
                    value={passwordForm.confirmNew}
                    onChange={setPasswordField('confirmNew')}
                    style={{ borderColor: passwordErrors.confirmNew ? '#f44336' : undefined }}
                  />
                  {passwordErrors.confirmNew && <p style={S.errorText}>{passwordErrors.confirmNew}</p>}
                </div>

                {/* Actions for Password */}
                <div style={S.actions}>
                  <button type="button" style={S.cancelBtn} onClick={() => {
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmNew: '' });
                    setPasswordErrors({});
                  }}>
                    Clear
                  </button>
                  <button className="btn-green" type="submit" style={{ width: 'auto', padding: '10px 36px' }}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  welcomeRow: {
    display: 'flex', justifyContent: 'flex-end', marginBottom: 16,
  },
  welcome: { fontSize: 16, color: 'var(--text-dark)' },

  layout: {
    display: 'flex', gap: 28, alignItems: 'flex-start',
  },

  sidebar: {
    width: 200, flexShrink: 0,
    background: '#fff', borderRadius: 12,
    boxShadow: 'var(--shadow-sm)', padding: '20px',
  },
  sidebarHeading: {
    fontSize: 13, fontWeight: 700,
    color: 'var(--text-dark)', marginBottom: 14,
  },
  sideNav: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 4 
  },
  sideActive: {
    fontSize: 14, fontWeight: 700,
    color: 'var(--btn-pink)', cursor: 'default',
    padding: '8px 12px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--cream)',
  },
  sideLink: {
    fontSize: 14, color: 'var(--text-mid)',
    cursor: 'pointer', padding: '8px 12px',
    borderRadius: 8, transition: 'background 0.12s',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    '&:hover': { background: 'var(--cream)' },
  },
  signOutBtn: {
    marginTop: 8,
    background: 'none', border: 'none',
    fontSize: 14, color: 'var(--btn-pink)',
    fontWeight: 600, cursor: 'pointer',
    textAlign: 'left', padding: '8px 12px',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 8,
    transition: 'background 0.12s',
    '&:hover': { background: '#FDECEA' },
  },

  formCard: {
    flex: 1, background: '#fff',
    borderRadius: 12, boxShadow: 'var(--shadow-sm)',
    padding: '28px 32px',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20, fontWeight: 700,
    color: 'var(--brown)', marginBottom: 20,
  },
  row: { display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 0 },
  fieldGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: 600,
    color: 'var(--text-mid)',
  },
  errorText: {
    fontSize: 11,
    color: '#f44336',
    marginTop: 2,
  },

  addressSection: {
    padding: '16px',
    background: 'var(--cream)',
    borderRadius: 12,
    border: '1px solid var(--border-light)',
    marginBottom: 20,
  },
  addressTitle: {
    fontSize: 14, fontWeight: 700,
    color: 'var(--brown-dark)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  addressHint: {
    fontSize: 11,
    color: 'var(--text-light)',
    marginTop: 8,
    fontStyle: 'italic',
  },

  actions: {
    display: 'flex', gap: 14, justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    background: 'none', border: 'none',
    color: 'var(--text-mid)', fontSize: 14,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  successBanner: {
    background: '#E8F5E9', color: '#2E7D32',
    borderRadius: 8, padding: '10px 16px',
    fontSize: 13, fontWeight: 600, marginBottom: 14,
    border: '1px solid #A5D6A7',
  },
  divider: {
    height: 1,
    background: 'var(--border-light)',
    margin: '28px 0 24px',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .side-link:hover {
    background: #F2EBE0;
  }
`;
document.head.appendChild(styleSheet);