import React, { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetProducts, adminAddProduct,
  adminEditProduct, adminDeleteProduct, getCategories,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/variables.css';
import '../../styles/admin.css';

const BLANK = {
  productName: '', description: '', categoryID: '',
  price: '', stock: '', image: null,
};

export default function AdminProducts() {
  const { admin } = useAuth();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [modal,      setModal]      = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(BLANK);
  const [imgPreview, setImgPreview] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const fileRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminGetProducts(), getCategories()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data);
        setCategories(cRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const getImageUrl = (productId) => {
    if (imageErrors[productId]) {
      return '/images/products/placeholder.jpg';
    }
    return `/images/products/product-${productId}-1.jpg`;
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.ProductName.toLowerCase().includes(q);
    const matchCat = !catFilter || String(p.Category_id) === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setImgPreview(null);
    setModal('add');
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      productName: p.ProductName,
      description: p.ProductDescription || '',
      categoryID:  String(p.Category_id),
      price:       String(p.UnitPrice),
      stock:       String(p.StockQuantity),
      image:       null,
    });
    setImgPreview(getImageUrl(p.ProductID));
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); setImgPreview(null); };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.productName || !form.categoryID || !form.price || form.stock === '') {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    if (Number(form.stock) < 0) {
      showToast('Stock cannot be negative.', 'error'); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('adminID',     admin.adminID);
      fd.append('productName', form.productName);
      fd.append('description', form.description);
      fd.append('categoryID',  form.categoryID);
      fd.append('price',       form.price);
      fd.append('stock',       form.stock);
      if (form.image) fd.append('image', form.image);

      if (modal === 'add') {
        await adminAddProduct(fd);
        showToast('Product added successfully!');
      } else {
        await adminEditProduct(editing.ProductID, fd);
        showToast('Product updated successfully!');
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.ProductName}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct(p.ProductID, admin.adminID);
      showToast(`"${p.ProductName}" deleted.`);
      load();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  return (
    <AdminLayout title="Products">
      <div style={S.topRow}>
        <div />
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <PlusIcon /> Add New Product
        </button>
      </div>

      <div className="admin-section-card">
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <SearchIcon />
            <input
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="admin-filter-select"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.CategoryID} value={String(c.CategoryID)}>
                {c.CategoryType}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <span className="empty-icon">📦</span>
            <p>No products found.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.ProductID}>
                    <td style={{ width: 60 }}>
                      <img
                        src={getImageUrl(p.ProductID)}
                        alt={p.ProductName}
                        style={S.productThumb}
                        onError={() => handleImageError(p.ProductID)}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.ProductName}</span>
                      {p.ProductDescription && (
                        <p style={S.descSnippet}>
                          {p.ProductDescription.slice(0, 60)}{p.ProductDescription.length > 60 ? '…' : ''}
                        </p>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-mid)' }}>{p.CategoryType}</td>
                    <td style={{ fontWeight: 700 }}>₱{Number(p.UnitPrice).toFixed(2)}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: p.StockQuantity === 0
                          ? 'var(--status-cancelled)'
                          : p.StockQuantity <= 5
                            ? 'var(--status-pay)'
                            : 'var(--status-confirmed)',
                      }}>
                        {p.StockQuantity}
                      </span>
                    </td>
                    <td>
                      {p.StockQuantity === 0
                        ? <span className="badge badge-cancelled">Out of Stock</span>
                        : <span className="badge badge-active">In Stock</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={S.actionBtns}>
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => openEdit(p)}
                        >
                          ✏ Edit
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(p)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {modal === 'add' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button className="admin-modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="admin-modal-body">
              <div
                className="img-preview-wrap"
                onClick={() => fileRef.current?.click()}
              >
                {imgPreview
                  ? <img src={imgPreview} alt="Preview" />
                  : (
                    <div className="img-preview-placeholder">
                      <span style={{ fontSize: 28 }}>📷</span>
                      <span>Click to upload product image</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        JPG, PNG — recommended 800×800px
                      </span>
                    </div>
                  )
                }
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImg}
              />

              <div className="admin-field">
                <label>Product Name *</label>
                <input
                  placeholder="e.g. Wooden Beads Bracelet #1"
                  value={form.productName}
                  onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                />
              </div>

              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Category *</label>
                  <select
                    value={form.categoryID}
                    onChange={e => setForm(f => ({ ...f, categoryID: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.CategoryID} value={String(c.CategoryID)}>
                        {c.CategoryType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Unit Price (₱) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-field" style={{ maxWidth: 200 }}>
                <label>Stock Quantity *</label>
                <input
                  type="number" min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>

              <div className="admin-field">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the product…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
  productThumb: {
    width: 48, height: 48, borderRadius: 8,
    objectFit: 'cover', background: 'var(--cream-dark)',
  },
  descSnippet: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  actionBtns:  { display: 'flex', gap: 6, justifyContent: 'center' },
};