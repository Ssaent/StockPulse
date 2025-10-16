import React, { useState, useEffect } from 'react';
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

export default function StockNews({ symbol, exchange = 'NSE' }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
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

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/10';
      case 'negative':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getSentimentBadge = (sentiment) => {
    const colors = {
      positive: 'bg-green-500/20 text-green-400 border-green-500/30',
      negative: 'bg-red-500/20 text-red-400 border-red-500/30',
      neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    return colors[sentiment] || colors.neutral;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Latest News</h4>
              <p className="text-sm text-gray-400">Loading news for {symbol}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-xl font-bold">Latest News</h4>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadNews}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Latest News</h4>
            <p className="text-sm text-gray-400">{news.length} articles found</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sentiment Summary */}
      {news.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass p-3 rounded-lg text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">
              {news.filter((n) => n.sentiment === 'positive').length}
            </div>
            <div className="text-xs text-gray-400">Positive</div>
          </div>
          <div className="glass p-3 rounded-lg text-center">
            <Minus className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-400">
              {news.filter((n) => n.sentiment === 'neutral').length}
            </div>
            <div className="text-xs text-gray-400">Neutral</div>
          </div>
          <div className="glass p-3 rounded-lg text-center">
            <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">
              {news.filter((n) => n.sentiment === 'negative').length}
            </div>
            <div className="text-xs text-gray-400">Negative</div>
          </div>
        </div>
      )}

      {/* News List */}
      {news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-600" />
          <h5 className="text-lg font-semibold mb-2">No recent news found</h5>
          <p className="text-gray-400 mb-4">
            No news articles available for{' '}
            <span className="font-semibold text-white">{symbol}</span> at the
            moment
          </p>
          <p className="text-sm text-gray-500 mb-4">
            News updates may take some time to appear in RSS feeds
          </p>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-all"
          >
            <Newspaper className="w-4 h-4" />
            View Market News
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {news.map((item, index) => (
            <a
              key={item.url ?? index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-4 rounded-lg border ${getSentimentColor(
                item.sentiment
              )} hover:scale-[1.02] transition-all group`}
            >
              <div className="flex items-start gap-3">
                {/* Sentiment Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getSentimentIcon(item.sentiment)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h5 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h5>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      {/* Source */}
                      <span className="font-medium text-gray-300">
                        {item.source}
                      </span>

                      <span className="text-gray-600">•</span>

                      {/* Time */}
                      <span className="text-gray-400">
                        {item.relative_time}
                      </span>

                      {/* Sentiment Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getSentimentBadge(
                          item.sentiment
                        )}`}
                      >
                        {(item.sentiment ?? 'neutral')
                          .charAt(0)
                          .toUpperCase() +
                          (item.sentiment ?? 'neutral').slice(1)}
                      </span>
                    </div>

                    {/* Read More */}
                    <span className="flex items-center gap-1 text-xs text-blue-400 group-hover:gap-2 transition-all">
                      Read more
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* View All Link */}
      {news.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            to={`/news?symbol=${symbol}`}
            className="flex items-center justify-center gap-2 px-4 py-2 glass hover:bg-white/10 rounded-lg transition-all text-sm font-medium"
          >
            <Newspaper className="w-4 h-4" />
            View All Market News
          </Link>
        </div>
      )}
    </div>
  );
}

// Custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;
document.head.appendChild(style);
