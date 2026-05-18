import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';
import '../styles/admin.css';

const Icons = {
  dashboard: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  orders: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  products: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  vouchers: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  reports: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  signout: (
    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard', icon: Icons.dashboard },
  { to: '/admin/orders',    label: 'Orders',    icon: Icons.orders    },
  { to: '/admin/products',  label: 'Products',  icon: Icons.products  },
  { to: '/admin/vouchers',  label: 'Vouchers',  icon: Icons.vouchers  },
  { to: '/admin/reports',   label: 'Reports',   icon: Icons.reports   },
];

export default function AdminLayout({ children, title }) {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const initials = (admin?.username || 'A').slice(0, 2).toUpperCase();

  return (
    <div className="admin-shell">

      {/* ══ Sidebar ══ */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <img 
  src="/images/anikahon.png" 
  alt="AniKahon" 
  className="admin-sidebar-logo-icon"
  style={{ width: 55, height: 55 }}
/>
          <div>
            <div className="admin-sidebar-logo-text">AniKahon</div>
            <div className="admin-sidebar-logo-sub">Admin Panel</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="admin-sidebar-section">
          <p className="admin-sidebar-section-label">Main Menu</p>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link${isActive(item.to) ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Footer: sign out */}
        <div className="admin-sidebar-footer">
          {/* Admin info chip */}
          <div style={S.adminChip}>
            <div style={S.adminAvatar}>{initials}</div>
            <div style={S.adminMeta}>
              <span style={S.adminName}>{admin?.username || 'Admin'}</span>
              <span style={S.adminRole}>Administrator</span>
            </div>
          </div>
          <button className="admin-signout-btn" onClick={handleSignOut} style={{ marginTop: 10 }}>
            {Icons.signout}
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══ Main area ══ */}
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <h1 className="admin-topbar-title">{title}</h1>
          <div className="admin-topbar-right">
            <a href="/" style={S.viewStoreLink} target="_blank" rel="noreferrer">
              View Store →
            </a>
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">{initials}</div>
              <span>{admin?.username}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content">
          {children}
        </div>
      </div>

    </div>
  );
}

const S = {
  adminChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  adminAvatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'var(--brown-nav)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: '#fff',
    flexShrink: 0,
  },
  adminMeta:  { display: 'flex', flexDirection: 'column', gap: 1 },
  adminName:  { fontSize: 13, fontWeight: 600, color: '#fff' },
  adminRole:  { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  viewStoreLink: {
    fontSize: 12, fontWeight: 600,
    color: 'var(--brown)',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
logoWrapper: {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 0,
},
logoImage: {
  width: 75,
  height: 75,
  objectFit: 'contain',
},
logoText: {
  fontFamily: "'Poppins', Poppins",
  color: 'white',
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
},
};