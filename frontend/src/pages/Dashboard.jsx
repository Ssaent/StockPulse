// frontend/src/pages/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StockNews from '../components/StockNews';
import CorporateActions from '../components/CorporateActions';
import StockChart from '../components/StockChart';
import {
  Search,
  TrendingUp,
  LogOut,
  Star,
  Briefcase,
  Newspaper,
  Target,
  Bell,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { stockAPI, watchlistAPI } from '../services/api';
import { StockAnalysisSkeleton } from '../components/LoadingSkeleton';
import NolanMarketCards from '../components/NolanMarketCards';

/* ---------- RGV shell helpers (no rain) ---------- */
function RgvPanel({ className = '', children }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'border border-white/10',
        'shadow-[0_24px_70px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]',
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
              'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.35) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.25) 0%, transparent 70%)',
          }}
        />
      </div>
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 3px)',
        }}
      />
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const resultsBoxRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /* ---------- Debounced Search with cancel ---------- */
  const doSearch = useCallback(
    async (q) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setSearchErr('');
      setLoading(true);
      try {
        const res = await stockAPI.search(q, 'NSE', { signal: ctrl.signal });
        if (!mountedRef.current) return;
        setSearchResults(res.data.results || []);
        setResultsOpen(true);
        setHighlight(0);
      } catch (e) {
        if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
          console.error('Search error:', e);
          setSearchErr('Search failed. Try again.');
          setSearchResults([]);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setResultsOpen(false);
      setSearchErr('');
      if (abortRef.current) abortRef.current.abort();
      return;
    }
    const t = setTimeout(() => doSearch(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery, doSearch]);

  /* ---------- Analyze ---------- */
  const handleAnalyze = async (symbol) => {
    setAnalyzing(true);
    setResultsOpen(false);
    setSearchResults([]);
    try {
      const res = await stockAPI.analyze(symbol, 'NSE');
      if (!mountedRef.current) return;
      setSelectedStock(res.data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze stock. Please try again.');
    } finally {
      if (mountedRef.current) setAnalyzing(false);
    }
  };

  /* ---------- Keyboard navigation in results ---------- */
  const onSearchKeyDown = (e) => {
    if (!resultsOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = searchResults[highlight];
      if (picked) handleAnalyze(picked.symbol);
    } else if (e.key === 'Escape') {
      setResultsOpen(false);
    }
  };

  /* ---------- Watchlist (optimistic) ---------- */
  const addToWatchlist = async (stk) => {
    const prev = selectedStock;
    try {
      // optimistic toast-ish state (optional)
      await watchlistAPI.add(stk.symbol, stk.exchange);
      alert('Added to watchlist!');
    } catch (err) {
      console.error(err);
      setSelectedStock(prev); // revert if you had local change
      alert(err.response?.data?.error || 'Failed to add to watchlist');
    }
  };

  const headerActions = useMemo(
    () => [
      { to: '/backtesting', icon: Target, label: 'Accuracy' },
      { to: '/news', icon: Newspaper, label: 'News' },
      { to: '/alerts', icon: Bell, label: 'Alerts' },
      { to: '/watchlist', icon: Star, label: 'Watchlist' },
      { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    ],
    []
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))',
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(168,85,247,0.22) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 10px 28px rgba(59,130,246,0.25)',
                }}
                aria-hidden
              >
                <TrendingUp className="w-6 h-6 text-blue-300" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                StockPulse
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {headerActions.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition"
              >
                <LogOut className="w-5 h-5 text-red-300" />
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

        {/* Quick Stats - RGV/Nolan Hybrid */}
        <div className="mb-8">
          <NolanMarketCards />
        </div>

        {/* Search + Popular */}
        <RgvPanel className="mb-8">
          {/* Search */}
          <div className="relative">
            <label htmlFor="stock-search" className="sr-only">Search NSE stocks</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="stock-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search NSE stocks… (e.g., RELIANCE, TCS, INFY)"
              className="input pl-12"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={resultsOpen}
              aria-controls="search-results"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}

            {/* Results dropdown */}
            {resultsOpen && (searchResults.length > 0 || searchErr) && (
              <div
                ref={resultsBoxRef}
                id="search-results"
                className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-black/70 backdrop-blur-md shadow-2xl max-h-80 overflow-auto"
              >
                {searchErr && (
                  <div className="px-4 py-3 text-sm text-red-300 flex items-center gap-2 border-b border-white/10">
                    <AlertTriangle className="w-4 h-4" />
                    {searchErr}
                  </div>
                )}
                {searchResults.map((stock, i) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAnalyze(stock.symbol)}
                    className={[
                      'w-full text-left px-4 py-3 border-b border-white/10 hover:bg-white/10 transition',
                      i === highlight ? 'bg-white/10' : '',
                    ].join(' ')}
                    role="option"
                    aria-selected={i === highlight}
                  >
                    <div className="font-bold">{stock.symbol}</div>
                    <div className="text-xs text-gray-400">{stock.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Stocks */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4">Popular Stocks</h4>
            <div className="flex flex-wrap gap-2">
              {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC'].map(
                (symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleAnalyze(symbol)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm font-medium"
                  >
                    {symbol}
                  </button>
                )
              )}
            </div>
          </div>
        </RgvPanel>

        {/* Loading */}
        {analyzing && (
          <RgvPanel className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500/60 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400 mb-6">Analyzing stock with AI…</p>
            <StockAnalysisSkeleton />
          </RgvPanel>
        )}

        {/* Stock Analysis Results */}
        {selectedStock && !analyzing && (
          <div className="space-y-6">
            {/* Stock Header */}
            <RgvPanel>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-bold">{selectedStock.symbol}</h3>
                  <p className="text-gray-400">{selectedStock.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      ₹{Number(selectedStock.currentPrice).toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {selectedStock.changePercent}
                    </div>
                  </div>
                  <button
                    onClick={() => addToWatchlist(selectedStock)}
                    className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition"
                    title="Add to Watchlist"
                    aria-label="Add to Watchlist"
                  >
                    <Star className="w-6 h-6 text-yellow-400" />
                  </button>
                </div>
              </div>
            </RgvPanel>

            {/* Predictions */}
            <RgvPanel>
              <h4 className="text-xl font-bold mb-4">AI Predictions</h4>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(selectedStock.predictions).map(([key, pred]) => (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-gray-400 uppercase mb-2">{key}</div>
                    <div className="text-2xl font-bold mb-1">₹{pred.target}</div>
                    <div
                      className={`text-lg font-semibold mb-2 ${
                        pred.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {pred.change >= 0 ? '+' : ''}
                      {pred.change}%
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
            </RgvPanel>

            {/* Price Chart */}
            <RgvPanel>
              <StockChart
                predictions={selectedStock.predictions}
                currentPrice={selectedStock.currentPrice}
                symbol={selectedStock.symbol}
              />
            </RgvPanel>

            {/* Technical Analysis */}
            <RgvPanel>
              <h4 className="text-xl font-bold mb-4">Technical Analysis</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-gray-400 mb-1">RSI (14)</div>
                  <div className="text-2xl font-bold">{selectedStock.technical.rsi}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-gray-400 mb-1">MACD</div>
                  <div className="text-2xl font-bold">{selectedStock.technical.macd}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-gray-400 mb-1">EMA (20)</div>
                  <div className="text-2xl font-bold">₹{selectedStock.technical.ema20}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
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
            </RgvPanel>

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
