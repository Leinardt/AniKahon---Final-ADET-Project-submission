import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCart, updateCartItem, removeCartItem } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';

export default function Cart() {
  const { user }  = useAuth();
  const navigate   = useNavigate();
  const [items,    setItems]    = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading,  setLoading]  = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [hasAutoSelected, setHasAutoSelected] = useState(false); // NEW

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getCart(user.userID)
      .then(res => {
        const cartItems = res.data;
        setItems(cartItems);
        
        // CHANGED: Only auto-select on first load, and only select the most recent item
        if (!hasAutoSelected && cartItems.length > 0) {
          // Select ONLY the most recently added item (last item in array)
          const lastItemId = cartItems[cartItems.length - 1]?.CartItemID;
          if (lastItemId) {
            setSelected(new Set([lastItemId]));
          }
          setHasAutoSelected(true);
        } else if (!hasAutoSelected && cartItems.length === 0) {
          setHasAutoSelected(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, hasAutoSelected]); // CHANGED: added hasAutoSelected to dependencies

  useEffect(() => { load(); }, [load]);

  // NEW: Reset selection when leaving the page
  useEffect(() => {
    return () => {
      setSelected(new Set());
      setHasAutoSelected(false);
    };
  }, []);

  /* Selection helpers */
  const isAllSelected = items.length > 0 && items.every(i => selected.has(i.CartItemID));

  const toggleAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.CartItemID)));
  };

  const toggleOne = (id) => {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* Cart operations */
  const changeQty = async (item, delta) => {
    const newQty = item.ProductQuantity + delta;
    if (newQty < 1) {
      await removeCartItem(item.CartItemID);
    } else {
      await updateCartItem(item.CartItemID, newQty);
    }
    load();
  };

  const remove = async (id) => {
    await removeCartItem(id);
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    load();
  };

  /* Get image URL based on product ID */
  const getImageUrl = (productId) => {
    if (imageErrors[productId]) {
      return '/images/products/placeholder.jpg';
    }
    return `/images/products/product-${productId}-1.jpg`;
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  /* Totals */
  const selectedItems = items.filter(i => selected.has(i.CartItemID));
  const subtotal = selectedItems.reduce(
    (sum, i) => sum + Number(i.Product.UnitPrice) * i.ProductQuantity, 0
  );

  const handleCheckout = () => {
    if (!selectedItems.length) return;
    navigate('/checkout', { state: { items: selectedItems } });
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <p>Your cart is empty.</p>
            <Link to="/catalog" style={{ color: 'var(--brown)', fontWeight: 600, fontSize: 13 }}>
              Browse products →
            </Link>
          </div>
        ) : (
          <div style={S.layout}>
            {/* ── Item list ── */}
            <div style={S.left}>
              {/* Header row */}
              <div style={S.listHeader}>
                <label style={S.selectAllLabel}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    style={S.checkbox}
                  />
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)' }}>
                    My Cart ({items.length})
                  </span>
                </label>
                <button style={S.selectAllBtn} onClick={toggleAll}>
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={S.itemList}>
                {items.map(item => {
                  const sel   = selected.has(item.CartItemID);
                  const stock = item.Product.StockQuantity;
                  const productId = item.Product.ProductID;
                  
                  return (
                    <div key={item.CartItemID} style={{ ...S.itemRow, ...(sel ? S.itemRowSel : {}) }}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleOne(item.CartItemID)}
                        style={S.checkbox}
                      />

                      {/* Product image */}
                      <div style={S.itemImgWrap}>
                        <img
                          src={getImageUrl(productId)}
                          alt={item.Product.ProductName}
                          style={S.itemImg}
                          onError={() => handleImageError(productId)}
                        />
                      </div>

                      {/* Product info */}
                      <div style={S.itemInfo}>
                        <Link
                          to={`/product/${productId}`}
                          style={S.itemName}
                        >
                          {item.Product.ProductName}
                        </Link>
                        <p style={S.itemPrice}>₱{Number(item.Product.UnitPrice).toFixed(2)}</p>
                      </div>

                      {/* Quantity control */}
                      <div>
                        <p style={S.qtyLabel}>Quantity:</p>
                        <div className="qty-ctrl">
                          <button
                            className="qty-btn"
                            onClick={() => changeQty(item, -1)}
                          >−</button>
                          <span className="qty-num" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {String(item.ProductQuantity).padStart(2, '0')}
                          </span>
                          <button
                            className="qty-btn"
                            onClick={() => changeQty(item, +1)}
                            disabled={item.ProductQuantity >= stock}
                          >+</button>
                        </div>
                        {item.ProductQuantity >= stock && (
                          <p style={{ fontSize: 11, color: 'var(--status-cancelled)', marginTop: 4 }}>
                            Max stock reached
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        style={S.deleteBtn}
                        onClick={() => remove(item.CartItemID)}
                        title="Remove item"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Summary panel ── */}
            <div style={S.summary}>
              <h3 style={S.summaryTitle}>Total Items:</h3>

              <div style={S.summaryRows}>
                <div style={S.summaryRow}>
                  <span>Selected for Checkout:</span>
                  <span style={{ fontWeight: 600 }}>{selectedItems.length}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border-light)', margin: '8px 0' }} />
                <div style={S.summaryRow}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Total:</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--brown)' }}>
                    ₱{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                className="btn-green"
                onClick={handleCheckout}
                disabled={!selectedItems.length}
                style={{
                  marginTop: 16,
                  opacity: selectedItems.length ? 1 : 0.5,
                  cursor: selectedItems.length ? 'pointer' : 'not-allowed',
                }}
              >
                Checkout Selected Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const S = {
  layout: {
    display: 'flex', gap: 24, alignItems: 'flex-start',
  },

  /* Item list */
  left: {
    flex: 1,
    background: '#fff', borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  listHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-light)',
  },
  selectAllLabel: {
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
  },
  selectAllBtn: {
    background: 'var(--btn-pink)', color: '#fff',
    border: 'none', borderRadius: 6,
    padding: '6px 18px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
  },
  itemList: { padding: '0 20px' },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 0',
    borderBottom: '1px solid var(--border-light)',
    transition: 'background 0.12s',
  },
  itemRowSel: { background: 'var(--cream)' },

  checkbox: {
    width: 17, height: 17, accentColor: 'var(--brown)',
    cursor: 'pointer', flexShrink: 0,
  },

  itemImgWrap: {
    width: 80, height: 80, borderRadius: 8,
    overflow: 'hidden', background: 'var(--cream-dark)',
    flexShrink: 0,
  },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },

  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    display: 'block', fontWeight: 600, fontSize: 14,
    color: 'var(--text-dark)', marginBottom: 6,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  itemPrice: {
    fontSize: 14, fontWeight: 700, color: 'var(--brown)',
  },

  qtyLabel: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 },

  deleteBtn: {
    background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: 6, borderRadius: 6,
    transition: 'color 0.15s, background 0.15s',
    display: 'flex', alignItems: 'center',
    flexShrink: 0,
  },

  /* Summary */
  summary: {
    width: 260, flexShrink: 0,
    background: '#fff', borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
    padding: '20px',
    position: 'sticky', top: 110,
  },
  summaryTitle: {
    fontWeight: 700, fontSize: 15,
    color: 'var(--text-dark)', marginBottom: 16,
  },
  summaryRows: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 14, color: 'var(--text-mid)',
  },
};