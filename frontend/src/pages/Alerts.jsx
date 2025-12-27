import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { alertsAPI, stockAPI } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [condition, setCondition] = useState('above');
  const [threshold, setThreshold] = useState('');

  // Stock search states
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stockName, setStockName] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Search stocks as user types
  useEffect(() => {
    const searchStocks = async () => {
      if (symbol.length < 2) {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }

      setSearching(true);
      try {
        const res = await stockAPI.search(symbol, exchange);
        setSearchResults(res.data.results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(searchStocks, 300);
    return () => clearTimeout(timer);
  }, [symbol, exchange]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertsAPI.getAll();
      setAlerts(res.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (stock) => {
    setSymbol(stock.symbol);
    setStockName(stock.name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!symbol.trim()) {
      alert('Please enter a stock symbol');
      return;
    }

    if (!threshold || isNaN(threshold) || Number(threshold) <= 0) {
      alert('Please enter a valid target price');
      return;
    }

    // Verify stock exists
    try {
      const res = await stockAPI.search(symbol, exchange);
      const stockExists = res.data.results?.some(
        (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (!stockExists) {
        alert(`Stock "${symbol}" not found in ${exchange}. Please select from suggestions.`);
        return;
      }
    } catch (error) {
      alert('Error validating stock. Please try again.');
      return;
    }

    try {
      await alertsAPI.create({
        symbol: symbol.toUpperCase(),
        exchange,
        alert_type: 'price',
        condition,
        threshold: Number(threshold),
      });

      alert('Alert created successfully!');
      setShowForm(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      alert(error.response?.data?.error || 'Failed to create alert');
    }
  };

  const resetForm = () => {
    setSymbol('');
    setStockName('');
    setExchange('NSE');
    setCondition('above');
    setThreshold('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;

    try {
      await alertsAPI.delete(id);
      setAlerts(alerts.filter((a) => a.id !== id));
      alert('Alert deleted successfully!');
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">
              <Bell className="w-8 h-8 text-amber-400" />
              Price Alerts
            </h1>
            <p className="page-header-subtitle">Get notified when stocks hit your target price</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Alert
          </button>
        </div>

        {/* Create Alert Form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 mb-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6">Create New Alert</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Stock Symbol with Search */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Stock Symbol / Name
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => {
                      setSymbol(e.target.value.toUpperCase());
                      setStockName('');
                    }}
                    onFocus={() => symbol.length >= 2 && setShowSuggestions(true)}
                    placeholder="Search stock (e.g., RELIANCE, TCS)"
                    className="input"
                    required
                  />
                  {stockName && (
                    <p className="text-xs text-green-400 mt-1">✓ {stockName}</p>
                  )}

                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full lightly-luminous max-h-60 overflow-auto">
                      {searchResults.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => handleStockSelect(stock)}
                          className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 transition"
                        >
                          <div className="font-bold text-white">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searching && (
                    <p className="text-xs text-gray-400 mt-1">Searching...</p>
                  )}

                  {symbol.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs text-red-400 mt-1">No stocks found</p>
                  )}
                </div>

                {/* Exchange */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Exchange
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setExchange('NSE')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition font-medium ${
                        exchange === 'NSE'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                      title="National Stock Exchange"
                    >
                      NSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('BSE')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition font-medium ${
                        exchange === 'BSE'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                      title="Bombay Stock Exchange"
                    >
                      BSE
                    </button>
                  </div>
                </div>

                {/* Condition - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Alert When Price Goes
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCondition('above')}
                      className={`px-6 py-4 rounded-lg border-2 transition font-semibold flex items-center justify-center gap-2 ${
                        condition === 'above'
                          ? 'bg-green-500/30 border-green-400 text-green-200 shadow-lg shadow-green-500/20'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:border-green-400/50 hover:text-green-300'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Above Target
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('below')}
                      className={`px-6 py-4 rounded-lg border-2 transition font-semibold flex items-center justify-center gap-2 ${
                        condition === 'below'
                          ? 'bg-red-500/30 border-red-400 text-red-200 shadow-lg shadow-red-500/20'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:border-red-400/50 hover:text-red-300'
                      }`}
                    >
                      <TrendingDown className="w-5 h-5" />
                      Below Target
                    </button>
                  </div>
                </div>

                {/* Target Price - No Arrows */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Target Price (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={threshold}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = value.split('.');
                      if (parts.length > 2) return;
                      setThreshold(value);
                    }}
                    placeholder="e.g., 1500.50"
                    className="input text-2xl font-bold"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    You'll be notified when {symbol || 'the stock'} reaches this price
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Create Alert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-semibold border border-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No alerts yet</h3>
            <p className="text-gray-400 mb-6">Create your first alert to get notified about stock movements</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="glass rounded-xl p-6 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon based on condition */}
                    <div
                      className={`p-3 rounded-lg ${
                        alert.condition === 'above'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {alert.condition === 'above' ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-6 h-6" />
                      )}
                    </div>

                    {/* Alert Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{alert.symbol}</h3>
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded">
                          {alert.exchange}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            alert.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        Alert when price goes{' '}
                        <span className={`font-semibold ${
                          alert.condition === 'above' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {alert.condition}
                        </span>{' '}
                        <span className="font-bold text-white text-lg">
                          ₹{Number(alert.threshold).toLocaleString('en-IN')}
                        </span>
                      </p>
                      {alert.triggered_at && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Triggered: {new Date(alert.triggered_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
