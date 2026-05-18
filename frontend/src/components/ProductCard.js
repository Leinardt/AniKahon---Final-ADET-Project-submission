import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleFavorite, getFavorites } from '../api';

export default function ProductCard({ product, onFavToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingFav, setLoadingFav] = useState(true);

  const inStock = product.StockQuantity > 0;
  const isLowStock = product.StockQuantity > 0 && product.StockQuantity <= 5;

  // Fetch favorite status when component mounts or user changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user) {
        try {
          const res = await getFavorites(user.userID);
          const isFavorited = res.data.some(fav => fav.Product.ProductID === product.ProductID);
          setFav(isFavorited);
        } catch (err) {
          console.error('Failed to check favorite status:', err);
        } finally {
          setLoadingFav(false);
        }
      } else {
        setLoadingFav(false);
      }
    };
    
    checkFavoriteStatus();
  }, [user, product.ProductID]);

  const getStockText = () => {
    if (!inStock) return { text: 'Out of Stock', color: '#C87070' };
    if (isLowStock) return { text: `Only ${product.StockQuantity} left!`, color: '#E8A050' };
    return { text: `In Stock (${product.StockQuantity})`, color: '#6BAE75' };
  };

  const stockInfo = getStockText();

  const handleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (busy) return;
    setBusy(true);
    try {
      const res = await toggleFavorite({ userID: user.userID, productID: product.ProductID });
      setFav(res.data.favorited);
      if (onFavToggle) onFavToggle(product.ProductID, res.data.favorited);
    } catch {
      /* silent */
    } finally {
      setBusy(false);
    }
  };

  const getHeartColor = () => {
    if (loadingFav) return 'rgba(100,70,40,0.3)';
    return fav ? '#E05050' : 'rgba(100,70,40,0.5)';
  };

  const getHeartIcon = () => {
    if (loadingFav) return '♡';
    return fav ? '♥' : '♡';
  };

  return (
    <Link to={`/product/${product.ProductID}`} style={S.card}>
      <div style={S.imgWrap}>
        <img
          src={`/images/products/product-${product.ProductID}-1.jpg`}
          alt={product.ProductName}
          style={{ ...S.img, ...(inStock ? {} : S.imgGray) }}
          onError={e => { e.target.src = '/images/products/placeholder.jpg'; }}
        />
        {!inStock && <div style={S.oosBadge}>Out of Stock</div>}
        <button
          onClick={handleFav}
          style={{ ...S.heartBtn, color: getHeartColor() }}
          title={fav ? 'Remove from favorites' : 'Add to favorites'}
          disabled={loadingFav}
        >
          {getHeartIcon()}
        </button>
      </div>
      <div style={S.info}>
        <p style={S.name}>{product.ProductName}</p>
        <p style={S.price}>₱{Number(product.UnitPrice).toFixed(2)}</p>
        <p style={{ ...S.stock, color: stockInfo.color }}>{stockInfo.text}</p>
      </div>
    </Link>
  );
}

const S = {
  card: {
    display: 'block', textDecoration: 'none', color: 'inherit',
    background: '#fff', borderRadius: 10,
    boxShadow: '0 2px 10px rgba(120,80,40,0.09)',
    overflow: 'hidden',
    transition: 'transform 0.18s, box-shadow 0.18s',
    cursor: 'pointer',
  },
  imgWrap: {
    position: 'relative',
    paddingBottom: '100%',
    background: 'var(--cream-dark)',
    overflow: 'hidden',
  },
  img: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.25s',
  },
  imgGray: { filter: 'grayscale(40%) opacity(0.7)' },
  oosBadge: {
    position: 'absolute', top: 10, left: 10,
    background: 'rgba(200,100,100,0.85)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5,
  },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    background: 'rgba(255,255,255,0.88)',
    border: 'none', borderRadius: '50%',
    width: 32, height: 32,
    fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    transition: 'transform 0.15s, color 0.15s',
  },
  info: { padding: '12px 14px 14px' },
  name: { fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', marginBottom: 4, lineHeight: 1.4 },
  price: { fontSize: 14, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 },
  stock: { fontSize: 11, fontWeight: 500, marginTop: 4 },
};