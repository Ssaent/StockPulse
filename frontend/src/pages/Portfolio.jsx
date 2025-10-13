import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { portfolioAPI } from '../services/api';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const response = await portfolioAPI.get();
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this holding from portfolio?')) return;

    try {
      await portfolioAPI.remove(id);
      await loadPortfolio();
    } catch (error) {
      console.error('Error removing holding:', error);
      alert('Failed to remove holding');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const summary = portfolio?.summary || { total_investment: 0, current_value: 0, total_pnl: 0, total_pnl_pct: 0 };
  const holdings = portfolio?.holdings || [];

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
                <Briefcase className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold">Portfolio</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 btn-primary"
              >
                <Plus className="w-5 h-5" />
                <span>Add Holding</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Portfolio Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total Investment</div>
            <div className="text-3xl font-bold">₹{summary.total_investment.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-3xl font-bold">₹{summary.current_value.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total P&L</div>
            <div className={`text-3xl font-bold ${summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.total_pnl >= 0 ? '+' : ''}₹{summary.total_pnl.toLocaleString()}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Returns</div>
            <div className={`text-3xl font-bold flex items-center gap-2 ${summary.total_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.total_pnl_pct >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
              <span>{summary.total_pnl_pct >= 0 ? '+' : ''}{summary.total_pnl_pct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Holdings */}
        {holdings.length === 0 ? (
          <div className="card text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your portfolio is empty</h3>
            <p className="text-gray-400 mb-6">Add your stock holdings to track your investments and P&L</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary inline-block">
              Add First Holding
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {holdings.map((holding) => (
              <div key={holding.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-bold">{holding.symbol}</h3>
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm">
                        {holding.quantity} shares
                      </span>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Buy Price</div>
                        <div className="font-semibold">₹{holding.buy_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Current Price</div>
                        <div className="font-semibold">₹{holding.current_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Investment</div>
                        <div className="font-semibold">₹{holding.investment.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Current Value</div>
                        <div className="font-semibold">₹{holding.current_value.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">P&L</div>
                        <div className={`font-bold ${holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toLocaleString()} ({holding.pnl_pct >= 0 ? '+' : ''}{holding.pnl_pct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    {holding.notes && (
                      <div className="mt-2 text-sm text-gray-400">
                        Note: {holding.notes}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Bought on: {new Date(holding.buy_date).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(holding.id)}
                    className="ml-4 p-3 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <AddHoldingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadPortfolio();
          }}
        />
      )}
    </div>
  );
}

// Add Holding Modal Component
function AddHoldingModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    symbol: '',
    exchange: 'NSE',
    quantity: '',
    buy_price: '',
    buy_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await portfolioAPI.add(formData);
      onSuccess();
    } catch (error) {
      console.error('Error adding holding:', error);
      alert('Failed to add holding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="card max-w-md w-full">
        <h3 className="text-2xl font-bold mb-6">Add Holding</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stock Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
              className="input"
              placeholder="e.g., RELIANCE"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="input"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buy Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.buy_price}
                onChange={(e) => setFormData({...formData, buy_price: e.target.value})}
                className="input"
                placeholder="2400.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Buy Date</label>
            <input
              type="date"
              value={formData.buy_date}
              onChange={(e) => setFormData({...formData, buy_date: e.target.value})}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input"
              rows="3"
              placeholder="Long term investment..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 glass rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}