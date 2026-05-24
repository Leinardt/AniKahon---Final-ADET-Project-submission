import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetOrders,
  adminGetProducts,
  adminGetVouchers,
  adminGetReports,
  adminUpdateOrder,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/variables.css';
import '../../styles/admin.css';

/* ─────────────────────────────────────────
   Utilities
───────────────────────────────────────── */
const fmtDate = (dt) =>
  new Date(dt).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

const fmtTime = (dt) =>
  new Date(dt).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit',
  });

const fmtPeso = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

const todayStr = new Date().toISOString().slice(0, 10);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function buildLineData(orders, days) {
  const map = {};
  orders
    .filter(o => o.OrderStatus === 'Completed')
    .forEach(o => {
      const d = (o.OrderDate || '').slice(0, 10);
      map[d] = (map[d] || 0) + Number(o.OrderAmount);
    });
  return days.map(d => ({ date: d, value: map[d] || 0 }));
}

/* ─────────────────────────────────────────
   SVG Line Graph — pure SVG, no lib
   Change 2: replaces the bar chart
───────────────────────────────────────── */
function LineGraph({ data }) {
  const W = 560; const H = 120; const PAD = { t: 12, r: 12, b: 28, l: 48 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const max = Math.max(...data.map(d => d.value), 1);

  const toX = (i) => PAD.l + (i / (data.length - 1)) * iW;
  const toY = (v) => PAD.t + iH - (v / max) * iH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const areaPath =
    `M ${toX(0)},${PAD.t + iH} ` +
    data.map((d, i) => `L ${toX(i)},${toY(d.value)}`).join(' ') +
    ` L ${toX(data.length - 1)},${PAD.t + iH} Z`;

  /* Y-axis ticks */
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: max * f,
    y:   PAD.t + iH - f * iH,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#A07850" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#A07850" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y}
            stroke="var(--border-light)" strokeWidth="1"
            strokeDasharray={i === 0 ? '' : '3 3'}
          />
          <text
            x={PAD.l - 6} y={t.y + 4}
            textAnchor="end" fontSize="8"
            fill="var(--text-muted)"
            fontFamily="'DM Sans',sans-serif"
          >
            {t.val === 0 ? '0' : t.val >= 1000 ? `${(t.val / 1000).toFixed(1)}k` : Math.round(t.val)}
          </text>
        </g>
      ))}

      {/* Filled area */}
      <path d={areaPath} fill="url(#lineAreaGrad)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--brown)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points + labels */}
      {data.map((d, i) => {
        const x = toX(i); const y = toY(d.value);
        const isToday = d.date === todayStr;
        return (
          <g key={i}>
            {/* X-axis label */}
            <text
              x={x} y={H - 4}
              textAnchor="middle"
              fontSize="8"
              fill={isToday ? 'var(--brown-dark)' : 'var(--text-muted)'}
              fontWeight={isToday ? 700 : 400}
              fontFamily="'DM Sans',sans-serif"
            >
              {new Date(d.date + 'T12:00:00').toLocaleDateString('en-PH', {
                month: 'short', day: 'numeric',
              })}
            </text>
            {/* Dot */}
            <circle
              cx={x} cy={y} r={isToday ? 5 : 3.5}
              fill={isToday ? 'var(--brown-dark)' : '#fff'}
              stroke="var(--brown)"
              strokeWidth={isToday ? 0 : 2}
            />
            {/* Value label on hover — always visible if non-zero */}
            {d.value > 0 && (
              <text
                x={x} y={y - 8}
                textAnchor="middle"
                fontSize="7.5"
                fill="var(--brown-dark)"
                fontWeight="700"
                fontFamily="'DM Sans',sans-serif"
              >
                {fmtPeso(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Order Summary Donut
   Change 3: renamed + on-brand palette
   To Pay    → brown-pale / brown
   Confirmed → btn-green tint / green
   Completed → cream-dark / brown-dark
   Cancelled → btn-pink tint / pink
───────────────────────────────────────── */
const DONUT_COLORS = {
  'To Pay':    '#A07850',   /* brand brown       */
  'Confirmed': '#9DC08B',   /* btn-green         */
  'Completed': '#7A5C34',   /* brown-dark        */
  'Cancelled': '#C87070',   /* btn-pink          */
};

function OrderSummaryDonut({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 50; const cx = 64; const cy = 64;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circ;
    const arc  = { ...seg, dash, gap: circ - dash, start: offset };
    offset += dash;
    return arc;
  });

  return (
    <svg viewBox="0 0 128 128" width={128} height={128}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="#EDE6DA" strokeWidth="16" />
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth="16"
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.start}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      {/* Centre total */}
      <text x={cx} y={cy - 7} textAnchor="middle"
        fontSize="20" fontWeight="700"
        fill="#2C2218"
        fontFamily="'Playfair Display',serif">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fontSize="8" fontWeight="600" letterSpacing="0.8"
        fill="#B8A898"
        fontFamily="'DM Sans',sans-serif">
        ORDERS
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Mini bar (voucher usage, top products)
───────────────────────────────────────── */
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ width: 72, height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   SVG icons
   Change 1: revenue → peso text; others → SVG
───────────────────────────────────────── */
/* Revenue: bold ₱ rendered as SVG text so it
   scales correctly inside the StatIcon box    */
const PesoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <text x="12" y="18" textAnchor="middle"
      fontSize="20" fontWeight="800"
      fontFamily="'DM Sans',sans-serif">
      ₱
    </text>
  </svg>
);

/* Total orders — clipboard-check */
const OrdersIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

/* Pending — clock */
const PendingIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

/* Products — box / package */
const ProductsIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

/* ─────────────────────────────────────────
   Stat card icon wrapper
───────────────────────────────────────── */
function StatIcon({ bg, color, children }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Status badge map
───────────────────────────────────────── */
const STATUS_BADGE = {
  'To Pay':    <span className="badge badge-topay">To Pay</span>,
  'Confirmed': <span className="badge badge-confirmed">Confirmed</span>,
  'Completed': <span className="badge badge-completed">Completed</span>,
  'Cancelled': <span className="badge badge-cancelled">Cancelled</span>,
};

/* ═════════════════════════════════════════
   Main component
═════════════════════════════════════════ */
export default function AdminDashboard() {
  const { admin }  = useAuth();
  const navigate   = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [orders,   setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [report,   setReport]   = useState({ totalSales: 0, orderCount: 0 });
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminGetOrders(),
      adminGetProducts(),
      adminGetVouchers(),
      adminGetReports({ type: 'sales' }),
    ])
      .then(([oRes, pRes, vRes, rRes]) => {
        setOrders(oRes.data   || []);
        setProducts(pRes.data || []);
        setVouchers(vRes.data || []);
        setReport(rRes.data   || { totalSales: 0, orderCount: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Derived ── */
  const pending   = orders.filter(o => o.OrderStatus === 'To Pay');
  const confirmed = orders.filter(o => o.OrderStatus === 'Confirmed');
  const completed = orders.filter(o => o.OrderStatus === 'Completed');
  const cancelled = orders.filter(o => o.OrderStatus === 'Cancelled');

  const outOfStock = products.filter(p => p.StockQuantity === 0);
  const lowStock   = products.filter(p => p.StockQuantity > 0 && p.StockQuantity <= 5);

  const thisMonth  = new Date().toISOString().slice(0, 7);
  const monthlyRev = completed
    .filter(o => (o.OrderDate || '').slice(0, 7) === thisMonth)
    .reduce((s, o) => s + Number(o.OrderAmount), 0);

  const todayOrders = orders.filter(o => (o.OrderDate || '').slice(0, 10) === todayStr);

  const activeVouchers  = vouchers.filter(v => v.IsActive && v.EndDate >= todayStr);
  const expiredVouchers = vouchers.filter(v => !v.IsActive || v.EndDate < todayStr);

  /* Line graph data */
  const DAYS_7    = lastNDays(7);
  const lineData  = buildLineData(orders, DAYS_7);

  /* Recent orders (moved up — Change 5) */
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.OrderDate) - new Date(a.OrderDate))
    .slice(0, 6);

  /* Top products from order items */
  const productMap = {};
  orders.forEach(o =>
    (o.items || []).forEach(item => {
      const key = item.ProductName || `#${item.Product_id}`;
      productMap[key] = (productMap[key] || 0) + (item.ProductQuantity || 0);
    })
  );
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));
  const topMax = topProducts[0]?.qty || 1;

  /* Order Summary donut — Change 3 */
  const donutSegs = [
    { label: 'To Pay',    value: pending.length,   color: DONUT_COLORS['To Pay']    },
    { label: 'Confirmed', value: confirmed.length,  color: DONUT_COLORS['Confirmed'] },
    { label: 'Completed', value: completed.length,  color: DONUT_COLORS['Completed'] },
    { label: 'Cancelled', value: cancelled.length,  color: DONUT_COLORS['Cancelled'] },
  ];

  /* Pending queue inline action */
  const handleQuickStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrder(orderId, { adminID: admin?.adminID, status: newStatus });
      showToast(`Order #${orderId} → ${newStatus}`);
      load();
    } catch {
      showToast('Update failed.', 'error');
    }
  };

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div className="spinner-wrap" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Dashboard">

      {/* ══════════════════════════════════════
          GREETING BANNER
      ══════════════════════════════════════ */}
      <div style={S.greetBanner}>
        <div style={S.greetBannerBg} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={S.greetTitle}>
            Good {getGreeting()}, {admin?.username || 'Admin'} ⸜(｡˃ ᵕ ˂ )⸝♡
          </h2>
          <p style={S.greetSub}>
            Check AniKahon's stats now!
            {todayOrders.length > 0 && (
              <> — <strong style={{ color: 'var(--brown-light)' }}>
                {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} placed today
              </strong></>
            )}.
          </p>
        </div>
        <div style={S.greetRight}>
          <span style={S.greetDateLarge}>
            {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}
          </span>
          <span style={S.greetDateSmall}>
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 1 — KPI STAT CARDS
          Change 1: peso icon for revenue, SVG for others
          Change 6: each card is a clickable button → navigate
      ══════════════════════════════════════ */}
      <div style={S.kpiGrid}>

        {/* Revenue → /admin/reports */}
        <button
          className="admin-stat-card accent-green"
          style={S.kpiCard}
          onClick={() => navigate('/admin/reports')}
          title="View Reports"
        >
          <StatIcon bg="#E8F5E9" color="#6BAE75"><PesoIcon /></StatIcon>
          <div style={S.kpiText}>
            <span className="admin-stat-label">All-Time Revenue</span>
            <div style={S.kpiValue}>{fmtPeso(report.totalSales)}</div>
            <span className="admin-stat-sub">{fmtPeso(monthlyRev)} this month</span>
          </div>
          <span style={S.kpiArrow}>→</span>
        </button>

        {/* Total Orders → /admin/orders */}
        <button
          className="admin-stat-card accent-brown"
          style={S.kpiCard}
          onClick={() => navigate('/admin/orders')}
          title="View All Orders"
        >
          <StatIcon bg="#F0E8DC" color="#A07850"><OrdersIcon /></StatIcon>
          <div style={S.kpiText}>
            <span className="admin-stat-label">Total Orders</span>
            <div style={S.kpiValue}>{orders.length}</div>
            <span className="admin-stat-sub">{todayOrders.length} placed today</span>
          </div>
          <span style={S.kpiArrow}>→</span>
        </button>

        {/* Needs Attention → /admin/orders (filtered to pending) */}
        <button
          className="admin-stat-card accent-pink"
          style={S.kpiCard}
          onClick={() => navigate('/admin/orders')}
          title="View Pending Orders"
        >
          <StatIcon bg="#FDECEA" color="#C87070"><PendingIcon /></StatIcon>
          <div style={S.kpiText}>
            <span className="admin-stat-label">Needs Attention</span>
            <div style={S.kpiValue}>{pending.length}</div>
            <span className="admin-stat-sub">pending · {confirmed.length} confirmed</span>
          </div>
          <span style={S.kpiArrow}>→</span>
        </button>

        {/* Products → /admin/products */}
        <button
          className="admin-stat-card accent-blue"
          style={S.kpiCard}
          onClick={() => navigate('/admin/products')}
          title="Manage Products"
        >
          <StatIcon bg="#E3F0FB" color="#5A8EBF"><ProductsIcon /></StatIcon>
          <div style={S.kpiText}>
            <span className="admin-stat-label">Products</span>
            <div style={S.kpiValue}>{products.length}</div>
            <span className="admin-stat-sub">
              {outOfStock.length} out · {lowStock.length} low stock
            </span>
          </div>
          <span style={S.kpiArrow}>→</span>
        </button>

      </div>

      {/* ══════════════════════════════════════
          ROW 2 — LINE GRAPH  +  ORDER SUMMARY
          Change 2: bar → line graph
          Change 3: "Order Summary", brand palette
      ══════════════════════════════════════ */}
      <div style={{ ...S.row, marginBottom: 22 }}>

        {/* 7-day revenue line graph */}
        <div className="admin-section-card" style={{ flex: 1 }}>
          <div className="admin-section-header">
            <h2 className="admin-section-title">Revenue — Last 7 Days</h2>
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => navigate('/admin/reports')}
            >
              Full Report →
            </button>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            {/* Summary numbers */}
            <div style={S.chartSummaryRow}>
              <div style={S.chartSummaryItem}>
                <span style={S.chartBigNum}>{fmtPeso(report.totalSales)}</span>
                <span style={S.chartBigLabel}>total completed revenue</span>
              </div>
              <div style={S.chartSummaryDivider} />
              <div style={S.chartSummaryItem}>
                <span style={{ ...S.chartBigNum, fontSize: 20 }}>{fmtPeso(monthlyRev)}</span>
                <span style={S.chartBigLabel}>this month</span>
              </div>
              <div style={S.chartSummaryDivider} />
              <div style={S.chartSummaryItem}>
                <span style={{ ...S.chartBigNum, fontSize: 20 }}>{report.orderCount}</span>
                <span style={S.chartBigLabel}>completed orders</span>
              </div>
            </div>
            {/* Line graph */}
            <div style={{ marginTop: 20 }}>
              <LineGraph data={lineData} />
            </div>
          </div>
        </div>

        {/* Order Summary donut */}
        <div className="admin-section-card" style={{ width: 272, flexShrink: 0 }}>
          <div className="admin-section-header">
            {/* Change 3: renamed */}
            <h2 className="admin-section-title">Order Summary</h2>
          </div>
          <div style={S.donutBody}>
            <OrderSummaryDonut segments={donutSegs} />
            <div style={S.donutLegend}>
              {donutSegs.map(seg => (
                <div key={seg.label} style={S.legendRow}>
                  <span style={{ ...S.legendDot, background: seg.color }} />
                  <span style={S.legendLabel}>{seg.label}</span>
                  <span style={S.legendCount}>{seg.value}</span>
                  <span style={S.legendPct}>
                    {orders.length > 0
                      ? Math.round((seg.value / orders.length) * 100)
                      : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════
          ROW 3 — RECENT ORDERS  +  TOP PRODUCTS
          Change 5: moved up from Row 4 to Row 3
      ══════════════════════════════════════ */}
      <div style={{ ...S.row, marginBottom: 22 }}>

        {/* Recent orders */}
        <div className="admin-section-card" style={{ flex: 1 }}>
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Orders</h2>
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => navigate('/admin/orders')}
            >
              View All →
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  {/* Change 5: payment text only, no emoji */}
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty"><p>No orders yet.</p></div>
                    </td>
                  </tr>
                ) : recentOrders.map(o => (
                  <tr
                    key={o.OrderID}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/admin/orders')}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--brown)' }}>#{o.OrderID}</td>
                    <td style={{ fontWeight: 500 }}>{o.Username || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {fmtDate(o.OrderDate)}<br />
                      <span style={{ fontSize: 11 }}>{fmtTime(o.OrderDate)}</span>
                    </td>
                    {/* Change 5: plain text, no emoji */}
                    <td style={{ fontSize: 12 }}>
                      {o.PaymentType === 'Cash on Delivery' ? 'Cash on Delivery' : 'Cash on Pickup'}
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmtPeso(o.OrderAmount)}</td>
                    <td>{STATUS_BADGE[o.OrderStatus] || o.OrderStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products */}
        <div className="admin-section-card" style={{ width: 272, flexShrink: 0 }}>
          <div className="admin-section-header">
            <h2 className="admin-section-title">Top Products</h2>
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => navigate('/admin/reports')}
            >
              Report →
            </button>
          </div>
          <div style={{ padding: '6px 0' }}>
            {topProducts.length === 0 ? (
              <div className="admin-empty" style={{ padding: '36px 20px' }}>
                <span className="empty-icon">📦</span>
                <p>No order data yet.</p>
              </div>
            ) : topProducts.map((p, i) => (
              <div key={p.name} style={S.topRow}>
                <div style={{
                  ...S.rankBadge,
                  background: i === 0 ? 'var(--brown)'
                              : i === 1 ? 'var(--brown-light)'
                              : 'var(--cream-dark)',
                  color: i < 2 ? '#fff' : 'var(--text-muted)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={S.topName}>{p.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <MiniBar value={p.qty} max={topMax} color="var(--brown)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.qty} unit{p.qty !== 1 ? 's' : ''} sold
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════
          ROW 4 — PENDING QUEUE  +  SIDE PANELS
          Change 4: heading has no emoji
      ══════════════════════════════════════ */}
      <div style={{ ...S.row, marginBottom: 22 }}>

        {/* Pending orders — actionable table */}
        <div className="admin-section-card" style={{ flex: 1 }}>
          <div className="admin-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Change 4: no emoji */}
              <h2 className="admin-section-title">Pending Orders</h2>
              {pending.length > 0 && (
                <span style={S.urgentPill}>{pending.length} need action</span>
              )}
            </div>
            <button
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() => navigate('/admin/orders')}
            >
              All Orders →
            </button>
          </div>

          {pending.length === 0 ? (
            <div className="admin-empty" style={{ padding: '36px 20px' }}>
              <span className="empty-icon">✅</span>
              <p>No pending orders — you're all caught up!</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Total</th>
                    <th>Time</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 7).map(o => (
                    <tr key={o.OrderID}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--brown)' }}>
                          #{o.OrderID}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.Username || '—'}</td>
                      <td>
                        <span style={S.payChip}>
                          {o.PaymentType === 'Cash on Delivery'
                            ? 'Cash on Delivery'
                            : 'Cash on Pickup'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmtPeso(o.OrderAmount)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtDate(o.OrderDate)}<br />
                        <span style={{ fontSize: 11 }}>{fmtTime(o.OrderDate)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                          <button
                            className="admin-btn admin-btn-green admin-btn-sm"
                            onClick={() => handleQuickStatus(o.OrderID, 'Confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => {
                              if (window.confirm(`Cancel order #${o.OrderID}?`))
                                handleQuickStatus(o.OrderID, 'Cancelled');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pending.length > 7 && (
                <div style={S.showMoreRow}>
                  <button
                    style={S.showMoreBtn}
                    onClick={() => navigate('/admin/orders')}
                  >
                    View {pending.length - 7} more pending orders →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — stock alerts + vouchers */}
        <div style={{ width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stock alerts */}
          <div className="admin-section-card">
            <div className="admin-section-header" style={{ padding: '14px 16px' }}>
              <h2 className="admin-section-title" style={{ fontSize: 14 }}>Stock Alerts</h2>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => navigate('/admin/products')}
              >
                Manage
              </button>
            </div>

            {outOfStock.length === 0 && lowStock.length === 0 ? (
              <div className="admin-empty" style={{ padding: '24px 16px' }}>
                <span className="empty-icon" style={{ fontSize: 28 }}>✅</span>
                <p style={{ fontSize: 12 }}>All products well-stocked!</p>
              </div>
            ) : (
              <>
                {outOfStock.length > 0 && (
                  <div style={S.stockSection}>
                    <p style={{ ...S.stockGroupLabel, color: 'var(--status-cancelled)' }}>
                      Out of Stock — {outOfStock.length}
                    </p>
                    {outOfStock.slice(0, 4).map(p => (
                      <div key={p.ProductID} style={S.stockItem}>
                        <span style={S.stockItemName}>{p.ProductName}</span>
                        <span style={{ ...S.stockItemQty, color: 'var(--status-cancelled)' }}>
                          0 units
                        </span>
                      </div>
                    ))}
                    {outOfStock.length > 4 && (
                      <p style={S.stockMore}>+{outOfStock.length - 4} more</p>
                    )}
                  </div>
                )}
                {lowStock.length > 0 && (
                  <div style={{
                    ...S.stockSection,
                    borderTop: outOfStock.length > 0 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <p style={{ ...S.stockGroupLabel, color: 'var(--status-pay)' }}>
                      Low Stock — {lowStock.length}
                    </p>
                    {lowStock.slice(0, 4).map(p => (
                      <div key={p.ProductID} style={S.stockItem}>
                        <span style={S.stockItemName}>{p.ProductName}</span>
                        <span style={{ ...S.stockItemQty, color: 'var(--status-pay)' }}>
                          {p.StockQuantity} left
                        </span>
                      </div>
                    ))}
                    {lowStock.length > 4 && (
                      <p style={S.stockMore}>+{lowStock.length - 4} more</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Voucher summary */}
          <div className="admin-section-card">
            <div className="admin-section-header" style={{ padding: '14px 16px' }}>
              <h2 className="admin-section-title" style={{ fontSize: 14 }}>Vouchers</h2>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => navigate('/admin/vouchers')}
              >
                Manage
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={S.voucherStats}>
                <div style={S.voucherStatItem}>
                  <span style={{ ...S.voucherStatNum, color: 'var(--status-confirmed)' }}>
                    {activeVouchers.length}
                  </span>
                  <span style={S.voucherStatLabel}>Active</span>
                </div>
                <div style={S.voucherStatDivider} />
                <div style={S.voucherStatItem}>
                  <span style={{ ...S.voucherStatNum, color: 'var(--text-muted)' }}>
                    {expiredVouchers.length}
                  </span>
                  <span style={S.voucherStatLabel}>Inactive</span>
                </div>
                <div style={S.voucherStatDivider} />
                <div style={S.voucherStatItem}>
                  <span style={{ ...S.voucherStatNum, color: 'var(--text-dark)' }}>
                    {vouchers.length}
                  </span>
                  <span style={S.voucherStatLabel}>Total</span>
                </div>
              </div>
              {activeVouchers.slice(0, 3).map(v => (
                <div key={v.VoucherID} style={S.voucherChip}>
                  <span style={S.voucherCode}>{v.VoucherCode}</span>
                  <span style={S.voucherAmt}>
                    {v.DiscountType === 'percentage'
                      ? `${v.DiscountValue}% off`
                      : `₱${Number(v.DiscountValue).toFixed(0)} off`}
                  </span>
                  <MiniBar value={v.UsedCount} max={v.UsageLimit} color="var(--btn-green)" />
                </div>
              ))}
              {activeVouchers.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No active vouchers.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════
          TOAST
      ══════════════════════════════════════ */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

    </AdminLayout>
  );
}

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const S = {

  /* ── Greeting banner ── */
  greetBanner: {
    position: 'relative',
    background: 'linear-gradient(135deg, #2C200F 0%, #5C3D1E 60%, #7A5234 100%)',
    borderRadius: 14, padding: '22px 28px',
    marginBottom: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  greetBannerBg: {
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(ellipse at 80% 50%, rgba(200,164,122,0.10) 0%, transparent 60%)`,
  },
  greetTitle: {
    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
    color: '#fff', marginBottom: 6,
  },
  greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5 },
  greetRight: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3,
  },
  greetDateLarge: {
    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
    color: 'var(--brown-light)',
  },
  greetDateSmall: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },

  /* ── KPI cards ── */
  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: 16, marginBottom: 22,
  },
  /* Each card is a <button> — override browser defaults */
  kpiCard: {
    /* admin-stat-card already sets most layout;
       we add row direction, pointer cursor, and
       a subtle hover via CSS class hover rule  */
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: '18px 18px',
    cursor: 'pointer',
    textAlign: 'left',
    /* reset button defaults */
    appearance: 'none', fontFamily: 'var(--font-body)',
    width: '100%',
    /* keep the card look */
    background: '#fff',
    border: 'none',
    position: 'relative',
  },
  kpiText:  { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  kpiValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 24, fontWeight: 700,
    color: 'var(--text-dark)', lineHeight: 1,
  },
  kpiArrow: {
    position: 'absolute', top: 14, right: 14,
    fontSize: 14, color: 'var(--text-muted)',
    fontWeight: 600, opacity: 0.6,
  },

  /* ── Shared two-col row ── */
  row: { display: 'flex', gap: 18, alignItems: 'flex-start' },

  /* ── Revenue chart summary row ── */
  chartSummaryRow: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'var(--cream)', borderRadius: 10,
    border: '1px solid var(--border-light)',
    overflow: 'hidden',
  },
  chartSummaryItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 3, padding: '12px 16px',
  },
  chartSummaryDivider: {
    width: 1, alignSelf: 'stretch',
    background: 'var(--border-light)',
  },
  chartBigNum: {
    fontFamily: 'var(--font-display)',
    fontSize: 22, fontWeight: 700,
    color: 'var(--text-dark)',
  },
  chartBigLabel: {
    fontSize: 11, color: 'var(--text-muted)',
  },

  /* ── Order Summary donut ── */
  donutBody: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '18px 16px', gap: 14,
  },
  donutLegend: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8 },
  legendRow:   { display: 'flex', alignItems: 'center', gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: 12, color: 'var(--text-mid)' },
  legendCount: {
    fontSize: 12, fontWeight: 700,
    color: 'var(--text-dark)', minWidth: 20, textAlign: 'right',
  },
  legendPct: {
    fontSize: 11, color: 'var(--text-muted)',
    minWidth: 32, textAlign: 'right',
  },

  /* ── Pending queue ── */
  urgentPill: {
    fontSize: 10, fontWeight: 700,
    padding: '2px 9px', borderRadius: 20,
    background: '#FDECEA', color: '#B71C1C',
  },
  payChip: {
    background: 'var(--cream-dark)', borderRadius: 6,
    padding: '2px 8px', fontSize: 11, fontWeight: 500,
    color: 'var(--text-mid)',
  },
  showMoreRow: { padding: '10px 16px', textAlign: 'center' },
  showMoreBtn: {
    background: 'none', border: 'none',
    color: 'var(--brown)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    textDecoration: 'underline', textUnderlineOffset: 2,
  },

  /* ── Stock alerts ── */
  stockSection:    { padding: '10px 16px' },
  stockGroupLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: 6,
  },
  stockItem: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '5px 0',
    borderBottom: '1px solid var(--border-light)',
  },
  stockItemName: { fontSize: 12, color: 'var(--text-dark)', fontWeight: 500 },
  stockItemQty:  { fontSize: 11, fontWeight: 700 },
  stockMore:     { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' },

  /* ── Voucher panel ── */
  voucherStats: {
    display: 'flex', alignItems: 'center',
    background: 'var(--cream)', borderRadius: 8,
    border: '1px solid var(--border)', overflow: 'hidden',
  },
  voucherStatItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '8px 4px', gap: 2,
  },
  voucherStatNum:     { fontWeight: 700, fontSize: 16 },
  voucherStatLabel:   { fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 },
  voucherStatDivider: { width: 1, height: 36, background: 'var(--border)' },
  voucherChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--cream)', borderRadius: 8,
    padding: '7px 10px', border: '1px solid var(--border)',
  },
  voucherCode: {
    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
    color: 'var(--brown-dark)', letterSpacing: 0.5, flex: 1,
  },
  voucherAmt: {
    fontSize: 11, color: 'var(--status-confirmed)',
    fontWeight: 600, whiteSpace: 'nowrap',
  },

  /* ── Top products ── */
  topRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 18px', borderBottom: '1px solid var(--border-light)',
  },
  rankBadge: {
    width: 22, height: 22, borderRadius: '50%',
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  topName: {
    fontSize: 12, fontWeight: 600, color: 'var(--text-dark)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
};
