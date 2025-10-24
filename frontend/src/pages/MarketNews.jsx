// frontend/src/pages/MarketNews.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { newsAPI } from '../services/api';

/* ---------- RGV helpers ---------- */
function rgvError(e) {
  const s = e?.response?.status;
  const msg = e?.response?.data?.error || e?.message || '';
  if (s === 400) return 'Bad request. Clean it up and try again.';
  if (s === 401) return "You’re not signed in. Fix that.";
  if (s === 403) return "Access denied. Wrong door.";
  if (s === 404) return 'Source not found. Someone moved the signboard.';
  if (s === 422) return 'Invalid input. Keep it tight.';
  if (s === 429) return 'Too many hits. Take a breath.';
  if (s >= 500) return "Server’s having a bad day. It’s on us.";
  if (!s && msg.toLowerCase().includes('network')) return 'No signal. Check your connection.';
  return msg || 'Couldn’t fetch the news. Try again.';
}

/* ---------- Tiny UI primitives (no-rain neon-noir) ---------- */
function Shell({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'bg-[radial-gradient(120%_120%_at_80%_-10%,rgba(99,102,241,0.12),rgba(16,19,36,0.92)_40%,rgba(8,10,20,0.98)_75%)]',
        'border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        'backdrop-blur-[3px]',
        className
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_140px_rgba(0,0,0,0.55)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
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

function Stat({ label, value, highlight }) {
  return (
    <Shell>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={['text-3xl font-bold', highlight || ''].join(' ')}>{value}</div>
    </Shell>
  );
}

function sentimentFrame(sentiment) {
  switch (sentiment) {
    case 'positive':
      return {
        border: 'border-green-500/30',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        pill: 'bg-green-500/20 text-green-400 border-green-500/30',
      };
    case 'negative':
      return {
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        pill: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
    default:
      return {
        border: 'border-gray-500/30',
        bg: 'bg-gray-500/10',
        text: 'text-gray-300',
        pill: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
  }
}

function SentimentIcon({ sentiment }) {
  if (sentiment === 'positive') return <TrendingUp className="w-5 h-5 text-green-400" />;
  if (sentiment === 'negative') return <TrendingDown className="w-5 h-5 text-red-400" />;
  return <Minus className="w-5 h-5 text-gray-400" />;
}

/* ---------- Main ---------- */
export default function MarketNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | positive | neutral | negative

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await newsAPI.getMarketNews(30);
      setNews(response.data.news || []);
    } catch (e) {
      console.error('Error loading market news:', e);
      setError(rgvError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const pos = useMemo(() => news.filter(n => n.sentiment === 'positive').length, [news]);
  const neu = useMemo(() => news.filter(n => n.sentiment === 'neutral').length, [news]);
  const neg = useMemo(() => news.filter(n => n.sentiment === 'negative').length, [news]);

  const filtered = useMemo(() => {
    if (filter === 'all') return news;
    return news.filter(n => (n.sentiment || 'neutral') === filter);
  }, [news, filter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
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
                <Newspaper className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold">Market News</h1>
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
        {/* Error (RGV voice) */}
        {error && (
          <Shell className="mb-6 border-red-500/30">
            <div className="text-red-300 text-sm">{error}</div>
          </Shell>
        )}

        {/* Stats + Filters */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Stat label="Total Articles" value={news.length} />
          <Stat label="Positive" value={pos} highlight="text-green-400" />
          <Stat label="Negative" value={neg} highlight="text-red-400" />
        </div>

        <Shell className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All', count: news.length },
              { key: 'positive', label: 'Positive', count: pos },
              { key: 'neutral', label: 'Neutral', count: neu },
              { key: 'negative', label: 'Negative', count: neg },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  filter === t.key
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-400/30 shadow-[0_6px_20px_rgba(124,58,237,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
                ].join(' ')}
              >
                {t.label} <span className="opacity-70 ml-1">({t.count})</span>
              </button>
            ))}
          </div>
        </Shell>

        {/* News Grid */}
        {filtered.length === 0 ? (
          <Shell className="text-center py-12">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-40 text-gray-500" />
            <h5 className="text-lg font-semibold mb-2">No stories match this filter</h5>
            <p className="text-gray-400">Try switching the sentiment or hit Refresh.</p>
          </Shell>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, index) => {
              const frame = sentimentFrame(item.sentiment);
              return (
                <a
                  key={item.url ?? index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'block p-5 rounded-2xl transition-transform',
                    'hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
                    'border',
                    frame.border,
                    frame.bg,
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                      <SentimentIcon sentiment={item.sentiment} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-2 line-clamp-3 group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-3">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-300">{item.source}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">{item.relative_time}</span>
                      <span className={['px-2 py-0.5 rounded text-xs border', frame.pill].join(' ')}>
                        {(item.sentiment ?? 'neutral').slice(0,1).toUpperCase() + (item.sentiment ?? 'neutral').slice(1)}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-300" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
