import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { watchlistAPI, stockAPI } from '../services/api';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await watchlistAPI.get();
      setWatchlist(response.data.watchlist || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWatchlist();
    setRefreshing(false);
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this stock from watchlist?')) return;

    try {
      await watchlistAPI.remove(id);
      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove stock');
    }
  };

  const handleAnalyze = (symbol) => {
    // Navigate to dashboard with stock
    window.location.href = `/dashboard?symbol=${symbol}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                <h1 className="text-2xl font-bold">Watchlist</h1>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total Stocks</div>
            <div className="text-3xl font-bold">{watchlist.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Gainers</div>
            <div className="text-3xl font-bold text-green-400">
              {watchlist.filter(s => s.change > 0).length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Losers</div>
            <div className="text-3xl font-bold text-red-400">
              {watchlist.filter(s => s.change < 0).length}
            </div>
          </div>
        </div>

        {/* Watchlist Grid */}
        {watchlist.length === 0 ? (
          <div className="card text-center py-12">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-6">Search for stocks in the dashboard and add them to your watchlist</p>
            <Link to="/dashboard" className="btn-primary inline-block">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((stock) => (
              <div key={stock.id} className="card hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{stock.symbol}</h3>
                    <p className="text-sm text-gray-400">{stock.exchange}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(stock.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold mb-1">
                    ₹{stock.current_price || '---'}
                  </div>
                  {stock.change !== undefined && (
                    <div className={`flex items-center gap-1 text-lg font-semibold ${
                      stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stock.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span>{stock.changePercent || `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAnalyze(stock.symbol)}
                  className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all"
                >
                  Analyze with AI
                </button>

                <div className="mt-3 text-xs text-gray-400">
                  Added: {new Date(stock.added_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}