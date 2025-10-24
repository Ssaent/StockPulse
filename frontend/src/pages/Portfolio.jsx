import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, X
} from 'lucide-react';
import { portfolioAPI } from '../services/api';

/* =========================
   RGV primitives
========================= */

function rgvError(e) {
  const s = e?.response?.status;
  if (s === 400) return 'Bad input. Tighten it.';
  if (s === 401) return 'Session dead. Walk back in.';
  if (s === 403) return 'Not your scene.';
  if (s === 404) return 'It doesn’t exist. Stop chasing shadows.';
  if (s === 429) return 'Too many hits. Breathe.';
  if (s >= 500) return 'Server broke character. Try again.';
  if (e?.message?.includes('Network')) return 'Network silent. Plug it back.';
  return 'Operation failed. Do it right.';
}

function NolanShell({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'bg-[radial-gradient(120%_120%_at_80%_-10%,rgba(99,102,241,0.12),rgba(16,19,36,0.92)_40%,rgba(8,10,20,0.98)_75%)]',
        'border border-[rgba(255,255,255,0.10)]',
        'shadow-[0_28px_80px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        'backdrop-blur-[3px]',
        className
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_140px_rgba(0,0,0,0.6)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,215,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage:
            'radial-gradient(120% 120% at 80% -10%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(120% 120% at 80% -10%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, black 100%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function RgvToast({ toast, onClose }) {
  if (!toast) return null;
  const ok = toast.type === 'ok';
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
      <div className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
        ok
          ? 'bg-green-500/15 border-green-400/30 text-green-300'
          : 'bg-red-500/15 border-red-400/30 text-red-300'
      ].join(' ')}>
        <span className="text-sm font-semibold">{toast.message}</span>
        <button onClick={onClose} className="hover:opacity-80">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function RgvConfirm({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <NolanShell className="max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold">Confirm</h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition"
          >
            Do it
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Leave it
          </button>
        </div>
      </NolanShell>
    </div>
  );
}

/* =========================
   Main
========================= */

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, message: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await portfolioAPI.get();
        setPortfolio(res.data);
      } catch (e) {
        setToast({ type: 'err', message: rgvError(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await portfolioAPI.get();
      setPortfolio(res.data);
      setToast({ type: 'ok', message: 'Numbers refreshed. Face them.' });
    } catch (e) {
      setToast({ type: 'err', message: rgvError(e) });
    } finally {
      setRefreshing(false);
    }
  };

  const askRemove = (id) => {
    setConfirm({
      open: true,
      message: 'Remove this holding? Once it exits, it’s out of your story.',
      onConfirm: async () => {
        setConfirm({ open: false, message: '', onConfirm: null });
        try {
          await portfolioAPI.remove(id);
          const res = await portfolioAPI.get();
          setPortfolio(res.data);
          setToast({ type: 'ok', message: 'Cleared. Next shot.' });
        } catch (e) {
          setToast({ type: 'err', message: rgvError(e) });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const summary = portfolio?.summary || { total_investment: 0, current_value: 0, total_pnl: 0, total_pnl_pct: 0 };
  const holdings = portfolio?.holdings || [];

  const pnlColor = summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlPctColor = summary.total_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="min-h-screen">
      <RgvToast toast={toast} onClose={() => setToast(null)} />
      <RgvConfirm
        open={confirm.open}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false, message: '', onConfirm: null })}
      />

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
                <Briefcase className="w-6 h-6 text-purple-300" />
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
        {/* Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <NolanShell>
            <div className="text-sm text-gray-400 mb-1">Total Investment</div>
            <div className="text-3xl font-bold">₹{summary.total_investment.toLocaleString()}</div>
          </NolanShell>
          <NolanShell>
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-3xl font-bold">₹{summary.current_value.toLocaleString()}</div>
          </NolanShell>
          <NolanShell>
            <div className="text-sm text-gray-400 mb-1">Total P&amp;L</div>
            <div className={`text-3xl font-bold ${pnlColor}`}>
              {summary.total_pnl >= 0 ? '+' : ''}₹{summary.total_pnl.toLocaleString()}
            </div>
          </NolanShell>
          <NolanShell>
            <div className="text-sm text-gray-400 mb-1">Returns</div>
            <div className={`text-3xl font-bold flex items-center gap-2 ${pnlPctColor}`}>
              {summary.total_pnl_pct >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
              <span>{summary.total_pnl_pct >= 0 ? '+' : ''}{summary.total_pnl_pct.toFixed(2)}%</span>
            </div>
          </NolanShell>
        </div>

        {/* Holdings */}
        {holdings.length === 0 ? (
          <NolanShell className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No holdings. Empty frame.</h3>
            <p className="text-gray-400 mb-6">Add your positions. Then we talk performance.</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary inline-block">
              Add First Holding
            </button>
          </NolanShell>
        ) : (
          <div className="space-y-4">
            {holdings.map((h) => (
              <NolanShell key={h.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-bold">{h.symbol}</h3>
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm">
                        {h.quantity} shares
                      </span>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Buy Price</div>
                        <div className="font-semibold">₹{Number(h.buy_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Current Price</div>
                        <div className="font-semibold">₹{Number(h.current_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Investment</div>
                        <div className="font-semibold">₹{h.investment.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Current Value</div>
                        <div className="font-semibold">₹{h.current_value.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">P&amp;L</div>
                        <div className={`font-bold ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString()} ({h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    {h.notes && (
                      <div className="mt-2 text-sm text-gray-400">
                        Note: {h.notes}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Bought on: {new Date(h.buy_date).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => askRemove(h.id)}
                    className="ml-4 p-3 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Remove holding"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </NolanShell>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddHoldingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            try {
              const res = await portfolioAPI.get();
              setPortfolio(res.data);
              setToast({ type: 'ok', message: 'Added. Now let it work.' });
            } catch (e) {
              setToast({ type: 'err', message: rgvError(e) });
            } finally {
              setShowAddModal(false);
            }
          }}
          onErr={(e) => setToast({ type: 'err', message: rgvError(e) })}
        />
      )}
    </div>
  );
}

/* =========================
   Add Holding Modal
========================= */

function AddHoldingModal({ onClose, onSuccess, onErr }) {
  const [formData, setFormData] = useState({
    symbol: '',
    exchange: 'NSE',
    quantity: '',
    buy_price: '',
    buy_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const disabled = !formData.symbol || !formData.quantity || !formData.buy_price || !formData.buy_date;

  const submit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      await portfolioAPI.add({
        symbol: formData.symbol.toUpperCase().trim(),
        exchange: formData.exchange,
        quantity: Number(formData.quantity),
        buy_price: Number(formData.buy_price),
        buy_date: formData.buy_date,
        notes: formData.notes?.trim() || ''
      });
      onSuccess();
    } catch (e) {
      onErr(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <NolanShell className="max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-2xl font-bold">Add Holding</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stock Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
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
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows="3"
              placeholder="Long term. Don’t babysit."
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
              disabled={loading || disabled}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add Holding'}
            </button>
          </div>
        </form>
      </NolanShell>
    </div>
  );
}
