import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { watchlistAPI, stockAPI } from '../services/api';

/* ---------------- RGV Primitives (visual only) ---------------- */

function RgvShell({ className = '', children }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'bg-[radial-gradient(120%_120%_at_80%_-10%,rgba(99,102,241,0.12),rgba(16,19,36,0.95)_40%,rgba(8,10,20,0.98)_80%)]',
        'border border-[rgba(255,215,0,0.12)]',
        'shadow-[0_24px_80px_rgba(0,0,0,0.60),inset_0_0_0_1px_rgba(255,215,0,0.08)]',
        'backdrop-blur-[3px]',
        className,
      ].join(' ')}
    >
      {/* soft vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_160px_rgba(0,0,0,0.55)]" />
      {/* faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,215,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.12) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage:
            'radial-gradient(120% 120% at 80% -10%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(120% 120% at 80% -10%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, black 100%)',
        }}
      />
      {/* shimmer sweep */}
      <div className="pointer-events-none absolute -inset-x-2 -inset-y-10 animate-rgv-shimmer bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.07)_50%,transparent_80%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function RgvStat({ label, value, accent }) {
  return (
    <RgvShell className="p-5">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-extrabold ${accent ?? ''}`}>{value}</div>
    </RgvShell>
  );
}

function RgvPill({ positive, children }) {
  const base =
    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
  return (
    <span
      className={[
        base,
        positive
          ? 'bg-green-500/12 border-green-500/30 text-green-400'
          : 'bg-red-500/12 border-red-500/30 text-red-400',
      ].join(' ')}
    >
      {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

/* ---------------- Component (logic unchanged) ---------------- */

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
      setWatchlist(watchlist.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove stock');
    }
  };

  const handleAnalyze = (symbol) => {
    window.location.href = `/dashboard?symbol=${symbol}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(120%_120%_at_80%_-10%,#1f2438,#0b0e19)]">
        <div className="relative">
          <div className="animate-spin w-14 h-14 border-4 border-blue-500/60 border-t-transparent rounded-full"></div>
          <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(8,10,20,0.65)] backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shadow-[0_10px_30px_rgba(250,204,21,0.15)]">
                  <Star className="w-5 h-5 text-yellow-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Refresh"
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
          <RgvStat label="Total Stocks" value={watchlist.length} />
          <RgvStat
            label="Gainers"
            value={watchlist.filter((s) => s.change > 0).length}
            accent="text-green-400"
          />
          <RgvStat
            label="Losers"
            value={watchlist.filter((s) => s.change < 0).length}
            accent="text-red-400"
          />
        </div>

        {/* Watchlist Grid */}
        {watchlist.length === 0 ? (
          <RgvShell className="text-center py-14">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
              <Star className="w-8 h-8 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-6">
              Search for stocks in the dashboard and add them to your watchlist
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
            >
              Go to Dashboard
            </Link>
          </RgvShell>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((stock) => {
              const up = Number(stock.change) >= 0;
              return (
                <RgvShell key={stock.id} className="hover:scale-[1.01] transition-transform">
                  {/* accent orb */}
                  <div
                    className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl opacity-25"
                    style={{
                      background: up
                        ? 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)',
                    }}
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight">{stock.symbol}</h3>
                      <p className="text-sm text-gray-400">{stock.exchange}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(stock.id)}
                      className="p-2 rounded-lg hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl font-extrabold mb-1">
                      ₹{stock.current_price ?? '—'}
                    </div>

                    {stock.change !== undefined && (
                      <div className="flex items-center gap-2">
                        <RgvPill positive={up}>
                          {stock.changePercent ||
                            `${up ? '+' : ''}${Number(stock.change).toFixed(2)}%`}
                        </RgvPill>
                        <span className="text-xs text-gray-500">
                          {new Date(stock.added_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleAnalyze(stock.symbol)}
                    className="w-full px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 font-medium transition-all"
                  >
                    Analyze with AI
                  </button>
                </RgvShell>
              );
            })}
          </div>
        )}
      </div>

      {/* Local keyframes (no global Tailwind edits required) */}
      <style>{`
        @keyframes rgvShimmer { 0% { transform: translateX(-120%);} 100% { transform: translateX(120%);} }
        .animate-rgv-shimmer { animation: rgvShimmer 3.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
