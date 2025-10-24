// frontend/src/components/Alerts.jsx
import React, { useEffect, useState } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown, Trash2, AlertTriangle } from 'lucide-react';

/* ---------------- RGV Shell (neon-noir, NO RAIN) ---------------- */

function RgvPanel({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'border border-white/10',
        'shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
        className,
      ].join(' ')}
      style={{
        background:
          'radial-gradient(140% 120% at 50% 70%, #0a0c0d 0%, #020303 55%, #000 100%)',
      }}
    >
      {/* neon ghosts */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-30">
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.38) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.28) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 3px)',
        }}
      />
      {/* grain */}
      <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light rgv-grain" />
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div className="relative z-10">{children}</div>

      <style>{`
        .rgv-grain {
          background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter>\
<rect width='100%' height='100%' filter='url(%23n)' opacity='0.06'/></svg>");
          background-size: 180px 180px;
          animation: rgvGrain 9s linear infinite;
        }
        @keyframes rgvGrain { 0% { transform: translate(0,0) } 100% { transform: translate(-80px,-60px) } }
      `}</style>
    </div>
  );
}

function NeonPill({ active }) {
  return (
    <span
      className={[
        'px-2 py-1 rounded text-[10px] font-semibold tracking-wide border',
        active
          ? 'bg-green-500/15 text-green-300 border-green-500/30'
          : 'bg-gray-500/10 text-gray-300 border-gray-500/30',
      ].join(' ')}
    >
      {active ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

function NeonToggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <span className="w-12 h-7 rounded-full transition-colors duration-300 bg-white/10 peer-checked:bg-green-500/40 border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
      <span className="absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 peer-checked:translate-x-5" />
    </label>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md">
        <RgvPanel className="p-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </RgvPanel>
      </div>
    </div>
  );
}

/* ---------------- Main: Alerts (same API logic) ---------------- */

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    symbol: '',
    exchange: 'NSE',
    alertType: 'price',
    condition: 'above',
    threshold: '',
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.symbol || !formData.threshold) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase(),
          exchange: formData.exchange,
          alert_type: formData.alertType,
          condition: formData.condition,
          threshold: parseFloat(formData.threshold),
        }),
      });
      if (response.ok) {
        setFormData({
          symbol: '',
          exchange: 'NSE',
          alertType: 'price',
          condition: 'above',
          threshold: '',
        });
        setShowCreateForm(false);
        fetchAlerts();
      } else {
        alert('Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    }
  };

  const toggleAlert = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/alerts/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const deleteAlert = async (id) => {
    if (!confirm('Delete this alert?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 rounded-full border-white/10 border-t-fuchsia-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <RgvPanel>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(255,255,255,0.04))',
                borderColor: 'rgba(59,130,246,0.35)',
                boxShadow: '0 10px 28px rgba(59,130,246,0.22)',
              }}
            >
              <Bell className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Price Alerts</h1>
              <p className="text-xs text-gray-400">Get notified the second it happens.</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 transition"
          >
            <Plus size={18} />
            Create Alert
          </button>
        </div>

        {/* Empty state / List */}
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-gray-400 mb-6">Create your first rule to watch a price/indicator.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300"
            >
              Create your first alert
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => {
              const up = alert.condition === 'above';
              return (
                <div
                  key={alert.id}
                  className={[
                    'rounded-xl p-4 border transition-all',
                    'bg-white/5 border-white/10',
                    'hover:scale-[1.01] hover:shadow-[0_16px_44px_rgba(0,0,0,0.38)]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold">{alert.symbol}</h3>
                        <span className="text-xs text-gray-400">{alert.exchange}</span>
                        <NeonPill active={alert.is_active} />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-300 flex-wrap">
                        {up ? (
                          <TrendingUp className="w-4 h-4 text-green-300" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-300" />
                        )}
                        <span className="capitalize">{alert.alert_type}</span>
                        <span>•</span>
                        <span className="capitalize">{alert.condition}</span>
                        <span>•</span>
                        <span className="font-semibold">
                          {alert.alert_type === 'price' && '₹'}
                          {alert.threshold}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <NeonToggle
                        checked={alert.is_active}
                        onChange={() => toggleAlert(alert.id, alert.is_active)}
                      />
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RgvPanel>

      {/* Create Form Modal */}
      <Modal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Alert"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Symbol */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-300 mb-1">
              Stock Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) =>
                setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="RELIANCE"
            />
          </div>

          {/* Exchange */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-300 mb-1">
              Exchange
            </label>
            <select
              value={formData.exchange}
              onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-300 mb-1">
              Alert Type
            </label>
            <select
              value={formData.alertType}
              onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="price">Price</option>
              <option value="rsi">RSI</option>
              <option value="macd">MACD</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-300 mb-1">
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="equals">Equals</option>
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-300 mb-1">
              Threshold {formData.alertType === 'price' && '(₹)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="2500.00"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 transition"
            >
              Create Alert
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
