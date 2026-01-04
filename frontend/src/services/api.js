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
  register: (name, email, username, password) => api.post('/auth/register', { name, email, username, password }),  // ✅ FIXED: Added name
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

export const marketAPI = {
  getLivePrice: (symbol, exchange = 'NSE') =>
    api.get(`/market/live-price?symbol=${symbol}&exchange=${exchange}`),
  getChartData: (symbol, exchange = 'NSE', period = '1d', interval = '15m') =>
    api.get(`/market/chart?symbol=${symbol}&exchange=${exchange}&period=${period}&interval=${interval}`),
  getIndices: () =>
    api.get('/market/indices'),
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

// Chart Configuration - Enterprise Grade
export const CHART_CONFIG = {
  // Symbol configurations
  symbols: {
    nifty: {
      ticker: '^NSEI',
      name: 'NIFTY 50',
      exchange: 'NSE',
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    }
  },

  // Chart intervals
  intervals: {
    intraday: '15m',
    daily: '1d',
    weekly: '1wk'
  },

  // Refresh behavior
  refresh: {
    onLoadOnly: true,        // Only fetch on page load
    manualRefresh: true,     // Allow user to refresh manually
    backgroundSync: false,   // No continuous polling
    cacheTimeout: 5 * 60 * 1000  // 5 minutes cache
  },

  // Styling configuration
  styling: {
    colors: {
      primary: '#06b6d4',
      tooltip: 'text-cyan-400',
      error: 'text-red-400',
      success: 'text-green-400'
    },
    animations: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // Error handling
  errors: {
    retryAttempts: 3,
    retryDelay: 1000,  // 1 second base delay
    timeout: 10000     // 10 second timeout
  }
};

// Environment-based API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : process.env.REACT_APP_API_URL || 'https://api.stockpulse.com';
  }
  return 'http://localhost:5000/api';
};

export { getApiUrl };
export default api;