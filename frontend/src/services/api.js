import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url.includes('/auth/me')) {
      console.log('Token expired, clearing auth');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }), // ✅ FIXED: Added name
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }), // ✅ ADDED
  resendOTP: (email) => api.post('/auth/resend-otp', { email }), // ✅ ADDED
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }), // ✅ ADDED
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, new_password: newPassword }), // ✅ ADDED
  changePassword: (data) => api.post('/auth/change-password', data), // ✅ ADDED
};

export const stockAPI = {
  search: (query, exchange = 'NSE') =>
    api.get(`/stocks/search?q=${query}&exchange=${exchange}`),
  analyze: (symbol, exchange = 'NSE') =>
    api.post('/analyze', { symbol, exchange }),
  getList: (exchange) =>
    api.get(`/stocks/list/${exchange}`),

  // NEW: Analysis history endpoints
  getAnalysisHistory: (period = '7d') =>
    api.get(`/analysis-history?period=${period}`),
  saveAnalysis: (analysisData) =>
    api.post('/save-analysis', analysisData),
};

export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (symbol, exchange) => api.post('/watchlist', { symbol, exchange }),
  remove: (id) => api.delete(`/watchlist/${id}`),
};

export const portfolioAPI = {
  get: () => api.get('/portfolio'),
  add: (holding) => api.post('/portfolio', holding),
  remove: (id) => api.delete(`/portfolio/${id}`),
};

export const alertsAPI = {
  get: () => api.get('/alerts'),
  create: (alert) => api.post('/alerts', alert),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const newsAPI = {
  getStockNews: (symbol, exchange = 'NSE', limit = 10) =>
    api.get(`/news/stock/${symbol}?exchange=${exchange}&limit=${limit}`),
  getMarketNews: (limit = 20) =>
    api.get(`/news/market?limit=${limit}`),
};

export const corporateAPI = {
  getActions: (symbol, exchange = 'NSE') =>
    api.get(`/corporate-actions/${symbol}?exchange=${exchange}`),
};

export const backtestAPI = {
  getStats: (timeframe, days = 30) => {
    const params = new URLSearchParams();
    if (timeframe && timeframe !== 'all') params.append('timeframe', timeframe);
    params.append('days', days);
    return api.get(`/backtest/stats?${params.toString()}`);
  },
  getRecentPredictions: (limit = 20) =>
    api.get(`/backtest/recent?limit=${limit}`),
  validateNow: () =>
    api.post('/backtest/validate'),
};

export default api;