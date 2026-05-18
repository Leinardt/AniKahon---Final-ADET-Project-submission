/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProduct, addToCart, toggleFavorite, getFavorites } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';


export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [toast, setToast] = useState('');
  const [busyCart, setBusyCart] = useState(false);
  const [variationNote, setVariationNote] = useState('');

  const imgPaths = (pid) => [1, 2, 3, 4].map(n =>
    `/images/products/product-${pid}-${n}.jpg`
  );
const CartIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: 'block', marginTop: '2px' }}
  >
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

  // ========== ANIMATION FUNCTIONS ==========
  
  const triggerFlyAnimation = () => {
    const productImg = document.querySelector('.product-main-img');
    const cartIcon = document.querySelector('.cart-btn, .cart-icon');
    
    if (!productImg || !cartIcon) {
      console.log('Animation: Could not find product image or cart icon');
      return;
    }
    
    const imgRect = productImg.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    
    const flyX = cartRect.left + cartRect.width/2 - (imgRect.left + imgRect.width/2);
    const flyY = cartRect.top + cartRect.height/2 - (imgRect.top + imgRect.height/2);
    
    const clone = productImg.cloneNode(true);
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

  const triggerHeartPop = (x, y) => {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.classList.add('heart-pop');
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 500);
  };

  // ========== END ANIMATION FUNCTIONS ==========

  // Load product data
  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(res => {
        setProduct(res.data);
        setActiveImg(0);
        setQty(1);
      })
      .catch(() => navigate('/catalog'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Load favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && id) {
        try {
          const res = await getFavorites(user.userID);
          const isFavorited = res.data.some(fav => fav.Product.ProductID === parseInt(id));
          setFav(isFavorited);
        } catch (err) {
          console.error('Failed to check favorite status:', err);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [user, id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (busyCart) return;
    setBusyCart(true);
    try {
      await addToCart({ 
        userID: user.userID, 
        productID: product.ProductID, 
        quantity: qty,
        note: variationNote
      });
      showToast('Added to cart!');
      triggerFlyAnimation();
      
      // Simple event - just signal that cart was updated
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { change: qty } }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add to cart.');
    } finally {
      setBusyCart(false);
    }
  };
  
  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart({ userID: user.userID, productID: product.ProductID, quantity: qty });
      navigate('/cart');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not proceed.');
    }
  };

  const handleFav = async (e) => {
    if (!user) { navigate('/login'); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    try {
      const res = await toggleFavorite({ userID: user.userID, productID: product.ProductID });
      setFav(res.data.favorited);
      showToast(res.data.favorited ? 'Added to favorites!' : 'Removed from favorites.');
      triggerHeartPop(rect.left + rect.width/2, rect.top + rect.height/2);
    } catch { /* silent */ }
  };

  const inStock = product && product.StockQuantity > 0;
  const images = product ? imgPaths(product.ProductID) : [];

  if (loading) return (
    <div><Navbar /><div className="spinner-wrap" style={{ height: '60vh' }}><div className="spinner" /></div></div>
  );

  if (!product) return null;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        <div style={S.breadcrumb}>
          <Link to="/" style={S.breadLink}>Home</Link>
          <span style={S.breadSep}>/</span>
          <Link to={`/catalog?category=${product.CategoryType}`} style={S.breadLink}>
            {product.CategoryType || 'Catalog'}
          </Link>
          <span style={S.breadSep}>/</span>
          <span style={S.breadCurrent}>{product.ProductName}</span>
        </div>

        <div style={S.layout}>
          <div style={S.gallery}>
            <div style={S.thumbCol}>
              {images.map((src, i) => (
                <button
                  key={i}
                  style={{ ...S.thumb, ...(activeImg === i ? S.thumbActive : {}) }}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={src} alt={`View ${i + 1}`} style={S.thumbImg} onError={e => { e.target.src = '/images/products/placeholder.jpg'; }} />
                </button>
              ))}
            </div>
            <div style={S.mainImgWrap}>
              <img
                src={product.image_url || images[activeImg] || '/images/products/placeholder.jpg'}
                alt={product.ProductName}
                style={S.mainImg}
                className="product-main-img"
                onError={e => { e.target.src = '/images/products/placeholder.jpg'; }}
              />
            </div>
          </div>

          <div style={S.details}>
            <p style={S.catTag}>{(product.CategoryType || '').toUpperCase()}</p>
            <h1 style={S.productName}>{product.ProductName}</h1>
            <p style={S.price}>₱{Number(product.UnitPrice).toFixed(2)}</p>
            <p style={S.description}>
              {product.ProductDescription || 'Handcrafted by skilled Albayano artisans using locally sourced materials.'}
            </p>
            <div style={S.divider} />

            <div style={S.qtyRow}>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <input className="qty-num" value={qty} readOnly />
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.StockQuantity, q + 1))} disabled={!inStock}>+</button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                {inStock ? `${product.StockQuantity} available` : <span style={{ color: 'var(--status-cancelled)', fontWeight: 600 }}>Out of Stock</span>}
              </span>
              <button
                style={{ ...S.favBtn, color: fav ? '#E05050' : 'var(--text-muted)', borderColor: fav ? '#E05050' : 'var(--border)' }}
                onClick={handleFav}
                title={fav ? 'Remove from favorites' : 'Add to favorites'}
              >
                {fav ? '♥' : '♡'}
              </button>
            </div>

            <div style={S.noteSection}>
              <label style={S.noteLabel}>Special Request / Variation:<span style={S.noteHint}>(e.g., color preference, size, or engraving)</span></label>
              <textarea style={S.noteInput} placeholder="Example: Brown leather, 8mm size, or gift wrapping request..." value={variationNote} onChange={(e) => setVariationNote(e.target.value)} rows="2" />
            </div>

            <div style={S.actions}>
  <button 
    className="btn-pink" 
    onClick={handleAddToCart} 
    disabled={!inStock || busyCart} 
    style={{ 
      opacity: (!inStock || busyCart) ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%'
    }}
  >
    <CartIcon />
    <span>Add to Cart</span>
  </button>
  <button 
    className="btn-green" 
    onClick={handleBuyNow} 
    disabled={!inStock} 
    style={{ opacity: !inStock ? 0.6 : 1 }}
  >
    Buy Now
  </button>
</div>
          </div>
        </div>
      </div>
      {toast && <div className="success-toast"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  );
}

const S = {
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 12 },
  breadLink: { color: 'var(--brown)', cursor: 'pointer' },
  breadSep: { color: 'var(--border)' },
  breadCurrent: { color: 'var(--text-mid)' },
  layout: { display: 'flex', gap: 48, alignItems: 'flex-start' },
  gallery: { display: 'flex', gap: 12, width: 480, flexShrink: 0 },
  thumbCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  thumb: { width: 68, height: 68, border: '2px solid var(--border-light)', borderRadius: 8, overflow: 'hidden', background: 'var(--cream-dark)', cursor: 'pointer', padding: 0, transition: 'border-color 0.15s' },
  thumbActive: { borderColor: 'var(--brown)' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  mainImgWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', background: 'var(--cream-dark)', aspectRatio: '1' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  details: { flex: 1 },
  catTag: { fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--brown-light)', marginBottom: 8 },
  productName: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 10, lineHeight: 1.25 },
  price: { fontSize: 22, fontWeight: 700, color: 'var(--brown-dark)', marginBottom: 16 },
  description: { fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.75, marginBottom: 20 },
  divider: { height: 1, background: 'var(--border-light)', marginBottom: 20 },
  sizeRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
  sizeLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-mid)' },
  sizeBtns: { display: 'flex', gap: 8 },
  sizeBtn: { width: 36, height: 36, border: '1.5px solid var(--border)', borderRadius: 6, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-mid)', transition: 'border-color 0.15s, background 0.15s' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 },
  favBtn: { width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, border-color 0.15s' },
  noteSection: { marginBottom: 20, padding: '12px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' },
  noteLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 8 },
  noteHint: { fontSize: 11, fontWeight: 400, color: 'var(--text-light)', marginLeft: 8 },
  noteInput: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s' },
  actions: { display: 'flex', flexDirection: 'column', gap: 12 },
};