import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api';
import '../styles/variables.css';

const SORT_OPTIONS = ['Relevance', 'Top Sales', 'Top Rated', 'Price ▲', 'Price ▼'];

export default function Catalog() {
  const [searchParams]          = useSearchParams();
  const category                = searchParams.get('category') || '';
  const searchQ                 = searchParams.get('search')   || '';

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState('Relevance');

  const load = useCallback(() => {
    setLoading(true);
    // Pass sort parameter to backend for Top Sales
    const sortParam = sort === 'Top Sales' ? 'top_sales' : 
                      sort === 'Price ▲' ? 'price_asc' :
                      sort === 'Price ▼' ? 'price_desc' : '';
    
    getProducts(category, sortParam)
      .then(res => {
        let data = res.data;
        if (searchQ) {
          data = data.filter(p =>
            p.ProductName.toLowerCase().includes(searchQ.toLowerCase())
          );
        }
        setProducts(data);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, searchQ, sort]);

  useEffect(() => { load(); }, [load]);

  /* Client-side sorting for options not handled by backend */
  const getSortedProducts = () => {
    if (sort === 'Price ▲') {
      return [...products].sort((a, b) => a.UnitPrice - b.UnitPrice);
    }
    if (sort === 'Price ▼') {
      return [...products].sort((a, b) => b.UnitPrice - a.UnitPrice);
    }
    if (sort === 'Top Sales') {
      return [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));
    }
    if (sort === 'Top Rated') {
      return [...products].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }
    // Relevance - keep as is from server
    return products;
  };

  const sorted = getSortedProducts();

  const pageTitle = searchQ
    ? `Results for "${searchQ}"`
    : category || 'All Products';

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="page-body">
        {/* Breadcrumb */}
        <div style={S.breadcrumb}>
          <Link to="/" style={S.breadLink}>Home</Link>
          <span style={S.breadSep}>/</span>
          {category && (
            <>
              <span style={S.breadLink}>Catalog</span>
              <span style={S.breadSep}>/</span>
            </>
          )}
          <span style={S.breadCurrent}>{pageTitle}</span>
        </div>

        {/* Sort tabs */}
        <div style={S.toolbar}>
          <div style={S.titleBlock}>
            <h1 style={S.catTitle}>{pageTitle.toUpperCase()}</h1>
            {!loading && (
              <p style={S.count}>
                {sorted.length} Product{sorted.length !== 1 ? 's' : ''} Found
              </p>
            )}
          </div>

          <div style={S.sortTabs}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt}
                style={{ ...S.sortTab, ...(sort === opt ? S.sortTabActive : {}) }}
                onClick={() => setSort(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>No products found{searchQ ? ` for "${searchQ}"` : ' in this category'}.</p>
            <Link to="/catalog" style={{ color: 'var(--brown)', fontWeight: 600, fontSize: 13 }}>
              Browse all products
            </Link>
          </div>
        ) : (
          <div style={S.grid}>
            {sorted.map(p => (
              <ProductCard key={p.ProductID} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  breadcrumb: {
    display: 'flex', alignItems: 'center', gap: 6,
    marginBottom: 20, fontSize: 12, color: 'var(--text-muted)',
  },
  breadLink:    { color: 'var(--brown)', cursor: 'pointer' },
  breadSep:     { color: 'var(--border)' },
  breadCurrent: { color: 'var(--text-mid)', fontWeight: 500 },

  toolbar: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: 16, marginBottom: 28,
    paddingBottom: 16,
    borderBottom: '1.5px solid var(--border-light)',
  },
  titleBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  catTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20, fontWeight: 700,
    color: 'var(--brown-dark)', letterSpacing: '0.5px',
  },
  count: { fontSize: 13, color: 'var(--text-muted)' },

  sortTabs: {
    display: 'flex', gap: 0,
    border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
    background: '#fff',
  },
  sortTab: {
    padding: '8px 18px',
    background: 'none', border: 'none',
    borderRight: '1px solid var(--border)',
    fontSize: 13, color: 'var(--text-mid)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },
  sortTabActive: {
    background: 'var(--brown)',
    color: '#fff',
    fontWeight: 600,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
};