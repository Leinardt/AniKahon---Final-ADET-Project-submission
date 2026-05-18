import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOrders, adminUpdateOrder } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/variables.css';
import '../../styles/admin.css';

const STATUS_TABS = ['All', 'To Pay', 'Confirmed', 'Completed', 'Cancelled'];

const STATUS_BADGE = {
  'To Pay':    <span className="badge badge-topay">To Pay</span>,
  'Confirmed': <span className="badge badge-confirmed">Confirmed</span>,
  'Completed': <span className="badge badge-completed">Completed</span>,
  'Cancelled': <span className="badge badge-cancelled">Cancelled</span>,
};

const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

export default function AdminOrders() {
  const { admin } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('All');
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetOrders()
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Get image URL based on product ID */
  const getImageUrl = (productId) => {
    if (!productId) return '/images/products/placeholder.jpg';
    if (imageErrors[productId]) {
      return '/images/products/placeholder.jpg';
    }
    return `/images/products/product-${productId}-1.jpg`;
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  /* Filter */
  const filtered = orders.filter(o => {
    const matchTab = tab === 'All' || o.OrderStatus === tab;
    const q = search.toLowerCase();
    const matchSearch = !q
      || String(o.OrderID).includes(q)
      || (o.Username || '').toLowerCase().includes(q)
      || o.PaymentType.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrder(orderId, { adminID: admin.adminID, status: newStatus });
      showToast(`Order #${orderId} → ${newStatus}`);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed.', 'error');
    }
  };

  return (
    <AdminLayout title="Orders">

      {/* ── Filter bar ── */}
      <div style={S.tabBar}>
        {STATUS_TABS.map(t => (
          <button
            key={t}
            style={{ ...S.tabBtn, ...(tab === t ? S.tabBtnActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t}
            <span style={S.tabCount}>
              {t === 'All'
                ? orders.length
                : orders.filter(o => o.OrderStatus === t).length}
            </span>
          </button>
        ))}
      </div>

      <div className="admin-section-card">
        {/* Search */}
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <SearchIcon />
            <input
              placeholder="Search by order ID, customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <span className="empty-icon">📦</span>
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <React.Fragment key={o.OrderID}>
                    {/* Main row */}
                    <tr>
                      <td>
                        <button
                          style={S.expandBtn}
                          onClick={() => setExpanded(expanded === o.OrderID ? null : o.OrderID)}
                        >
                          {expanded === o.OrderID ? '▾' : '▸'}&nbsp;
                          <span style={{ fontWeight: 700, color: 'var(--brown)' }}>#{o.OrderID}</span>
                        </button>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{o.Username || '—'}</span>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {o.PaymentType === 'Cash on Delivery'
                            ? o.DeliveryAddress?.slice(0, 30) + '…'
                            : o.PickupLocation || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(o.OrderDate)}</td>
                      <td>
                        <span style={S.payBadge}>
                          {o.PaymentType === 'Cash on Delivery' ? 'COD' : 'Pickup'}
                        </span>
                       </td>
                      <td style={{ fontWeight: 700 }}>₱{Number(o.OrderAmount).toFixed(2)}</td>
                      <td>{STATUS_BADGE[o.OrderStatus] || o.OrderStatus}</td>
                      <td>
                        <div style={S.actionBtns}>
                          {o.OrderStatus === 'To Pay' && (
                            <button
                              className="admin-btn admin-btn-green admin-btn-sm"
                              onClick={() => handleStatus(o.OrderID, 'Confirmed')}
                            >
                              Confirm
                            </button>
                          )}
                          {o.OrderStatus === 'Confirmed' && (
                            <button
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleStatus(o.OrderID, 'Completed')}
                            >
                              Complete
                            </button>
                          )}
                          {['To Pay', 'Confirmed'].includes(o.OrderStatus) && (
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => {
                                if (window.confirm(`Cancel order #${o.OrderID}?`))
                                  handleStatus(o.OrderID, 'Cancelled');
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                       </td>
                    </tr>

                    {/* Expanded order items */}
                    {expanded === o.OrderID && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={S.expandPanel}>
                            <div style={S.expandInner}>
                              <p style={S.expandTitle}>Order Items</p>
                              <div style={S.itemList}>
                                {(o.items || []).map(item => {
                                  const productId = item.Product_id;
                                  return (
                                    <div key={item.OrderItemID} style={S.itemRow}>
                                      <img
                                        src={getImageUrl(productId)}
                                        alt={item.ProductName}
                                        style={S.itemImg}
                                        onError={() => handleImageError(productId)}
                                      />
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: 13 }}>{item.ProductName}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                          Qty: {item.ProductQuantity} × ₱{Number(item.UnitPrice).toFixed(2)}
                                        </p>
                                      </div>
                                      <p style={{ fontWeight: 700, fontSize: 13 }}>
                                        ₱{(item.ProductQuantity * Number(item.UnitPrice)).toFixed(2)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Summary */}
                              <div style={S.expandSummary}>
                                <div style={S.summaryRow}>
                                  <span>Payment Method:</span>
                                  <span style={{ fontWeight: 600 }}>{o.PaymentType}</span>
                                </div>
                                {Number(o.DiscountAmount) > 0 && (
                                  <div style={{ ...S.summaryRow, color: 'var(--status-confirmed)' }}>
                                    <span>Discount:</span>
                                    <span>−₱{Number(o.DiscountAmount).toFixed(2)}</span>
                                  </div>
                                )}
                                <div style={{ ...S.summaryRow, fontWeight: 700, fontSize: 14 }}>
                                  <span>Order Total:</span>
                                  <span style={{ color: 'var(--brown)' }}>
                                    ₱{Number(o.OrderAmount).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const S = {
  tabBar: {
    display: 'flex', gap: 4,
    marginBottom: 18,
    overflowX: 'auto',
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 18px',
    background: '#fff', border: '1.5px solid var(--border)',
    borderRadius: 8, fontSize: 13, fontWeight: 600,
    color: 'var(--text-mid)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'background 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    background: 'var(--brown-dark)',
    borderColor: 'var(--brown-dark)',
    color: '#fff',
  },
  tabCount: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: '1px 7px',
    fontSize: 11, fontWeight: 700,
  },
  expandBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 13,
    color: 'var(--text-mid)', fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center',
  },
  payBadge: {
    background: 'var(--cream-dark)',
    borderRadius: 6, padding: '3px 10px',
    fontSize: 12, fontWeight: 600,
    color: 'var(--text-mid)',
  },
  actionBtns: {
    display: 'flex', gap: 6, justifyContent: 'center',
  },

  /* Expanded panel */
  expandPanel: {
    background: '#F9F5EF',
    borderTop: '1px solid var(--border-light)',
    borderBottom: '1px solid var(--border-light)',
  },
  expandInner: {
    padding: '16px 24px 20px',
    maxWidth: 560,
  },
  expandTitle: {
    fontSize: 12, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: 12,
  },
  itemList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', borderRadius: 8, padding: '10px 14px',
    border: '1px solid var(--border-light)',
  },
  itemImg: {
    width: 44, height: 44, borderRadius: 6,
    objectFit: 'cover', background: 'var(--cream-dark)', flexShrink: 0,
  },
  expandSummary: {
    display: 'flex', flexDirection: 'column', gap: 8,
    background: '#fff', borderRadius: 8, padding: '12px 14px',
    border: '1px solid var(--border-light)',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: 'var(--text-mid)',
  },
};