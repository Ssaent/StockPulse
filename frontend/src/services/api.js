import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
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

export default api;