import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StockNews from '../components/StockNews';
import CorporateActions from '../components/CorporateActions';
import StockChart from '../components/StockChart';
import { Search, TrendingUp, LogOut, Star, Briefcase, BarChart3, Activity, Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { stockAPI, watchlistAPI } from '../services/api';
import { StockAnalysisSkeleton } from '../components/LoadingSkeleton';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await stockAPI.search(query, 'NSE');
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (symbol) => {
    setAnalyzing(true);
    setSearchResults([]);

    try {
      const response = await stockAPI.analyze(symbol, 'NSE');
      setSelectedStock(response.data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze stock. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                StockPulse
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/news" className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all">
                <Newspaper className="w-5 h-5" />
                <span className="hidden md:inline">News</span>
              </Link>
              <Link to="/watchlist" className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all">
                <Star className="w-5 h-5" />
                <span className="hidden md:inline">Watchlist</span>
              </Link>
              <Link to="/portfolio" className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all">
                <Briefcase className="w-5 h-5" />
                <span className="hidden md:inline">Portfolio</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.email}!</h2>
          <p className="text-gray-400">Search and analyze stocks with AI-powered predictions</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Market Status</div>
                <div className="text-2xl font-bold text-green-400">Open</div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">NIFTY 50</div>
                <div className="text-2xl font-bold">19,425.35</div>
                <div className="text-sm text-green-400">+0.82%</div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">SENSEX</div>
                <div className="text-2xl font-bold">65,280.45</div>
                <div className="text-sm text-green-400">+1.05%</div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search NSE stocks... (e.g., RELIANCE, TCS, INFY)"
              className="input pl-12"
            />
          </div>

          {/* Popular Stocks */}
          <div className="card mb-8">
            <h4 className="text-lg font-semibold mb-4">Popular Stocks</h4>
            <div className="flex flex-wrap gap-2">
              {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC'].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => handleAnalyze(symbol)}
                  className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-all text-sm font-medium"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleAnalyze(stock.symbol)}
                  className="p-4 glass rounded-lg hover:bg-white/10 cursor-pointer transition-all"
                >
                  <div className="font-bold">{stock.symbol}</div>
                  <div className="text-sm text-gray-400">{stock.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {analyzing && (
          <div className="card text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing stock with AI...</p>
            <StockAnalysisSkeleton />
          </div>
        )}

        {/* Stock Analysis Results */}
        {selectedStock && !analyzing && (
          <div className="space-y-6">
            {/* Stock Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedStock.symbol}</h3>
                  <p className="text-gray-400">{selectedStock.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold">₹{selectedStock.currentPrice}</div>
                    <div className={`text-lg font-semibold ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedStock.changePercent}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await watchlistAPI.add(selectedStock.symbol, selectedStock.exchange);
                        alert('Added to watchlist!');
                      } catch (error) {
                        alert(error.response?.data?.error || 'Failed to add to watchlist');
                      }
                    }}
                    className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-all"
                    title="Add to Watchlist"
                  >
                    <Star className="w-6 h-6 text-yellow-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Predictions */}
            <div className="card">
              <h4 className="text-xl font-bold mb-4">AI Predictions</h4>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(selectedStock.predictions).map(([key, pred]) => (
                  <div key={key} className="glass p-4 rounded-lg">
                    <div className="text-sm text-gray-400 uppercase mb-2">{key}</div>
                    <div className="text-2xl font-bold mb-1">₹{pred.target}</div>
                    <div className={`text-lg font-semibold mb-2 ${pred.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pred.change >= 0 ? '+' : ''}{pred.change}%
                    </div>
                    <div className="text-sm text-gray-400">Confidence: {pred.confidence}%</div>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Chart */}
            <div className="card">
              <StockChart
                predictions={selectedStock.predictions}
                currentPrice={selectedStock.currentPrice}
                symbol={selectedStock.symbol}
              />
            </div>

            {/* Technical Analysis */}
            <div className="card">
              <h4 className="text-xl font-bold mb-4">Technical Analysis</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">RSI (14)</div>
                  <div className="text-2xl font-bold">{selectedStock.technical.rsi}</div>
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">MACD</div>
                  <div className="text-2xl font-bold">{selectedStock.technical.macd}</div>
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">EMA (20)</div>
                  <div className="text-2xl font-bold">₹{selectedStock.technical.ema20}</div>
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Signal</div>
                  <div
                    className={`text-2xl font-bold ${
                      selectedStock.technical.signal === 'BUY'
                        ? 'text-green-400'
                        : selectedStock.technical.signal === 'SELL'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {selectedStock.technical.signal}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock News */}
            <StockNews symbol={selectedStock.symbol} exchange={selectedStock.exchange} />

            {/* Corporate Actions */}
            <CorporateActions symbol={selectedStock.symbol} exchange={selectedStock.exchange} />
          </div>
        )}
      </div>
    </div>
  );
}
