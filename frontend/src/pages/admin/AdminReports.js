/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetReports, adminGetOrders } from '../../api';
import '../../styles/variables.css';
import '../../styles/admin.css';

// SVG Icons
const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8.5c-.5-1.5-2-2.5-4-2.5s-3.5 1-4 2.5"/>
    <path d="M8 15.5c.5 1.5 2 2.5 4 2.5s3.5-1 4-2.5"/>
    <line x1="12" y1="6" x2="12" y2="18"/>
  </svg>
);

const ProductsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

/* Simple bar chart drawn in pure CSS/divs */
function BarChart({ data, maxVal }) {
  if (!data.length) return (
    <div className="admin-empty" style={{ padding: '24px 0' }}>
      <span className="empty-icon">📊</span>
      <p>No data in selected range.</p>
    </div>
  );

  return (
    <div style={S.barChart}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        return (
          <div key={i} style={S.barGroup}>
            <div style={S.barWrap}>
              <div style={{ ...S.bar, height: `${pct}%` }} title={`₱${item.value.toFixed(2)}`} />
            </div>
            <span style={S.barLabel}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Group completed orders by day */
function groupByDay(orders, from, to) {
  const map = {};
  orders
    .filter(o => o.OrderStatus === 'Completed')
    .forEach(o => {
      const d = o.OrderDate?.slice(0, 10);
      if (d >= from && d <= to) {
        map[d] = (map[d] || 0) + Number(o.OrderAmount);
      }
    });

  const days = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    days.push({
      label: cur.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      value: map[key] || 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const today    = new Date().toISOString().slice(0, 10);
const weekAgo  = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

export default function AdminReports() {
  const [reportTab,  setReportTab]  = useState('sales');
  const [dateRange,  setDateRange]  = useState('week');
  const [fromDate,   setFromDate]   = useState(weekAgo);
  const [toDate,     setToDate]     = useState(today);
  const [salesData,  setSalesData]  = useState({ totalSales: 0, orderCount: 0 });
  const [products,   setProducts]   = useState([]);
  const [allOrders,  setAllOrders]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      adminGetReports({ type: 'sales', from: fromDate, to: toDate }),
      adminGetReports({ type: 'products' }),
      adminGetOrders(),
    ]).then(([sRes, pRes, oRes]) => {
      setSalesData(sRes.data);
      setProducts(pRes.data);
      setAllOrders(oRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  /* Quick presets */
  const applyPreset = (preset) => {
    setDateRange(preset);
    if (preset === 'today')  { setFromDate(today);    setToDate(today); }
    if (preset === 'week')   { setFromDate(weekAgo);  setToDate(today); }
    if (preset === 'month')  { setFromDate(monthAgo); setToDate(today); }
  };

  /* Chart data */
  const chartData = groupByDay(allOrders, fromDate, toDate);
  const maxVal    = Math.max(...chartData.map(d => d.value), 1);

  /* Additional stats */
  const totalOrders = allOrders.length;
  const cancelled   = allOrders.filter(o => o.OrderStatus === 'Cancelled').length;
  const avgOrder    = salesData.orderCount > 0
    ? (salesData.totalSales / salesData.orderCount).toFixed(2)
    : '0.00';

  /* Product table sort */
  const sortedProducts = [...products].sort((a, b) => b.times_ordered - a.times_ordered);

  return (
    <AdminLayout title="Reports">

      {/* ── Report type tabs ── */}
      <div style={S.tabs}>
        <button
          style={{ ...S.tabBtn, ...(reportTab === 'sales' ? S.tabActive : {}) }}
          onClick={() => setReportTab('sales')}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>₱</span>
          <span>Sales Report</span>
        </button>
        <button
          style={{ ...S.tabBtn, ...(reportTab === 'products' ? S.tabActive : {}) }}
          onClick={() => setReportTab('products')}
        >
          <ProductsIcon />
          <span>Products Report</span>
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : reportTab === 'sales' ? (
        <>
          {/* ── Date range controls with calendar icon ── */}
          <div style={S.filterRow}>
            <div style={S.presets}>
              {['today', 'week', 'month', 'custom'].map(p => (
                <button
                  key={p}
                  style={{ ...S.presetBtn, ...(dateRange === p ? S.presetActive : {}) }}
                  onClick={() => applyPreset(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div style={S.dateInputs}>
              <CalendarIcon />
              <input
                type="date" value={fromDate} max={toDate}
                onChange={e => { setFromDate(e.target.value); setDateRange('custom'); }}
                style={S.dateInput}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
              <input
                type="date" value={toDate} min={fromDate} max={today}
                onChange={e => { setToDate(e.target.value); setDateRange('custom'); }}
                style={S.dateInput}
              />
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="admin-stats-row">
            <div className="admin-stat-card accent-green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                <polyline points="23 6 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              <span className="admin-stat-label">Total Revenue</span>
              <span className="admin-stat-value">
                ₱{Number(salesData.totalSales).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
              </span>
              <span className="admin-stat-sub">Completed orders in range</span>
            </div>
            <div className="admin-stat-card accent-brown">
              <PackageIcon />
              <span className="admin-stat-label">Completed Orders</span>
              <span className="admin-stat-value">{salesData.orderCount}</span>
              <span className="admin-stat-sub">in selected period</span>
            </div>
            <div className="admin-stat-card accent-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="16" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
              <span className="admin-stat-label">Avg. Order Value</span>
              <span className="admin-stat-value">₱{Number(avgOrder).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              <span className="admin-stat-sub">per completed order</span>
            </div>
            <div className="admin-stat-card accent-pink">
              <AlertIcon />
              <span className="admin-stat-label">Cancelled</span>
              <span className="admin-stat-value">{cancelled}</span>
              <span className="admin-stat-sub">of {totalOrders} total orders</span>
            </div>
          </div>

          {/* ── Bar chart ── */}
          <div className="report-card" style={{ marginBottom: 24 }}>
            <p className="report-card-title">Daily Revenue (₱)</p>
            <BarChart data={chartData} maxVal={maxVal} />
          </div>

          {/* ── Completed orders table ── */}
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Completed Orders</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {fromDate} → {toDate}
              </span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders
                    .filter(o =>
                      o.OrderStatus === 'Completed' &&
                      o.OrderDate?.slice(0, 10) >= fromDate &&
                      o.OrderDate?.slice(0, 10) <= toDate
                    )
                    .map(o => (
                      <tr key={o.OrderID}>
                        <td style={{ fontWeight: 700, color: 'var(--brown)' }}>#{o.OrderID}</td>
                        <td>{o.Username || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(o.OrderDate).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                        <td style={{ fontSize: 12 }}>{o.PaymentType}</td>
                        <td style={{ fontWeight: 700 }}>₱{Number(o.OrderAmount).toFixed(2)}</td>
                      </tr>
                    ))}
                  {allOrders.filter(o =>
                    o.OrderStatus === 'Completed' &&
                    o.OrderDate?.slice(0, 10) >= fromDate &&
                    o.OrderDate?.slice(0, 10) <= toDate
                  ).length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="admin-empty" style={{ padding: '28px' }}>
                          <p>No completed orders in this range.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ── Products report with 4 stat cards for symmetry ── */
        <>
          <div className="admin-stats-row">
            <div className="admin-stat-card accent-brown">
              <PackageIcon />
              <span className="admin-stat-label">Total Products</span>
              <span className="admin-stat-value">{products.length}</span>
              <span className="admin-stat-sub">in catalog</span>
            </div>
            <div className="admin-stat-card accent-green">
              <TrendingUpIcon />
              <span className="admin-stat-label">In Stock</span>
              <span className="admin-stat-value">
                {products.filter(p => p.StockQuantity > 0).length}
              </span>
              <span className="admin-stat-sub">products available</span>
            </div>
            <div className="admin-stat-card accent-pink">
              <AlertIcon />
              <span className="admin-stat-label">Out of Stock</span>
              <span className="admin-stat-value">
                {products.filter(p => p.StockQuantity === 0).length}
              </span>
              <span className="admin-stat-sub">need restocking</span>
            </div>
            <div className="admin-stat-card accent-blue">
              <ClockIcon />
              <span className="admin-stat-label">Low Stock</span>
              <span className="admin-stat-value">
                {products.filter(p => p.StockQuantity > 0 && p.StockQuantity <= 5).length}
              </span>
              <span className="admin-stat-sub">items below 6 units</span>
            </div>
          </div>

          <div className="admin-section-card">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Product Inventory & Sales</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Current Stock</th>
                    <th>Times Ordered</th>
                    <th>Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p, i) => (
                    <tr key={p.ProductID}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.ProductName}</td>
                      <td style={{
                        fontWeight: 700,
                        color: p.StockQuantity === 0
                          ? 'var(--status-cancelled)'
                          : p.StockQuantity <= 5
                            ? 'var(--status-pay)'
                            : 'var(--text-dark)',
                      }}>
                        {p.StockQuantity}
                      </td>
                      <td>
                        <div style={S.orderedBar}>
                          <div style={{
                            ...S.orderedFill,
                            width: `${Math.min(100,
                              sortedProducts[0]?.times_ordered > 0
                                ? (p.times_ordered / sortedProducts[0].times_ordered) * 100
                                : 0
                            )}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                          {p.times_ordered}×
                        </span>
                      </td>
                      <td>
                        {p.StockQuantity === 0
                          ? <span className="badge badge-cancelled">Out of Stock</span>
                          : p.StockQuantity <= 5
                            ? <span className="badge badge-topay">Low Stock</span>
                            : <span className="badge badge-active">In Stock</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </AdminLayout>
  );
}

const S = {
  tabs: {
    display: 'flex', gap: 12, marginBottom: 22,
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 24px',
    background: '#fff', border: '1.5px solid var(--border)',
    borderRadius: 8, fontSize: 13, fontWeight: 600,
    color: 'var(--text-mid)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--brown-dark)',
    borderColor: 'var(--brown-dark)',
    color: '#fff',
  },

  /* Date filter */
  filterRow: {
    display: 'flex', alignItems: 'center',
    gap: 16, marginBottom: 20, flexWrap: 'wrap',
  },
  presets: { display: 'flex', gap: 6 },
  presetBtn: {
    padding: '7px 16px',
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 20, fontSize: 12, fontWeight: 600,
    color: 'var(--text-mid)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'all 0.12s',
  },
  presetActive: {
    background: 'var(--brown)', borderColor: 'var(--brown)', color: '#fff',
  },
  dateInputs: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginLeft: 'auto',
  },
  dateInput: {
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 8, padding: '7px 12px',
    fontSize: 13, color: 'var(--text-dark)',
    fontFamily: 'var(--font-body)', outline: 'none',
  },

  /* Bar chart */
  barChart: {
    display: 'flex', alignItems: 'flex-end',
    gap: 6, height: 160, paddingBottom: 28,
    paddingTop: 12, overflowX: 'auto',
  },
  barGroup: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    flex: 1, minWidth: 28, gap: 4, height: '100%', position: 'relative',
  },
  barWrap: {
    flex: 1, width: '100%', display: 'flex',
    alignItems: 'flex-end',
  },
  bar: {
    width: '100%', minHeight: 4,
    background: 'linear-gradient(to top, var(--brown-dark), var(--brown-light))',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.4s ease',
  },
  barLabel: {
    fontSize: 10, color: 'var(--text-muted)',
    textAlign: 'center', whiteSpace: 'nowrap',
    position: 'absolute', bottom: -20, left: '50%',
    transform: 'translateX(-50%)',
  },

  /* Products report */
  orderedBar: {
    width: 80, height: 5, background: 'var(--border)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 3,
  },
  orderedFill: {
    height: '100%',
    background: 'linear-gradient(to right, var(--brown-light), var(--brown))',
    borderRadius: 4,
  },
};