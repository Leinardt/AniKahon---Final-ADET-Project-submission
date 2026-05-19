import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Auth
export const registerUser    = (data)       => API.post('/register/', data);
export const loginUser       = (data)       => API.post('/login/', data);
export const loginAdmin      = (data)       => API.post('/admin/login/', data);

// Products
export const getProducts = (category, sort = '') => 
  API.get('/products/', { params: { category, sort } });
export const getProduct      = (id)         => API.get(`/products/${id}/`);
export const getCategories   = ()           => API.get('/categories/');

// Cart
export const getCart         = (userID)     => API.get(`/cart/${userID}/`);
export const addToCart       = (data)       => API.post('/cart/add/', data);
export const updateCartItem  = (id, qty)    => API.put(`/cart/item/${id}/`, { quantity: qty });
export const removeCartItem  = (id)         => API.delete(`/cart/item/${id}/remove/`);

// Favorites
export const getFavorites    = (userID)     => API.get(`/favorites/${userID}/`);
export const toggleFavorite  = (data)       => API.post('/favorites/toggle/', data);

// Voucher
export const applyVoucher = (data) => API.post('/voucher/apply/', data);
// Vouchers - Available for customer
export const getAvailableVouchers = (userID, paymentMethod = 'both') => 
  API.get(`/vouchers/available/${userID}/?payment_method=${paymentMethod}`);

// Orders
export const placeOrder      = (data)       => API.post('/orders/place/', data);
export const getOrders       = (userID)     => API.get(`/orders/${userID}/`);
export const cancelOrder     = (orderID)    => API.put(`/orders/${orderID}/cancel/`);

// User
export const getUserProfile  = (userID)     => API.get(`/user/${userID}/`);
export const updateProfile = (userID, data) => API.put(`/user/${userID}/`, data);

// Admin
export const adminGetOrders  = ()           => API.get('/admin/orders/');
export const adminUpdateOrder= (id, data)   => API.put(`/admin/orders/${id}/update/`, data);
export const adminGetProducts= ()           => API.get('/admin/products/');
export const adminAddProduct = (data)       => API.post('/admin/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminEditProduct= (id, data)   => API.put(`/admin/products/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteProduct = (id, adminID) => API.delete(`/admin/products/${id}/`, { data: { adminID } });
export const adminGetVouchers= ()           => API.get('/admin/vouchers/');
export const adminAddVoucher = (data)       => API.post('/admin/vouchers/', data);
export const adminUpdateVoucher = (id, data) => API.put(`/admin/vouchers/${id}/`, data);
export const adminDeleteVoucher = (id, aID)=> API.delete(`/admin/vouchers/${id}/`, { data: { adminID: aID } });
export const adminGetReports = (params)     => API.get('/admin/reports/', { params });

// GabAI
export const sendGabaiMessage = (message, history = []) =>
  API.post('/gabai/chat/', { message, history });
