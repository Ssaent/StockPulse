import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const stockAPI = {
  search: (query, exchange = 'NSE') =>
    api.get(`/stocks/search?q=${query}&exchange=${exchange}`),
  analyze: (symbol, exchange = 'NSE') =>
    api.post('/analyze', { symbol, exchange }),
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

export default api;