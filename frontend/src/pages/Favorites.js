import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getFavorites, toggleFavorite, addToCart } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';

export default function Favorites() {
  const { user }   = useAuth();
  const navigate    = useNavigate();
  const [favs,    setFavs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState('');
  const [imageErrors, setImageErrors] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getFavorites(user.userID)
      .then(res => setFavs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Flying animation for Add to Cart
  const triggerFlyAnimation = (productImageElement) => {
    const cartIcon = document.querySelector('.cart-btn, .cart-icon');
    
    if (!productImageElement || !cartIcon) return;
    
    const imgRect = productImageElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    
    const flyX = cartRect.left + cartRect.width/2 - (imgRect.left + imgRect.width/2);
    const flyY = cartRect.top + cartRect.height/2 - (imgRect.top + imgRect.height/2);
    
    const clone = productImageElement.cloneNode(true);
    clone.classList.add('flying-item');
    
    clone.style.position = 'fixed';
    clone.style.left = imgRect.left + 'px';
    clone.style.top = imgRect.top + 'px';
    clone.style.width = imgRect.width + 'px';
    clone.style.height = imgRect.height + 'px';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    document.body.appendChild(clone);
    
    setTimeout(() => {
      clone.style.transform = `translate(${flyX}px, ${flyY}px) scale(0.2)`;
      clone.style.opacity = '0';
    }, 10);
    
    if (cartIcon) {
      cartIcon.classList.add('cart-bump');
      setTimeout(() => {
        cartIcon.classList.remove('cart-bump');
      }, 300);
    }
    
    setTimeout(() => {
      if (clone && clone.remove) {
        clone.remove();
      }
    }, 500);
  };

  const getImageUrl = (productId) => {
    if (imageErrors[productId]) {
      return '/images/products/placeholder.jpg';
    }
    return `/images/products/product-${productId}-1.jpg`;
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const handleRemove = async (productID) => {
    await toggleFavorite({ userID: user.userID, productID });
    setFavs(f => f.filter(x => x.Product.ProductID !== productID));
  };

  const handleAddToCart = async (product, imageElement) => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart({ userID: user.userID, productID: product.ProductID, quantity: 1 });
      showToast(`"${product.ProductName}" added to cart!`);
      
      if (imageElement) {
        triggerFlyAnimation(imageElement);
      }
      
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { change: 1 } }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add to cart.');
    }
  };

  const handleMoveAll = async () => {
    const inStock = favs.filter(f => f.Product.StockQuantity > 0);
    if (!inStock.length) { showToast('No in-stock items to move.'); return; }
    let count = 0;
    for (const f of inStock) {
      try {
        await addToCart({ userID: user.userID, productID: f.Product.ProductID, quantity: 1 });
        count++;
      } catch { /* skip */ }
    }
    showToast(`${count} item${count !== 1 ? 's' : ''} added to cart!`);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { change: count } }));
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        <div style={S.header}>
          <h2 style={S.pageTitle}>
            My Favorites ({favs.length})
          </h2>
          {favs.length > 0 && (
            <button style={S.moveAllBtn} onClick={handleMoveAll}>
              🛒&nbsp; Move All To Cart
            </button>
          )}
        </div>

        <div style={S.divider} />

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : favs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">♡</span>
            <p>You haven't added any favorites yet.</p>
            <Link to="/catalog" style={{ color: 'var(--brown)', fontWeight: 600, fontSize: 13 }}>
              Browse products →
            </Link>
          </div>
        ) : (
          <div style={S.grid}>
            {favs.map(fav => {
              const p = fav.Product;
              const inStock = p.StockQuantity > 0;
              const productId = p.ProductID;
              return (
                <div key={fav.FavoriteID} style={S.card} className="fav-card">
                  <div style={S.imgWrap}>
                    <img
                      src={getImageUrl(productId)}
                      alt={p.ProductName}
                      style={{ ...S.img, ...(inStock ? {} : S.imgGray) }}
                      className="fav-product-img"
                      onError={() => handleImageError(productId)}
                    />

                    <button
                      style={S.trashBtn}
                      onClick={() => handleRemove(p.ProductID)}
                      title="Remove from favorites"
                    >
                      <TrashIcon />
                    </button>

                    <div style={S.addToCartOverlay}>
                      <button
                        style={{ ...S.addToCartBtn, opacity: inStock ? 1 : 0.5 }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (inStock) {
                            const imgElement = e.currentTarget.closest('.fav-card').querySelector('.fav-product-img');
                            handleAddToCart(p, imgElement);
                          }
                        }}
                        disabled={!inStock}
                      >
                        🛒&nbsp; Add to Cart
                      </button>
                    </div>
                  </div>

                  <Link to={`/product/${p.ProductID}`} style={S.info}>
                    <p style={S.name}>{p.ProductName}</p>
                    <p style={S.price}>₱{Number(p.UnitPrice).toFixed(2)}</p>
                    <p style={S.stockLabel}>
                      {inStock ? '✔ In Stock' : '✖ Out of Stock'}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="success-toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const S = {
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 22,
    fontWeight: 700, color: 'var(--text-dark)',
  },
  moveAllBtn: {
    background: 'var(--btn-pink)', color: '#fff',
    border: 'none', borderRadius: 8,
    padding: '9px 22px', fontWeight: 600, fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  divider: { height: 1, background: 'var(--border-light)', marginBottom: 24 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },

  card: {
    background: '#fff', borderRadius: 10,
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  imgWrap: {
    position: 'relative',
    paddingBottom: '100%',
    background: 'var(--cream-dark)',
    overflow: 'hidden',
  },
  img: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', objectFit: 'cover',
  },
  imgGray: { filter: 'grayscale(50%) opacity(0.7)' },

  trashBtn: {
    position: 'absolute', top: 10, right: 10,
    background: 'rgba(255,255,255,0.9)',
    border: 'none', borderRadius: '50%',
    width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--status-cancelled)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },

  addToCartOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '10px',
    background: 'rgba(255,255,255,0.0)',
    transition: 'background 0.2s',
  },
  addToCartBtn: {
    width: '100%',
    background: 'var(--btn-pink)',
    color: '#fff', border: 'none',
    borderRadius: 6, padding: '8px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },

  info: {
    display: 'block', textDecoration: 'none',
    padding: '12px 14px 14px',
  },
  name: {
    fontSize: 13, fontWeight: 500,
    color: 'var(--text-dark)', marginBottom: 4,
    lineHeight: 1.4,
  },
  price: { fontSize: 14, fontWeight: 700, color: 'var(--brown)', marginBottom: 2 },
  stockLabel: { fontSize: 11, color: 'var(--text-muted)' },
};