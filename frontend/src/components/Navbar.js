import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart, getFavorites } from '../api';
import '../styles/variables.css';

const CATEGORIES = [
  'Bracelets', 'Necklaces', 'Rings',
  'Earrings', 'Keychains', 'Anklets', 'Hair Accessories',
];

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const dropRef = useRef(null);

  useEffect(() => {
    if (user) {
      getCart(user.userID)
        .then(res => {
          const totalItems = res.data.reduce((sum, item) => sum + item.ProductQuantity, 0);
          setCartCount(totalItems);
        })
        .catch(err => console.error('Failed to fetch cart:', err));

      getFavorites(user.userID)
        .then(res => setFavCount(res.data.length))
        .catch(err => console.error('Failed to fetch favorites:', err));
    } else {
      setCartCount(0);
      setFavCount(0);
    }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleCartUpdate = (event) => {
      setCartCount(prev => prev + event.detail.change);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  const activeCategory = new URLSearchParams(location.search).get('category') || '';

  return (
    <header style={S.header}>
      <div style={S.topBar}>
        <Link to="/" style={S.logo}>
  <img 
    src="/images/anikahon.png" 
    alt="AniKahon" 
    style={S.logoImage}
  />
  <span style={S.logoText}>AniKahon</span>
</Link>

        <form onSubmit={handleSearch} style={S.searchForm}>
          <input
            style={S.searchInput}
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={S.searchBtn} aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        <nav style={S.iconNav}>
          {/* Favorites - Icon only */}
          <div style={S.iconWrapper}>
            <Link to={user ? '/favorites' : '/login'} style={S.iconBtn} title="Favorites">
              <HeartIcon />
              {favCount > 0 && <span style={S.badge}>{favCount > 99 ? '99+' : favCount}</span>}
            </Link>
          </div>

          {/* Cart Button - White outline, brown on hover */}
          <div style={S.iconWrapper}>
            <Link 
              to={user ? '/cart' : '/login'} 
              style={S.cartBtn} 
              title="Cart" 
              className="cart-btn"
            >
              <CartIcon />
              <span style={S.btnText}>My Cart</span>
              {cartCount > 0 && <span style={S.badge}>{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>
          </div>

          {/* Profile Button - White outline, white text/icon */}
          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                style={S.profileBtn}
                onClick={() => setDropOpen(o => !o)}
                title="My Account"
                className="profile-btn"
              >
                <UserIcon />
                <span style={S.btnText}>{user.username || user.firstName || 'My Account'}</span>
              </button>
              {dropOpen && (
                <div style={S.dropdown}>
                  <div style={S.dropHeader}>
                    <span style={S.dropName}>{user.username || user.firstName}</span>
                    <span style={S.dropEmail}>{user.email}</span>
                  </div>
                  <Link to="/orders" style={S.dropItem} onClick={() => setDropOpen(false)}>My Orders</Link>
                  <Link to="/profile" style={S.dropItem} onClick={() => setDropOpen(false)}>Edit Profile</Link>
                  <div style={S.dropDivider} />
                  <button
                    style={S.dropSignOut}
                    onClick={() => { logoutUser(); setDropOpen(false); navigate('/'); }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={S.signInBtn}>Sign In</Link>
          )}
        </nav>
      </div>

      <nav style={S.catBar}>
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            to={`/catalog?category=${encodeURIComponent(cat)}`}
            style={{
              ...S.catLink,
              ...(activeCategory === cat ? S.catLinkActive : {}),
            }}
          >
            {cat.toUpperCase()}
          </Link>
        ))}
      </nav>
    </header>
  );
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const S = {
  header: { position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 12px rgba(120,80,40,0.15)' },
  topBar: { display: 'flex', alignItems: 'center', gap: 20, padding: '0 32px', height: 64, background: 'var(--brown-nav)' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 },
  logoIcon: { fontSize: 22 },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' },
  searchForm: { flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 24, overflow: 'hidden', maxWidth: 520 },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '9px 18px', fontSize: 14, background: 'transparent', color: 'var(--text-dark)' },
  searchBtn: { background: 'none', border: 'none', padding: '0 14px', color: 'var(--brown)', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  iconNav: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' },
  iconWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  
  iconBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 44, 
    height: 44, 
    borderRadius: '50%', 
    color: '#fff', 
    transition: 'all 0.2s ease', 
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      background: 'rgba(255,255,255,0.15)',
      transform: 'scale(1.05)',
    }
  },
  
  cartBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 30,
    background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.8)',
    color: '#fff',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    position: 'relative',
  },
  
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 30,
    background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.8)',
    color: '#fff',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'var(--font-body)',
  },
  
  btnText: {
    marginLeft: 4,
    fontWeight: 600,
  },
  
  badge: { 
    position: 'absolute', 
    top: -4, 
    right: -4, 
    background: 'var(--btn-pink)', 
    color: '#2C2C2C', 
    fontSize: 10, 
    fontWeight: 700, 
    minWidth: 16, 
    height: 16, 
    borderRadius: 8, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '0 3px' 
  },
  
  signInBtn: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: 600, 
    padding: '8px 20px', 
    border: '1.5px solid rgba(255,255,255,0.6)', 
    borderRadius: 30, 
    transition: 'all 0.2s ease', 
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    '&:hover': {
      background: '#fff',
      color: 'var(--brown-nav)',
      transform: 'translateY(-2px)',
    }
  },

  logoImage: {
  width: 55,
  height: 65,
  objectFit: 'contain',
  marginRight: 0,
},
  
  catBar: { display: 'flex', alignItems: 'center', gap: 75, padding: '0 32px', height: 38, background: 'var(--brown-header)', overflowX: 'auto', justifyContent: 'center' },
  catLink: { padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.80)', whiteSpace: 'nowrap', borderBottom: '2px solid transparent', transition: 'color 0.15s, border-color 0.15s', textDecoration: 'none' },
  catLinkActive: { color: '#fff', borderBottom: '2px solid rgba(255,255,255,0.8)' },
  dropdown: { position: 'absolute', right: 0, top: 48, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden', border: '1px solid var(--border-light)', zIndex: 1000 },
  dropHeader: { padding: '14px 16px 10px', borderBottom: '1px solid var(--border-light)' },
  dropName: { display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text-dark)' },
  dropEmail: { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  dropItem: { display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text-mid)', transition: 'background 0.12s', textDecoration: 'none', '&:hover': { background: 'var(--cream)' } },
  dropDivider: { height: 1, background: 'var(--border-light)' },
  dropSignOut: { display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: 'var(--status-cancelled)', cursor: 'pointer', fontFamily: 'var(--font-body)', '&:hover': { background: '#FDECEA' } },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  /* Cart Button Hover - White background with brown text */
  .cart-btn:hover {
    background: #fff !important;
    color: var(--brown-nav) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .cart-btn:hover svg {
    stroke: var(--brown-nav) !important;
  }
  
  /* Profile Button Hover - White background with brown text */
  .profile-btn:hover {
    background: #fff !important;
    color: var(--brown-nav) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .profile-btn:hover svg {
    stroke: var(--brown-nav) !important;
  }
`;
document.head.appendChild(styleSheet);
