import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { newsAPI } from '../services/api';

/* ---------- RGV panel shell (neon-noir, no global CSS) ---------- */
function RgvPanel({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'border border-white/10',
        'shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
        className
      ].join(' ')}
      style={{
        background:
          'radial-gradient(140% 120% at 50% 70%, #0a0c0d 0%, #020303 55%, #000 100%)',
      }}
    >
      {/* Neon ghosts */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-30">
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.40) 0%, transparent 70%)', // crimson
          }}
        />
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.32) 0%, transparent 70%)', // toxic green
          }}
        />
      </div>

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 3px)',
        }}
      />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-soft-light rgv-grain" />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Local keyframes + grain texture */}
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
        @keyframes shimmer { 0% { transform: translateX(-120%);} 100% { transform: translateX(120%);} }
        .animate-rgv-shimmer { animation: shimmer 3.1s ease-in-out infinite; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

/* ---------- Helpers ---------- */
function SentimentIcon({ sentiment }) {
  if (sentiment === 'positive') return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (sentiment === 'negative') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function sentimentFrame(sentiment) {
  switch (sentiment) {
    case 'positive':
      return {
        border: 'border-[rgba(34,197,94,0.35)]',
        bg: 'bg-[rgba(34,197,94,0.12)]',
        text: 'text-green-400',
        pill: 'bg-[rgba(34,197,94,0.20)] text-green-400 border-[rgba(34,197,94,0.35)]',
      };
    case 'negative':
      return {
        border: 'border-[rgba(239,68,68,0.35)]',
        bg: 'bg-[rgba(239,68,68,0.12)]',
        text: 'text-red-400',
        pill: 'bg-[rgba(239,68,68,0.20)] text-red-400 border-[rgba(239,68,68,0.35)]',
      };
    default:
      return {
        border: 'border-[rgba(156,163,175,0.35)]',
        bg: 'bg-[rgba(156,163,175,0.12)]',
        text: 'text-gray-300',
        pill: 'bg-[rgba(156,163,175,0.20)] text-gray-300 border-[rgba(156,163,175,0.35)]',
      };
  }
}

/* ---------- Component ---------- */
export default function StockNews({ symbol, exchange = 'NSE' }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await newsAPI.getStockNews(symbol, exchange, 10);
      setNews(response.data.news || []);
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Failed to load news');
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

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <RgvPanel>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                borderColor: 'rgba(59,130,246,0.30)',
                boxShadow: '0 10px 28px rgba(59,130,246,0.18)',
              }}
            >
              <Newspaper className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Latest News</h4>
              <p className="text-xs text-gray-400">Loading news for {symbol}</p>
            </div>
          </div>
          <div className="h-6 w-28 rounded bg-white/10 animate-rgv-shimmer" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border border-white/10 bg-white/5 animate-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-3 bg_white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </RgvPanel>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <RgvPanel>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                borderColor: 'rgba(59,130,246,0.30)',
              }}
            >
              <Newspaper className="w-6 h-6 text-blue-300" />
            </div>
            <h4 className="text-xl font-bold">Latest News</h4>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center py-10 text-gray-400">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadNews}
            className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 transition-all"
          >
            Try Again
          </button>
        </div>
      </RgvPanel>
    );
  }

  /* ---------- Content ---------- */
  return (
    <RgvPanel>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
              borderColor: 'rgba(59,130,246,0.30)',
              boxShadow: '0 10px 28px rgba(59,130,246,0.18)',
            }}
            title="Stock News"
          >
            <Newspaper className="w-6 h-6 text-blue-300" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            <span className="opacity-70">Symbol:</span>{' '}
            <span className="font-semibold">{symbol}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="text-xl font-bold">Latest News</h4>
          <p className="text-xs text-gray-400">{news.length} articles found</p>
        </div>

        {/* Sentiment KPIs */}
        {news.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg px-3 py-2 text-center border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] border">
              <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-400">{pos}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Positive</div>
            </div>
            <div className="rounded-lg px-3 py-2 text-center border-[rgba(156,163,175,0.35)] bg-[rgba(156,163,175,0.12)] border">
              <Minus className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-300">{neu}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Neutral</div>
            </div>
            <div className="rounded-lg px-3 py-2 text-center border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] border">
              <TrendingDown className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-red-400">{neg}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Negative</div>
            </div>
          </div>
        )}
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-600" />
          <h5 className="text-lg font-semibold mb-2">No recent news found</h5>
          <p className="text-gray-400 mb-4">
            No news articles available for <span className="font-semibold text-white">{symbol}</span> at the moment
          </p>
          <p className="text-sm text-gray-500 mb-4">News updates may take some time to appear in RSS feeds</p>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-blue-300 text-sm transition-all border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Newspaper className="w-4 h-4" />
            View Market News
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {news.map((item, index) => {
            const frame = sentimentFrame(item.sentiment);
            return (
              <a
                key={item.url ?? index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  'block p-4 rounded-xl border transition-all group',
                  frame.border,
                  frame.bg,
                  'hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {/* Sentiment icon */}
                  <div className="flex-shrink-0 mt-1">
                    <SentimentIcon sentiment={item.sentiment} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h5 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h5>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        {/* Source */}
                        <span className="font-medium text-gray-300">{item.source}</span>
                        <span className="text-gray-600">•</span>
                        {/* Time */}
                        <span className="text-gray-400">{item.relative_time}</span>
                        {/* Sentiment badge */}
                        <span className={['px-2 py-0.5 rounded text-xs border', frame.pill].join(' ')}>
                          {(item.sentiment ?? 'neutral').slice(0,1).toUpperCase() + (item.sentiment ?? 'neutral').slice(1)}
                        </span>
                      </div>
                      {/* Read more */}
                      <span className="flex items-center gap-1 text-xs text-blue-300 group-hover:gap-2 transition-all">
                        Read more
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {news.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            to={`/news?symbol=${symbol}`}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Newspaper className="w-4 h-4" />
            View All Market News
          </Link>
        </div>
      )}
    </RgvPanel>
  );
}
