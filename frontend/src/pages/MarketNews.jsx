import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import { newsAPI } from '../services/api';

export default function MarketNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const response = await newsAPI.getMarketNews(30);
      setNews(response.data.news || []);
    } catch (error) {
      console.error('Error loading market news:', error);
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
    switch(sentiment) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/10';
      case 'negative':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
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
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total Articles</div>
            <div className="text-3xl font-bold">{news.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Positive</div>
            <div className="text-3xl font-bold text-green-400">
              {news.filter(n => n.sentiment === 'positive').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Negative</div>
            <div className="text-3xl font-bold text-red-400">
              {news.filter(n => n.sentiment === 'negative').length}
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`card hover:scale-105 transition-transform border ${getSentimentColor(item.sentiment)}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                  {getSentimentIcon(item.sentiment)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold mb-2 line-clamp-3 hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/10">
                <div>
                  <span className="font-medium text-gray-400">{item.source}</span>
                  <span className="mx-2">•</span>
                  <span>{item.relative_time}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
