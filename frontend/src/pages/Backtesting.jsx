import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';
import { stockAPI } from '../services/api';

export default function Backtesting() {
  const [activeTab, setActiveTab] = useState('7d');
  const [userAnalysisHistory, setUserAnalysisHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's analysis history from backend
  useEffect(() => {
    fetchAnalysisHistory();
  }, [activeTab]);

  const fetchAnalysisHistory = async () => {
    setLoading(true);
    try {
      // Call API to get user's analysis history
      const response = await stockAPI.getAnalysisHistory(activeTab);
      setUserAnalysisHistory(response.data.history || []);
      setFilteredHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
      // Use mock data if API fails
      setUserAnalysisHistory(getMockHistory());
      setFilteredHistory(getMockHistory());
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(userAnalysisHistory);
    } else {
      const filtered = userAnalysisHistory.filter(item =>
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [searchQuery, userAnalysisHistory]);

  // Mock data for demonstration
  const getMockHistory = () => {
    const now = new Date();
    return [
      {
        id: 1,
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        analyzedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        currentPrice: 2456.50,
        analysis: {
          '1week': { target: 2520, change: 2.58, confidence: 72 },
          '1month': { target: 2610, change: 6.25, confidence: 68 },
          '3months': { target: 2750, change: 11.95, confidence: 65 },
          '6months': { target: 2890, change: 17.66, confidence: 62 }
        },
        technical: {
          signal: 'BUY',
          rsi: 58.5,
          macd: 12.3
        }
      },
      {
        id: 2,
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        analyzedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        currentPrice: 3542.80,
        analysis: {
          '1week': { target: 3580, change: 1.05, confidence: 70 },
          '1month': { target: 3650, change: 3.03, confidence: 67 },
          '3months': { target: 3720, change: 5.00, confidence: 64 },
          '6months': { target: 3800, change: 7.26, confidence: 60 }
        },
        technical: {
          signal: 'HOLD',
          rsi: 52.3,
          macd: 5.2
        }
      },
      {
        id: 3,
        symbol: 'INFY',
        name: 'Infosys Limited',
        analyzedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        currentPrice: 1456.20,
        analysis: {
          '1week': { target: 1440, change: -1.11, confidence: 69 },
          '1month': { target: 1480, change: 1.63, confidence: 66 },
          '3months': { target: 1520, change: 4.38, confidence: 63 },
          '6months': { target: 1590, change: 9.19, confidence: 59 }
        },
        technical: {
          signal: 'HOLD',
          rsi: 48.7,
          macd: -2.1
        }
      }
    ];
  };

  const tabs = [
    { id: '7d', label: 'Last 7 Days', days: 7 },
    { id: '30d', label: 'Last 30 Days', days: 30 },
    { id: '90d', label: 'Last 3 Months', days: 90 },
    { id: 'all', label: 'All Time', days: null }
  ];

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getAnalysisPeriodLabel = (period) => {
    const labels = {
      '1week': '1 Week',
      '1month': '1 Month',
      '3months': '3 Months',
      '6months': '6 Months'
    };
    return labels[period] || period;
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'SELL':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="engineered-glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="page-header">
            <div className="page-header-left">
              <Link
                to="/dashboard"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 material-transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="page-header-title text-amber-50">
                  Analysis History
                </h1>
                <p className="page-header-subtitle">Track your stock analyses</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">
                    {filteredHistory.length} Analyses
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks..."
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading analysis history...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Analysis History</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? `No results found for "${searchQuery}"`
                : 'Start analyzing stocks to see your analysis history'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition"
            >
              <Search className="w-5 h-5" />
              Analyze Stocks
            </Link>
          </div>
        )}

        {/* Analysis History Cards */}
        {!loading && filteredHistory.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                {/* Stock Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{analysis.symbol}</h3>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${getSignalColor(
                          analysis.technical.signal
                        )}`}
                      >
                        {analysis.technical.signal}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{analysis.name}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ₹{analysis.currentPrice.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(analysis.analyzedAt)}
                    </div>
                  </div>
                </div>

                {/* Predictions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {Object.entries(analysis.analysis).map(([period, pred]) => (
                    <div
                      key={period}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400 uppercase">
                          {getAnalysisPeriodLabel(period)}
                        </span>
                      </div>
                      <div className="text-xl font-bold mb-1">₹{pred.target}</div>
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          pred.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {pred.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {pred.change >= 0 ? '+' : ''}
                        {pred.change}%
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Confidence: {pred.confidence}%
                      </div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${pred.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical Indicators */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">RSI:</span>
                    <span className="font-semibold">{analysis.technical.rsi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">MACD:</span>
                    <span className="font-semibold">{analysis.technical.macd}</span>
                  </div>
                  <div className="ml-auto">
                    <Link
                      to="/dashboard"
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Analyze Again →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/5 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">About Analysis History</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your analysis history shows all stocks you've analyzed with their AI-powered
                analysis. Each entry includes price targets for different time periods and
                technical indicators. Use this to track your analysis accuracy over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}