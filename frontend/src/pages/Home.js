/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api';
import '../styles/variables.css';

/*
  IMAGE FILES NEEDED (place in /public/images/):
  ─ hero/hero-1.jpg  (main hero banner — handcrafted accessories flat-lay)
  ─ hero/hero-2.jpg  (second banner slide)
  ─ hero/hero-3.jpg  (third banner slide)
  ─ hero/hero-4.jpg  (fourth banner slide)
  ─ hero/hero-5.jpg  (fifth banner slide)
  ─ categories/bracelets.jpg
  ─ categories/necklaces.jpg
  ─ categories/rings.jpg
  ─ categories/earrings.jpg
  ─ categories/keychains.jpg
  ─ categories/anklets.jpg
  ─ categories/hair-accessories.jpg
*/

const HERO_SLIDES = [
  '/images/hero/hero-1.jpg',
  '/images/hero/hero-2.jpg',
  '/images/hero/hero-3.jpg',
  '/images/hero/hero-4.jpg',
  '/images/hero/hero-5.jpg',
];

const CATEGORIES = [
  { label: 'Bracelets',        img: '/images/categories/bracelets.jpg' },
  { label: 'Necklaces',        img: '/images/categories/necklaces.jpg' },
  { label: 'Rings',            img: '/images/categories/rings.jpg' },
  { label: 'Earrings',         img: '/images/categories/earrings.jpg' },
  { label: 'Keychains',        img: '/images/categories/keychains.jpg' },
  { label: 'Anklets',          img: '/images/categories/anklets.jpg' },
  { label: 'Hair Accessories', img: '/images/categories/hair-accessories.jpg' },
];

export default function Home() {
  const [slide,    setSlide]    = useState(0);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const navigate = useNavigate();

  /* Auto-advance hero */
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  /* Featured products */
  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goToPrevSlide = () => {
    setSlide(s => (s === 0 ? HERO_SLIDES.length - 1 : s - 1));
  };

  const goToNextSlide = () => {
    setSlide(s => (s + 1) % HERO_SLIDES.length);
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      {/* ══ Hero Banner with Arrows ══ */}
      <section
        style={S.hero}
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
      >
        {HERO_SLIDES.map((src, i) => (
          <div
            key={i}
            style={{
              ...S.slide,
              backgroundImage: `url(${src})`,
              opacity: i === slide ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
        ))}
        {/* Dark overlay */}
        <div style={S.overlay} />

        {/* Hero content */}
        <div style={S.heroContent}>
          <p style={S.heroEyebrow}>Albay's Finest Craftsmanship</p>
          <h1 style={S.heroTitle}>Discover Handcrafted<br />Albay Accessories</h1>
          <Link to="/catalog" style={S.heroBtn}>
            Shop Now &nbsp;→
          </Link>
        </div>

        {/* Left Arrow */}
        <button
          onClick={goToPrevSlide}
          style={{
            ...S.arrowBtn,
            ...S.arrowLeft,
            opacity: showArrows ? 0.7 : 0,
            pointerEvents: showArrows ? 'auto' : 'none',
          }}
          aria-label="Previous slide"
        >
          ‹
        </button>

        {/* Right Arrow */}
        <button
          onClick={goToNextSlide}
          style={{
            ...S.arrowBtn,
            ...S.arrowRight,
            opacity: showArrows ? 0.7 : 0,
            pointerEvents: showArrows ? 'auto' : 'none',
          }}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Dot indicators */}
        <div style={S.dots}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              style={{ ...S.dot, ...(i === slide ? S.dotActive : {}) }}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ══ Category Pills ══ */}
      <section style={S.catSection}>
        <h2 style={{ ...S.sectionHeading, paddingLeft: 'var(--page-pad)' }}>
          Shop by Category
        </h2>
        <div style={S.catScroll}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.label}
              to={`/catalog?category=${encodeURIComponent(cat.label)}`}
              style={S.catCard}
            >
              <div style={S.catImgWrap}>
                <img
                  src={cat.img}
                  alt={cat.label}
                  style={S.catImg}
                  onError={e => { e.target.src = '/images/products/placeholder.jpg'; }}
                />
              </div>
              <span style={S.catLabel}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ Featured Products ══ */}
      <section style={{ padding: '12px var(--page-pad) 64px' }}>
        <div style={S.featuredHeader}>
          <h2 style={S.sectionHeading}>Featured Products</h2>
          <Link to="/catalog" style={S.viewAll}>View all →</Link>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <div style={S.grid}>
            {products.map(p => (
              <ProductCard key={p.ProductID} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ══ Footer strip ══ */}
      <footer style={S.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <img 
    src="/images/anikahon.png" 
    alt="AniKahon" 
    style={{ width: 55, height: 55 }}
  />
  <span style={S.footerBrand}>AniKahon</span>
</div>
        <span style={S.footerText}>Handcrafted Albayano accessories — made with love.</span>
      </footer>
    </div>
  );
}

const S = {
  /* Hero */
  hero: {
    position: 'relative', height: 460, overflow: 'hidden',
    background: 'var(--brown-dark)',
  },
  slide: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
  },
  overlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.52) 40%, rgba(0,0,0,0.18))',
  },
  heroContent: {
    position: 'absolute', bottom: 80, left: 'var(--page-pad)',
    color: '#fff',
  },
  heroEyebrow: {
    fontSize: 13, fontWeight: 600, letterSpacing: '2px',
    textTransform: 'uppercase', color: 'var(--brown-light)',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 42, fontWeight: 700, lineHeight: 1.2,
    marginBottom: 22, color: '#fff',
  },
  heroBtn: {
    display: 'inline-block',
    color: '#fff', fontSize: 16, fontWeight: 600,
    textDecoration: 'underline', textUnderlineOffset: 3,
    letterSpacing: '0.3px',
  },
  /* Arrow Buttons */
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: 44,
    height: 44,
    fontSize: 32,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease, background 0.2s',
    zIndex: 10,
  },
  arrowLeft: {
    left: 20,
  },
  arrowRight: {
    right: 20,
  },
  dots: {
    position: 'absolute', bottom: 28,
    left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 8, zIndex: 10,
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'rgba(255,255,255,0.45)',
    border: 'none', cursor: 'pointer', padding: 0,
    transition: 'background 0.2s, transform 0.2s',
  },
  dotActive: {
    background: '#fff', transform: 'scale(1.3)',
  },

  /* Categories */
  catSection: { padding: '40px 0 28px' },
  catScroll: {
    display: 'flex', gap: 16, overflowX: 'auto',
    padding: '8px var(--page-pad) 8px',
    scrollbarWidth: 'none',
    justifyContent: 'center',
  },
  catCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    flexShrink: 0, cursor: 'pointer', textDecoration: 'none',
  },
  catImgWrap: {
    width: 88, height: 88, borderRadius: '50%',
    overflow: 'hidden', background: 'var(--cream-dark)',
    border: '2.5px solid var(--border)',
    transition: 'border-color 0.18s, transform 0.18s',
  },
  catImg: { width: '100%', height: '100%', objectFit: 'cover' },
  catLabel: {
    fontSize: 12, fontWeight: 600, color: 'var(--text-mid)',
    textAlign: 'center', whiteSpace: 'nowrap',
  },

  /* Featured */
  featuredHeader: {
    display: 'flex', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 24,
  },
  sectionHeading: {
    fontFamily: 'var(--font-display)',
    fontSize: 24, fontWeight: 600, color: 'var(--brown-dark)',
  },
  viewAll: {
    fontSize: 13, color: 'var(--brown)', fontWeight: 600,
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },

  /* Footer */
  footer: {
    background: 'var(--brown-dark)', color: '#fff',
    padding: '20px var(--page-pad)',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  footerBrand: {
    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
  },
  footerText: { fontSize: 13, color: 'var(--brown-light)' },
};