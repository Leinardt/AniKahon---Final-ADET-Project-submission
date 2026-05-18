/* eslint-disable no-dupe-keys */
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrders, cancelOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';

const TABS = [
  { key: 'active',    label: 'Orders'        },
  { key: 'completed', label: 'Completed'     },
  { key: 'refund',    label: 'Return/Refund' },
  { key: 'cancelled', label: 'Cancelled'     },
];

const STATUS_MAP = {
  'To Pay':    { label: 'To Pay',    cls: 'status-topay'     },
  'Confirmed': { label: 'Confirmed', cls: 'status-confirmed'  },
  'Completed': { label: 'Completed', cls: 'status-completed'  },
  'Cancelled': { label: 'Cancelled', cls: 'status-cancelled'  },
};

export default function Orders() {
  const { user }    = useAuth();
  const location    = useLocation();
  const [tab,       setTab]    = useState('active');
  const [orders,    setOrders] = useState([]);
  const [loading,   setLoading] = useState(true);
  const [toast,     setToast]  = useState(
    location.state?.justPlaced ? 'ORDER SUCCESSFULLY PLACED' : ''
  );
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getOrders(user.userID)
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

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

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      load();
      setToast('Order cancelled.');
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot cancel this order.');
    }
  };

  /* Filter by tab */
  const filtered = orders.filter(o => {
    if (tab === 'active')    return ['To Pay', 'Confirmed'].includes(o.OrderStatus);
    if (tab === 'completed') return o.OrderStatus === 'Completed';
    if (tab === 'cancelled') return o.OrderStatus === 'Cancelled';
    if (tab === 'refund')    return false; /* future feature */
    return true;
  });

  const fmt = (dt) => {
    const d = new Date(dt);
    return `${d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const estDelivery = (dt) => {
    const d = new Date(dt);
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        {/* Tab navigation - Clean design, no border, highlight active tab */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
          background: 'var(--cream-dark)',
          padding: '6px',
          borderRadius: '14px',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? 'var(--brown-dark)' : 'var(--text-mid)',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                background: tab === t.key ? '#fff' : 'transparent',
                boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h2 style={S.pageTitle}>Orders</h2>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>No orders here yet.</p>
            <Link to="/catalog" style={{ color: 'var(--brown)', fontWeight: 600, fontSize: 13 }}>
              Start shopping →
            </Link>
          </div>
        ) : (
          <div style={S.orderList}>
            {filtered.map(order => {
              const st = STATUS_MAP[order.OrderStatus] || { label: order.OrderStatus, cls: 'status-topay' };
              const isCOD    = order.PaymentType === 'Cash on Delivery';
              const canCancel = order.OrderStatus === 'To Pay';

              return (
                <div key={order.OrderID} style={S.orderCard}>
                  {/* ── Order items ── */}
                  <div style={S.orderTop}>
                    <div style={S.itemsCol}>
                      {(order.items || []).map(item => {
                        const productId = item.Product_id;
                        return (
                          <div key={item.OrderItemID} style={S.itemRow}>
                            <div style={S.itemImgWrap}>
                              <img
                                src={getImageUrl(productId)}
                                alt={item.ProductName}
                                style={S.itemImg}
                                onError={() => handleImageError(productId)}
                              />
                            </div>
                            <div style={S.itemInfo}>
                              <p style={S.itemName}>{item.ProductName}</p>
                              <p style={S.itemPrice}>₱{Number(item.UnitPrice).toFixed(2)}</p>
                            </div>
                            <div style={S.itemQtyWrap}>
                              <span style={S.itemQtyLabel}>Quantity:</span>
                              <span style={S.itemQtyVal}>
                                {String(item.ProductQuantity).padStart(2, '0')}
                              </span>
                            </div>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                            <span style={S.orderIdBadge}>
                              Order ID: {order.OrderID}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Details panel ── */}
                    <div style={S.detailsPanel}>
                      <p style={S.detailsTitle}>Details:</p>
                      <div style={S.detailRow}>
                        <span>Payment Method:</span>
                        <span style={{ fontWeight: 600, textAlign: 'right' }}>{order.PaymentType}</span>
                      </div>
                      <div style={S.detailRow}>
                        <span>Merchandise Subtotal</span>
                        <span>{Number(order.OrderAmount) - (isCOD ? 30 : 0) + Number(order.DiscountAmount || 0)}</span>
                      </div>
                      <div style={S.detailRow}>
                        <span>{isCOD ? 'Delivery Fee' : 'Fee'}</span>
                        <span>{isCOD ? 30 : 0}</span>
                      </div>
                      {Number(order.DiscountAmount) > 0 && (
                        <div style={{ ...S.detailRow, color: 'var(--status-confirmed)' }}>
                          <span>Discount</span>
                          <span>−₱{Number(order.DiscountAmount).toFixed(2)}</span>
                        </div>
                      )}
                      <div style={S.divider} />
                      <div style={{ ...S.detailRow, fontWeight: 700, fontSize: 15, color: 'var(--brown)' }}>
                        <span>Total:</span>
                        <span>₱{Number(order.OrderAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Order meta (dates + address/pickup) ── */}
                  <div style={S.metaRow}>
                    <div style={S.metaBox}>
                      <div style={S.metaItem}>
                        <span style={S.metaKey}>Order Time:</span>
                        <span style={S.metaVal}>{fmt(order.OrderDate)}</span>
                      </div>
                      {isCOD ? (
                        <div style={S.metaItem}>
                          <span style={S.metaKey}>Estimated Delivery:</span>
                          <span style={S.metaVal}>{estDelivery(order.OrderDate)}</span>
                        </div>
                      ) : (
                        <div style={S.metaItem}>
                          <span style={S.metaKey}>Pickup Date:</span>
                          <span style={S.metaVal}>{order.PickupDate || '—'}</span>
                        </div>
                      )}
                    </div>

                    <div style={S.metaBox}>
                      {isCOD ? (
                        <>
                          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                            {order.Username}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                            {order.DeliveryAddress || '—'}
                          </p>
                        </>
                      ) : (
                        <>
                          <div style={S.metaItem}>
                            <span style={S.metaKey}>Pickup Location:</span>
                            <span style={S.metaVal}>{order.PickupLocation || '—'}</span>
                          </div>
                          <div style={S.metaItem}>
                            <span style={S.metaKey}>Pickup Time Slot:</span>
                            <span style={S.metaVal}>{order.PickupTimeSlot || '—'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  {canCancel && (
                    <div style={S.actions}>
                      <button
                        className="btn-pink"
                        style={{ width: 'auto', padding: '9px 28px' }}
                        onClick={() => handleCancel(order.OrderID)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="success-toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

const S = {
  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
    color: 'var(--text-dark)', marginBottom: 20,
  },
  orderList: { display: 'flex', flexDirection: 'column', gap: 20 },
  orderCard: {
    background: '#fff', borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },

  orderTop: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid var(--border-light)',
  },

  itemsCol: { flex: 1, padding: '16px 20px' },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 0',
    borderBottom: '1px solid var(--border-light)',
    flexWrap: 'wrap',
  },
  itemImgWrap: {
    width: 64, height: 64, borderRadius: 8,
    overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0,
  },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemInfo: { flex: 1, minWidth: 120 },
  itemName: { fontWeight: 600, fontSize: 14, color: 'var(--text-dark)', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: 700, color: 'var(--brown)' },
  itemQtyWrap: { textAlign: 'right', flexShrink: 0 },
  itemQtyLabel: { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 },
  itemQtyVal: {
    display: 'inline-block',
    border: '1px solid var(--border)', borderRadius: 4,
    padding: '3px 12px', fontSize: 12, fontWeight: 600,
  },
  orderIdBadge: {
    fontSize: 11, color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },

  /* Details panel */
  detailsPanel: {
    width: 220, flexShrink: 0,
    padding: '16px 18px',
    background: 'var(--cream)', borderLeft: '1px solid var(--border-light)',
  },
  detailsTitle: { fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-dark)' },
  detailRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 12, color: 'var(--text-mid)', marginBottom: 6,
  },
  divider: { height: 1, background: 'var(--border-light)', margin: '8px 0' },

  /* Meta row */
  metaRow: {
    display: 'flex', gap: 0,
    padding: '14px 20px',
    background: 'var(--cream-dark)',
    flexWrap: 'wrap', gap: 16,
  },
  metaBox: {
    flex: 1, minWidth: 180,
    background: '#fff', borderRadius: 8,
    padding: '10px 14px',
    border: '1px solid var(--border-light)',
  },
  metaItem: {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4,
  },
  metaKey: { fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 },
  metaVal: { fontSize: 12, fontWeight: 600, color: 'var(--text-dark)' },

  /* Actions */
  actions: { padding: '14px 20px', borderTop: '1px solid var(--border-light)' },
};