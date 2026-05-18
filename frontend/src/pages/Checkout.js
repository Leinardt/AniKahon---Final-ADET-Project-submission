/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { placeOrder, applyVoucher, getUserProfile, getAvailableVouchers, getOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/variables.css';

const PICKUP_LOCATIONS = [
  'SM City Legazpi - AniKahon Booth',
  'Bicol University - College of Science',
];
const TIME_SLOTS = [
  '9:00 AM – 10:00 AM', '10:00 AM – 11:00 AM', '11:00 AM – 12:00 PM',
  '1:00 PM – 2:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM',
];

const DELIVERY_FEE = 30;
const CONVENIENCE_FEE = 0;

// SVG Icons
const LocationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default function Checkout() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = useMemo(() => state?.items || [], [state?.items]);

  const [payMethod, setPayMethod] = useState('cod');
  const [pickupLoc, setPickupLoc] = useState(PICKUP_LOCATIONS[0]);
  const [pickupSlot, setPickupSlot] = useState(TIME_SLOTS[0]);
  const [pickupDate, setPickupDate] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [voucherErr, setVoucherErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [userHasOrders, setUserHasOrders] = useState(false);

  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [autoAppliedMsg, setAutoAppliedMsg] = useState('');
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [hasAutoApplied, setHasAutoApplied] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    firstName: '', lastName: '', phone: '', street: '', barangay: '', municipality: '',
  });

  const subtotal = items.reduce((sum, i) => sum + Number(i.Product.UnitPrice) * i.ProductQuantity, 0);
  const fee = payMethod === 'cod' ? DELIVERY_FEE : CONVENIENCE_FEE;
  const discount = voucherData ? voucherData.discount : 0;
  const total = Math.max(0, subtotal + fee - discount);

  // Load user profile
  useEffect(() => {
    if (user) {
      getUserProfile(user.userID).then(res => {
        const data = res.data;
        setAddressForm({
          firstName: data.FirstName || user.firstName || '',
          lastName: data.LastName || user.lastName || '',
          phone: data.ContactNum || '',
          street: data.Address || '',
          barangay: data.Barangay || '',
          municipality: data.Municipality || '',
        });
      }).catch(console.error);
    }
  }, [user]);

  // Load available vouchers based on payment method
  useEffect(() => {
    if (user && items.length > 0) {
      getAvailableVouchers(user.userID, payMethod)
        .then(res => setAvailableVouchers(res.data))
        .catch(console.error);
    }
  }, [user, items, payMethod]);

  // Check if user has existing orders (for first purchase vouchers)
  useEffect(() => {
    if (user) {
      getOrders(user.userID)
        .then(res => setUserHasOrders(res.data.length > 0))
        .catch(console.error);
    }
  }, [user]);

  // Auto-apply best voucher - ONLY ONCE and only if not manually overridden
  useEffect(() => {
    if (!hasAutoApplied && availableVouchers.length > 0 && !voucherData && !manualEntryMode && subtotal > 0) {
      const applicableVouchers = availableVouchers.filter(v => v.is_applicable !== false);
      let bestVoucher = null;
      let bestDiscount = 0;
      
      for (const v of applicableVouchers) {
        const discountAmount = v.calculatedDiscount || 0;
        if (discountAmount > bestDiscount) {
          bestDiscount = discountAmount;
          bestVoucher = v;
        }
      }
      
      if (bestVoucher && bestDiscount > 0) {
        setVoucherData({
          voucherID: bestVoucher.VoucherID,
          discount: bestDiscount,
          code: bestVoucher.VoucherCode
        });
        setSelectedVoucherId(bestVoucher.VoucherID);
        setVoucherCode(bestVoucher.VoucherCode);
        setAutoAppliedMsg(`✨ Best voucher applied: ${bestVoucher.VoucherCode} (₱${bestDiscount.toFixed(2)} off)`);
        setHasAutoApplied(true);
        setTimeout(() => setAutoAppliedMsg(''), 6000);
      }
    }
  }, [availableVouchers, subtotal, voucherData, manualEntryMode, hasAutoApplied]);

  // Check if current voucher is still valid when payment method changes
  useEffect(() => {
    if (voucherData && availableVouchers.length > 0) {
      const voucher = availableVouchers.find(v => v.VoucherID === voucherData.voucherID);
      if (voucher && voucher.PaymentMethodCondition !== 'both' && voucher.PaymentMethodCondition !== payMethod) {
        setVoucherData(null);
        setSelectedVoucherId(null);
        setVoucherCode('');
        setAutoAppliedMsg('');
        setToast(`Voucher ${voucherData.code} is not valid for ${payMethod === 'cod' ? 'Cash on Delivery' : 'Cash on Pickup'}`);
        setTimeout(() => setToast(''), 3000);
      }
    }
  }, [payMethod, availableVouchers, voucherData]);

  const getImageUrl = (productId) => {
    if (imageErrors[productId]) return '/images/products/placeholder.jpg';
    return `/images/products/product-${productId}-1.jpg`;
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const handleApplyVoucher = async () => {
    setVoucherErr('');
    if (!voucherCode.trim()) return;
    
    try {
      const res = await applyVoucher({ 
        code: voucherCode.trim(), 
        subtotal,
        payment_method: payMethod,
        user_id: user.userID
      });
      setVoucherData({
        voucherID: res.data.voucherID,
        discount: res.data.discount,
        code: res.data.code
      });
      setSelectedVoucherId(res.data.voucherID);
      setAutoAppliedMsg('');
      setManualEntryMode(true);
      setHasAutoApplied(true);
    } catch (err) {
      setVoucherErr(err.response?.data?.error || 'Invalid voucher.');
      setVoucherData(null);
    }
  };

  const handleSelectVoucher = (voucher) => {
    if (!voucher.is_applicable) {
      setVoucherErr(voucher.disabled_reason);
      return;
    }
    
    setVoucherData({
      voucherID: voucher.VoucherID,
      discount: voucher.calculatedDiscount,
      code: voucher.VoucherCode
    });
    setSelectedVoucherId(voucher.VoucherID);
    setVoucherCode(voucher.VoucherCode);
    setVoucherErr('');
    setShowVoucherSelector(false);
    setAutoAppliedMsg('');
    setManualEntryMode(true);
    setHasAutoApplied(true);
  };

  const handleRemoveVoucher = () => {
    setVoucherData(null);
    setSelectedVoucherId(null);
    setVoucherCode('');
    setAutoAppliedMsg('');
    setManualEntryMode(true);
  };

  const handleAddressChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  };

  const getFullAddress = () => {
    const { street, barangay, municipality } = addressForm;
    return [street, barangay, municipality].filter(p => p?.trim()).join(', ');
  };

  const handleConfirm = async () => {
    if (busy) return;
    if (!items.length) return;

    const fullAddress = getFullAddress();
    const recipientName = `${addressForm.firstName} ${addressForm.lastName}`.trim();

    if (payMethod === 'cod' && !fullAddress) {
      setToast('Please enter your delivery address.'); return;
    }
    if (payMethod === 'pickup' && !pickupDate) {
      setToast('Please select a pickup date.'); return;
    }

    setBusy(true);
    try {
      const payload = {
        userID: user.userID,
        paymentType: payMethod === 'cod' ? 'Cash on Delivery' : 'Cash on Pickup',
        total: total.toFixed(2),
        discount: discount.toFixed(2),
        voucherID: voucherData?.voucherID || null,
        cartItemIDs: items.map(i => i.CartItemID),
        items: items.map(i => ({
          productID: i.Product.ProductID,
          quantity: i.ProductQuantity,
          unitPrice: Number(i.Product.UnitPrice).toFixed(2),
        })),
        deliveryAddress: payMethod === 'cod' ? `${recipientName} | ${addressForm.phone} | ${fullAddress}` : null,
        pickupLocation: payMethod === 'pickup' ? pickupLoc : null,
        pickupDate: payMethod === 'pickup' ? pickupDate : null,
        pickupTimeSlot: payMethod === 'pickup' ? pickupSlot : null,
      };
      await placeOrder(payload);
      navigate('/orders', { state: { justPlaced: true } });
    } catch (err) {
      setToast(err.response?.data?.error || 'Could not place order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <div><Navbar />
        <div className="page-body">
          <div className="empty-state"><span className="empty-icon">🛒</span><p>No items to checkout.</p></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-body">
        <h1 style={S.pageTitle}>Checkout</h1>
        <div style={S.layout}>
          {/* Left: item list */}
          <div style={S.left}>
            <div style={S.itemList}>
              {items.map(item => (
                <div key={item.CartItemID} style={S.itemRow}>
                  <div style={S.itemImgWrap}>
                    <img src={getImageUrl(item.Product.ProductID)} alt={item.Product.ProductName} style={S.itemImg} onError={() => handleImageError(item.Product.ProductID)} />
                  </div>
                  <div style={S.itemInfo}>
                    <p style={S.itemName}>{item.Product.ProductName}</p>
                    <p style={S.itemPrice}>₱{Number(item.Product.UnitPrice).toFixed(2)}</p>
                  </div>
                  <div style={S.itemQtyWrap}>
                    <span style={S.itemQtyLabel}>Quantity:</span>
                    <span style={S.itemQtyVal}>{String(item.ProductQuantity).padStart(2, '0')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-apply toast */}
            {autoAppliedMsg && voucherData && (
              <div style={S.autoAppliedToast}>
                <span>{autoAppliedMsg}</span>
                <button style={S.skipVoucherBtn} onClick={handleRemoveVoucher}>✗ No thanks</button>
              </div>
            )}

            {/* Voucher Section */}
            <div style={S.voucherSection}>
              <div style={S.voucherHeader}>
                <span style={S.voucherHeaderTitle}>🎫 Apply Voucher</span>
                <button style={S.toggleBtn} onClick={() => setShowVoucherSelector(!showVoucherSelector)}>
                  {showVoucherSelector ? '−' : '+'}
                </button>
              </div>
              
              {showVoucherSelector && (
                <div style={S.voucherList}>
                  {availableVouchers.length === 0 ? (
                    <p style={S.noVoucher}>No available vouchers at the moment.</p>
                  ) : (
                    availableVouchers.map(v => {
                      const isSelected = selectedVoucherId === v.VoucherID;
                      
                      let isApplicable = true;
                      let disabledReason = '';
                      
                      if (subtotal < v.MinPurchase) {
                        isApplicable = false;
                        disabledReason = `Requires minimum purchase of ₱${v.MinPurchase}`;
                      }
                      else if (v.PaymentMethodCondition !== 'both' && v.PaymentMethodCondition !== payMethod) {
                        isApplicable = false;
                        disabledReason = `Only valid for ${v.PaymentMethodCondition === 'cod' ? 'Cash on Delivery' : 'Cash on Pickup'}`;
                      }
                      else if (v.FirstPurchaseOnly && userHasOrders) {
                        isApplicable = false;
                        disabledReason = 'First purchase only';
                      }
                      
                      const discountText = v.DiscountType === 'percentage' 
                        ? `${v.DiscountValue}% OFF` 
                        : `₱${v.DiscountValue} OFF`;
                      const maxDiscountText = v.MaxDiscount ? ` (max ₱${v.MaxDiscount})` : '';
                      
                      return (
                        <div 
                          key={v.VoucherID} 
                          style={{
                            ...S.voucherCard,
                            ...(isSelected ? S.voucherCardSelected : {}),
                            ...(!isApplicable ? S.voucherCardDisabled : {})
                          }}
                          onClick={() => isApplicable && handleSelectVoucher(v)}
                        >
                          <input 
                            type="radio" 
                            name="voucher" 
                            value={v.VoucherID} 
                            checked={isSelected} 
                            disabled={!isApplicable}
                            onChange={() => isApplicable && handleSelectVoucher(v)}
                            style={S.voucherRadio}
                          />
                          <div style={S.voucherInfo}>
                            <strong style={S.voucherDiscount}>{discountText}{maxDiscountText}</strong>
                            <p style={S.voucherCode}>{v.VoucherCode}</p>
                            <small style={S.voucherMin}>
                              Min. spend ₱{v.MinPurchase}
                              {v.PaymentMethodCondition !== 'both' && (
                                <span style={{ color: 'var(--brown)', marginLeft: 8 }}>
                                  • {v.PaymentMethodCondition === 'cod' ? 'COD only' : 'Pickup only'}
                                </span>
                              )}
                              {v.FirstPurchaseOnly && (
                                <span style={{ color: 'var(--brown)', marginLeft: 8 }}>• First purchase only</span>
                              )}
                            </small>
                            {!isApplicable && (
                              <small style={{ color: '#f44336', display: 'block', marginTop: 4 }}>
                                ⚠️ {disabledReason}
                              </small>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {/* Manual code entry */}
              <div style={S.manualCodeRow}>
                <input
                  className="field-filled"
                  placeholder="Or enter voucher code"
                  value={voucherCode}
                  onChange={e => { setVoucherCode(e.target.value); setVoucherErr(''); if (!e.target.value) { setVoucherData(null); setManualEntryMode(false); } }}
                  style={{ flex: 1, borderRadius: 6 }}
                />
                <button style={S.voucherBtn} onClick={handleApplyVoucher}>Apply</button>
              </div>
              {voucherErr && <p style={{ color: 'var(--status-cancelled)', fontSize: 12, marginTop: 4 }}>{voucherErr}</p>}
              {voucherData && !autoAppliedMsg && (
                <div style={S.appliedVoucher}>
                  <span>✓ Applied: {voucherData.code} (₱{voucherData.discount.toFixed(2)} off)</span>
                  <button style={S.removeVoucherBtn} onClick={handleRemoveVoucher}>✗ Remove</button>
                </div>
              )}
            </div>
          </div>

          {/* Right: summary + payment */}
          <div style={S.right}>
            <div style={S.summaryCard}>
              <h3 style={S.cardTitle}>Order Summary</h3>
              <div style={S.summaryRows}>
                <div style={S.summaryRow}><span>Selected Items:</span><span>{items.length}</span></div>
                <div style={S.summaryRow}><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
                <div style={S.summaryRow}><span>{payMethod === 'cod' ? 'Delivery Fee' : 'Pickup Fee'}</span><span>₱{fee}</span></div>
                {voucherData && <div style={{ ...S.summaryRow, color: 'green' }}><span>Discount</span><span>-₱{discount.toFixed(2)}</span></div>}
                <div style={S.divider} />
                <div style={{ ...S.summaryRow, fontWeight: 700, fontSize: 16, color: 'var(--brown)' }}><span>Total:</span><span>₱{total.toFixed(2)}</span></div>
              </div>
              <button className="btn-green" onClick={handleConfirm} disabled={busy} style={{ marginTop: 16, opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Placing Order…' : 'Confirm Order'}
              </button>
            </div>

            {/* Payment method - UPDATED with clean buttons and SVG icons */}
            <div style={S.paymentCard}>
              <h3 style={S.cardTitle}>Select Payment Method:</h3>
              
              <div style={S.paymentOptions}>
                <button 
                  onClick={() => setPayMethod('cod')}
                  style={{
                    ...S.payBtn,
                    ...(payMethod === 'cod' ? S.payBtnActive : {})
                  }}
                >
                  <span>Cash on Delivery</span>
                  {payMethod === 'cod' && <span style={S.checkMark}></span>}
                </button>
                
                <div style={S.payOrDivider}>
                  <span style={S.payOrLine}></span>
                  <span style={S.payOrText}>or</span>
                  <span style={S.payOrLine}></span>
                </div>
                
                <button 
                  onClick={() => setPayMethod('pickup')}
                  style={{
                    ...S.payBtn,
                    ...(payMethod === 'pickup' ? S.payBtnActive : {})
                  }}
                >
                  <span>Cash on Pickup</span>
                  {payMethod === 'pickup' && <span style={S.checkMark}></span>}
                </button>
              </div>

              {payMethod === 'cod' && (
                <div style={S.payExtra}>
                  <div style={S.addressCard}>
                    <p style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LocationIcon /> Delivery Information
                    </p>
                    <div style={S.row}>
                      <div style={{ flex: 1 }}>
                        <label style={S.smallLabel}>First Name</label>
                        <input className="field-filled" value={addressForm.firstName} onChange={e => handleAddressChange('firstName', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={S.smallLabel}>Last Name</label>
                        <input className="field-filled" value={addressForm.lastName} onChange={e => handleAddressChange('lastName', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={S.smallLabel}>Phone Number</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PhoneIcon />
                        <input className="field-filled" value={addressForm.phone} onChange={e => handleAddressChange('phone', e.target.value)} style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={S.smallLabel}>Street Address</label>
                      <input className="field-filled" value={addressForm.street} onChange={e => handleAddressChange('street', e.target.value)} />
                    </div>
                    <div style={S.row}>
                      <div style={{ flex: 1 }}>
                        <label style={S.smallLabel}>Barangay</label>
                        <input className="field-filled" value={addressForm.barangay} onChange={e => handleAddressChange('barangay', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={S.smallLabel}>Municipality / City</label>
                        <input className="field-filled" value={addressForm.municipality} onChange={e => handleAddressChange('municipality', e.target.value)} />
                      </div>
                    </div>
                    <button style={S.editAddrBtn} onClick={() => navigate('/profile')}>
                      <HomeIcon /> Manage Address
                    </button>
                  </div>
                </div>
              )}

              {payMethod === 'pickup' && (
                <div style={S.payExtra}>
                  <label style={S.pickupLabel}>Pickup Location</label>
                  <select className="field-filled" value={pickupLoc} onChange={e => setPickupLoc(e.target.value)} style={{ marginBottom: 10 }}>
                    {PICKUP_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                  <label style={S.pickupLabel}>Time Slot</label>
                  <select className="field-filled" value={pickupSlot} onChange={e => setPickupSlot(e.target.value)} style={{ marginBottom: 10 }}>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <label style={S.pickupLabel}>Pickup Date</label>
                  <input className="field-filled" type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="success-toast">{toast}</div>}
    </div>
  );
}

const S = {
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 },
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  left: { flex: 1, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: '20px' },
  itemList: { marginBottom: 20 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-light)' },
  itemImgWrap: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0 },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: 600, fontSize: 14, color: 'var(--text-dark)', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: 700, color: 'var(--brown)' },
  itemQtyWrap: { textAlign: 'right', flexShrink: 0 },
  itemQtyLabel: { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 },
  itemQtyVal: { display: 'inline-block', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 14px', fontSize: 13, fontWeight: 600 },
  
  autoAppliedToast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F5E9', color: '#2E7D32', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, border: '1px solid #A5D6A7' },
  skipVoucherBtn: { background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: 11, marginLeft: 12, textDecoration: 'underline' },
  
  voucherSection: { marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' },
  voucherHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  voucherHeaderTitle: { fontWeight: 600, fontSize: 14, color: 'var(--text-dark)' },
  toggleBtn: { background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  voucherList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 250, overflowY: 'auto' },
  voucherCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', background: 'white' },
  voucherCardSelected: { borderColor: 'var(--brown)', background: 'var(--cream)' },
  voucherCardDisabled: { opacity: 0.6, background: '#f5f5f5', cursor: 'not-allowed' },
  voucherRadio: { cursor: 'pointer' },
  voucherInfo: { flex: 1 },
  voucherDiscount: { fontSize: 14, color: 'var(--brown-dark)', display: 'block', marginBottom: 4 },
  voucherCode: { fontSize: 11, color: 'var(--text-mid)', fontFamily: 'monospace', marginBottom: 2 },
  voucherMin: { fontSize: 10, color: 'var(--text-light)' },
  noVoucher: { textAlign: 'center', padding: '16px', color: 'var(--text-mid)', fontSize: 13 },
  manualCodeRow: { display: 'flex', gap: 10, alignItems: 'center' },
  voucherBtn: { background: 'var(--brown)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  appliedVoucher: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px', background: '#E8F5E9', borderRadius: 6, fontSize: 12, color: '#2E7D32' },
  removeVoucherBtn: { background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: 12 },
  
  right: { width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  summaryCard: { background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: '20px' },
  cardTitle: { fontWeight: 700, fontSize: 16, color: 'var(--text-dark)', marginBottom: 14 },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 8 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-mid)' },
  divider: { height: 1, background: 'var(--border-light)', margin: '8px 0' },
  
  paymentCard: { background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: '20px' },
  paymentOptions: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  payBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    width: '100%', 
    padding: '14px 18px', 
    border: '2px solid var(--btn-pink)', 
    borderRadius: 12, 
    background: '#fff', 
    fontSize: 14, 
    fontWeight: 600, 
    cursor: 'pointer', 
    color: 'var(--brown-dark)',
    transition: 'all 0.2s ease',
    gap: 8,
  },
  payBtnActive: { 
    background: 'var(--btn-pink)', 
    color: '#fff',
    boxShadow: '0 2px 8px rgba(232, 160, 160, 0.4)',
  },
  checkMark: { 
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 700,
  },
  payOrDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '4px 0',
  },
  payOrLine: {
    flex: 1,
    height: 1,
    background: 'var(--border-light)',
  },
  payOrText: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  payExtra: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 },
  addressCard: { background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '14px' },
  editAddrBtn: { marginTop: 10, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', fontSize: 12, color: 'var(--brown)', cursor: 'pointer', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pickupLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' },
  row: { display: 'flex', gap: 12, marginBottom: 8 },
  smallLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' },
};