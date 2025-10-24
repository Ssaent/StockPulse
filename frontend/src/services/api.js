import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Important for CORS
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

// Response interceptor - Handle errors but DON'T auto-logout on every error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 (Unauthorized) for auth endpoints
    if (error.response?.status === 401 && error.config.url.includes('/auth/me')) {
      console.log('Token expired, clearing auth');
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const stockAPI = {
  search: (query, exchange = 'NSE') => api.get(`/stocks/search?q=${query}&exchange=${exchange}`),
  analyze: (symbol, exchange = 'NSE') => api.post('/analyze', { symbol, exchange }),
  getList: (exchange) => api.get(`/stocks/list/${exchange}`),
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
