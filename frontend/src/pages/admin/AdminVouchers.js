import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetVouchers, adminAddVoucher,
  adminUpdateVoucher, adminDeleteVoucher,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/variables.css';
import '../../styles/admin.css';

const BLANK = {
  code: '', discountType: 'percentage', discountValue: '',
  minPurchase: '0', startDate: '', endDate: '', usageLimit: '1',
  maxDiscount: '', paymentMethodCondition: 'both', firstPurchaseOnly: false,
};

const today = new Date().toISOString().split('T')[0];

export default function AdminVouchers() {
  const { admin }  = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [editForm, setEditForm] = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetVouchers()
      .then(res => setVouchers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setEditField = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const getVoucherStatus = (v) => {
    if (!v.IsActive) return 'inactive';
    if (v.EndDate < today) return 'expired';
    if (v.UsedCount >= v.UsageLimit) return 'expired';
    return 'active';
  };

  const filtered = vouchers.filter(v =>
    !search || v.VoucherCode.toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);
    setEditForm({
      code: voucher.VoucherCode,
      discountType: voucher.DiscountType,
      discountValue: voucher.DiscountValue,
      minPurchase: voucher.MinPurchase,
      maxDiscount: voucher.MaxDiscount || '',
      paymentMethodCondition: voucher.PaymentMethodCondition || 'both',
      firstPurchaseOnly: voucher.FirstPurchaseOnly || false,
      startDate: voucher.StartDate,
      endDate: voucher.EndDate,
      usageLimit: voucher.UsageLimit,
    });
    setEditModal(true);
  };

  const handleCreate = async () => {
    if (!form.code || !form.discountValue || !form.startDate || !form.endDate) {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    if (Number(form.discountValue) <= 0) {
      showToast('Discount value must be greater than 0.', 'error'); return;
    }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) {
      showToast('Percentage cannot exceed 100.', 'error'); return;
    }
    if (form.endDate < form.startDate) {
      showToast('End date must be after start date.', 'error'); return;
    }

    setSaving(true);
    try {
      await adminAddVoucher({
        adminID:       admin.adminID,
        code:          form.code.toUpperCase().trim(),
        discountType:  form.discountType,
        discountValue: form.discountValue,
        minPurchase:   form.minPurchase || '0',
        maxDiscount:   form.maxDiscount || null,
        paymentMethodCondition: form.paymentMethodCondition,
        firstPurchaseOnly: form.firstPurchaseOnly,
        startDate:     form.startDate,
        endDate:       form.endDate,
        usageLimit:    form.usageLimit,
      });
      showToast('Voucher created!');
      setModal(false);
      setForm(BLANK);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create voucher.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.code || !editForm.discountValue || !editForm.startDate || !editForm.endDate) {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    if (Number(editForm.discountValue) <= 0) {
      showToast('Discount value must be greater than 0.', 'error'); return;
    }
    if (editForm.discountType === 'percentage' && Number(editForm.discountValue) > 100) {
      showToast('Percentage cannot exceed 100.', 'error'); return;
    }
    if (editForm.endDate < editForm.startDate) {
      showToast('End date must be after start date.', 'error'); return;
    }

    setSaving(true);
    try {
      await adminUpdateVoucher(editingVoucher.VoucherID, {
        adminID:       admin.adminID,
        code:          editForm.code.toUpperCase().trim(),
        discountType:  editForm.discountType,
        discountValue: editForm.discountValue,
        minPurchase:   editForm.minPurchase || '0',
        maxDiscount:   editForm.maxDiscount || null,
        paymentMethodCondition: editForm.paymentMethodCondition,
        firstPurchaseOnly: editForm.firstPurchaseOnly,
        startDate:     editForm.startDate,
        endDate:       editForm.endDate,
        usageLimit:    editForm.usageLimit,
      });
      showToast('Voucher updated!');
      setEditModal(false);
      setEditingVoucher(null);
      setEditForm(BLANK);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update voucher.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v) => {
    try {
      await adminUpdateVoucher(v.VoucherID, {
        adminID:  admin.adminID,
        isActive: !v.IsActive,
      });
      showToast(`Voucher ${v.IsActive ? 'deactivated' : 'activated'}.`);
      load();
    } catch {
      showToast('Update failed.', 'error');
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete voucher "${v.VoucherCode}"?`)) return;
    try {
      await adminDeleteVoucher(v.VoucherID, admin.adminID);
      showToast(`"${v.VoucherCode}" deleted.`);
      load();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <AdminLayout title="Vouchers">

      {/* Header */}
      <div style={S.topRow}>
        <div style={S.summaryChips}>
          <span style={S.chip}>
            <span style={{ ...S.chipDot, background: 'var(--btn-green)' }} />
            {vouchers.filter(v => getVoucherStatus(v) === 'active').length} Active
          </span>
          <span style={S.chip}>
            <span style={{ ...S.chipDot, background: 'var(--status-pay)' }} />
            {vouchers.filter(v => getVoucherStatus(v) === 'inactive').length} Inactive
          </span>
          <span style={S.chip}>
            <span style={{ ...S.chipDot, background: 'var(--status-cancelled)' }} />
            {vouchers.filter(v => getVoucherStatus(v) === 'expired').length} Expired
          </span>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { setForm(BLANK); setModal(true); }}
        >
          <PlusIcon /> Create Voucher
        </button>
      </div>

      <div className="admin-section-card">
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <SearchIcon />
            <input
              placeholder="Search voucher code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} voucher{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <span className="empty-icon">🎫</span>
            <p>No vouchers yet. Create your first one!</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min. Purchase</th>
                  <th>Validity</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const status = getVoucherStatus(v);
                  return (
                    <tr key={v.VoucherID}>
                      <td>
                        <span style={S.codeChip}>{v.VoucherCode}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {v.DiscountType === 'percentage'
                          ? `${v.DiscountValue}% off`
                          : `₱${Number(v.DiscountValue).toFixed(2)} off`}
                       </td>
                      <td style={{ color: 'var(--text-mid)' }}>
                        {Number(v.MinPurchase) > 0 ? `₱${Number(v.MinPurchase).toFixed(2)}` : '—'}
                       </td>
                      <td style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-mid)' }}>{fmtDate(v.StartDate)}</span>
                        <span style={{ color: 'var(--border)' }}> → </span>
                        <span style={{ color: 'var(--text-mid)' }}>{fmtDate(v.EndDate)}</span>
                       </td>
                      <td>
                        <div style={S.usageBar}>
                          <div
                            style={{
                              ...S.usageFill,
                              width: `${Math.min(100, (v.UsedCount / v.UsageLimit) * 100)}%`,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {v.UsedCount} / {v.UsageLimit}
                        </span>
                       </td>
                      <td>
                        {status === 'active'   && <span className="badge badge-active">Active</span>}
                        {status === 'inactive' && <span className="badge badge-inactive">Inactive</span>}
                        {status === 'expired'  && <span className="badge badge-expired">Expired</span>}
                       </td>
                      <td>
                        <div style={S.actionBtns}>
                          <button
                            className={`admin-btn admin-btn-sm ${v.IsActive ? 'admin-btn-ghost' : 'admin-btn-green'}`}
                            onClick={() => handleToggle(v)}
                            disabled={status === 'expired'}
                          >
                            {v.IsActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => openEditModal(v)}
                          >
                            ✏ Edit
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleDelete(v)}
                          >
                            Delete
                          </button>
                        </div>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ Create Modal ══ */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Create Voucher</h2>
              <button className="admin-modal-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="admin-modal-body">
              {/* Code */}
              <div className="admin-field">
                <label>Voucher Code *</label>
                <input
                  placeholder="e.g. SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}
                />
              </div>

              {/* Discount type + value */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Discount Type *</label>
                  <select value={form.discountType} onChange={setField('discountType')}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>
                    {form.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₱)'} *
                  </label>
                  <input
                    type="number" min="0"
                    step={form.discountType === 'percentage' ? '1' : '0.01'}
                    placeholder={form.discountType === 'percentage' ? '10' : '50.00'}
                    value={form.discountValue}
                    onChange={setField('discountValue')}
                  />
                </div>
              </div>

              {/* Max Discount (ceiling) */}
              <div className="admin-field">
                <label>Maximum Discount (₱) - Optional</label>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="Leave empty for no limit"
                  value={form.maxDiscount}
                  onChange={setField('maxDiscount')}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Set a ceiling for percentage discounts (e.g., max ₱100 off)
                </small>
              </div>

              {/* Min purchase + usage limit */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Min. Purchase (₱)</label>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="0"
                    value={form.minPurchase}
                    onChange={setField('minPurchase')}
                  />
                </div>
                <div className="admin-field">
                  <label>Usage Limit *</label>
                  <input
                    type="number" min="1"
                    placeholder="1"
                    value={form.usageLimit}
                    onChange={setField('usageLimit')}
                  />
                </div>
              </div>

              {/* Payment Method Condition - Dropdown */}
              <div className="admin-field">
                <label>Payment Method Condition</label>
                <select value={form.paymentMethodCondition} onChange={setField('paymentMethodCondition')}>
                  <option value="both">Both (COD & Pickup)</option>
                  <option value="cod">Cash on Delivery Only</option>
                  <option value="pickup">Cash on Pickup Only</option>
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Restrict which payment method can use this voucher
                </small>
              </div>

              {/* First Purchase Only - Simple Checkbox */}
              <div className="admin-field">
                <label className="admin-checkbox-simple">
                  <input
                    type="checkbox"
                    checked={form.firstPurchaseOnly}
                    onChange={(e) => setForm(f => ({ ...f, firstPurchaseOnly: e.target.checked }))}
                  />
                  <span>First Purchase Only</span>
                </label>
                <small style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                  Only new customers can use this voucher
                </small>
              </div>

              {/* Date range */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={today}
                    onChange={setField('startDate')}
                  />
                </div>
                <div className="admin-field">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || today}
                    onChange={setField('endDate')}
                  />
                </div>
              </div>

              {/* Preview */}
              {form.code && form.discountValue && (
                <div style={S.preview}>
                  <span style={S.previewIcon}>🎫</span>
                  <div>
                    <p style={S.previewCode}>{form.code || 'CODE'}</p>
                    <p style={S.previewDesc}>
                      {form.discountType === 'percentage'
                        ? `${form.discountValue}% off`
                        : `₱${Number(form.discountValue || 0).toFixed(2)} off`}
                      {Number(form.minPurchase) > 0
                        ? ` on orders ₱${Number(form.minPurchase).toFixed(2)}+`
                        : ''}
                      {form.maxDiscount && ` (max ₱${form.maxDiscount})`}
                      {form.paymentMethodCondition !== 'both' && 
                        ` • ${form.paymentMethodCondition === 'cod' ? 'COD only' : 'Pickup only'}`}
                      {form.firstPurchaseOnly && ' • First purchase only'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? 'Creating…' : 'Create Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Edit Modal ══ */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit Voucher</h2>
              <button className="admin-modal-close" onClick={() => setEditModal(false)}>×</button>
            </div>

            <div className="admin-modal-body">
              {/* Code */}
              <div className="admin-field">
                <label>Voucher Code *</label>
                <input
                  placeholder="e.g. SUMMER20"
                  value={editForm.code}
                  onChange={(e) => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}
                />
              </div>

              {/* Discount type + value */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Discount Type *</label>
                  <select value={editForm.discountType} onChange={setEditField('discountType')}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>
                    {editForm.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₱)'} *
                  </label>
                  <input
                    type="number" min="0"
                    step={editForm.discountType === 'percentage' ? '1' : '0.01'}
                    placeholder={editForm.discountType === 'percentage' ? '10' : '50.00'}
                    value={editForm.discountValue}
                    onChange={setEditField('discountValue')}
                  />
                </div>
              </div>

              {/* Max Discount (ceiling) */}
              <div className="admin-field">
                <label>Maximum Discount (₱) - Optional</label>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="Leave empty for no limit"
                  value={editForm.maxDiscount}
                  onChange={setEditField('maxDiscount')}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Set a ceiling for percentage discounts (e.g., max ₱100 off)
                </small>
              </div>

              {/* Min purchase + usage limit */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Min. Purchase (₱)</label>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="0"
                    value={editForm.minPurchase}
                    onChange={setEditField('minPurchase')}
                  />
                </div>
                <div className="admin-field">
                  <label>Usage Limit *</label>
                  <input
                    type="number" min="1"
                    placeholder="1"
                    value={editForm.usageLimit}
                    onChange={setEditField('usageLimit')}
                  />
                </div>
              </div>

              {/* Payment Method Condition - Dropdown */}
              <div className="admin-field">
                <label>Payment Method Condition</label>
                <select value={editForm.paymentMethodCondition} onChange={setEditField('paymentMethodCondition')}>
                  <option value="both">Both (COD & Pickup)</option>
                  <option value="cod">Cash on Delivery Only</option>
                  <option value="pickup">Cash on Pickup Only</option>
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Restrict which payment method can use this voucher
                </small>
              </div>

              {/* First Purchase Only - Simple Checkbox */}
              <div className="admin-field">
                <label className="admin-checkbox-simple">
                  <input
                    type="checkbox"
                    checked={editForm.firstPurchaseOnly}
                    onChange={(e) => setEditForm(f => ({ ...f, firstPurchaseOnly: e.target.checked }))}
                  />
                  <span>First Purchase Only</span>
                </label>
                <small style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                  Only new customers can use this voucher
                </small>
              </div>

              {/* Date range */}
              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    min={today}
                    onChange={setEditField('startDate')}
                  />
                </div>
                <div className="admin-field">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    min={editForm.startDate || today}
                    onChange={setEditField('endDate')}
                  />
                </div>
              </div>

              {/* Preview */}
              {editForm.code && editForm.discountValue && (
                <div style={S.preview}>
                  <span style={S.previewIcon}>🎫</span>
                  <div>
                    <p style={S.previewCode}>{editForm.code || 'CODE'}</p>
                    <p style={S.previewDesc}>
                      {editForm.discountType === 'percentage'
                        ? `${editForm.discountValue}% off`
                        : `₱${Number(editForm.discountValue || 0).toFixed(2)} off`}
                      {Number(editForm.minPurchase) > 0
                        ? ` on orders ₱${Number(editForm.minPurchase).toFixed(2)}+`
                        : ''}
                      {editForm.maxDiscount && ` (max ₱${editForm.maxDiscount})`}
                      {editForm.paymentMethodCondition !== 'both' && 
                        ` • ${editForm.paymentMethodCondition === 'cod' ? 'COD only' : 'Pickup only'}`}
                      {editForm.firstPurchaseOnly && ' • First purchase only'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setEditModal(false)}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const S = {
  topRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  summaryChips: { display: 'flex', gap: 10 },
  chip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 20, padding: '5px 14px',
    fontSize: 12, fontWeight: 600, color: 'var(--text-mid)',
  },
  chipDot: {
    width: 8, height: 8, borderRadius: '50%',
  },
  codeChip: {
    fontFamily: 'monospace',
    background: 'var(--cream-dark)',
    border: '1px solid var(--border)',
    borderRadius: 6, padding: '3px 10px',
    fontSize: 13, fontWeight: 700,
    color: 'var(--brown-dark)',
    letterSpacing: '0.5px',
  },
  usageBar: {
    width: 80, height: 5,
    background: 'var(--border)', borderRadius: 4,
    overflow: 'hidden', marginBottom: 3,
  },
  usageFill: {
    height: '100%', background: 'var(--btn-green)',
    borderRadius: 4, transition: 'width 0.3s',
  },
  actionBtns: { display: 'flex', gap: 6, justifyContent: 'center' },

  preview: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'linear-gradient(135deg, var(--brown-pale), #fff)',
    border: '1.5px dashed var(--brown-light)',
    borderRadius: 10, padding: '14px 18px',
  },
  previewIcon: { fontSize: 26 },
  previewCode: {
    fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
    color: 'var(--brown-dark)', letterSpacing: 1,
  },
  previewDesc: { fontSize: 12, color: 'var(--text-mid)', marginTop: 2 },
};