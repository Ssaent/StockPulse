import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { marketAPI, CHART_CONFIG } from '../services/api';

// Enterprise Chart Hook - Big Tech Style
const useChartData = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      setLoading(true); // Always show loading for user-initiated refreshes
      setError(null);

      const symbol = CHART_CONFIG.symbols.nifty;
      console.log('Fetching chart data for:', symbol.ticker, symbol.exchange);
      const response = await marketAPI.getChartData(
        symbol.ticker,
        symbol.exchange,
        CHART_CONFIG.intervals.daily,    // '1d' for period
        CHART_CONFIG.intervals.intraday  // '15m' for interval
      );
      console.log('Chart API response:', response);

      // Validate response structure
      if (!response?.data?.data?.length) {
        throw new Error('Invalid chart data structure received from server');
      }

      // Get current market status for conditional time formatting
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istTime = new Date(now.getTime() + istOffset);
      const dayOfWeek = istTime.getDay();
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
      const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM
      const isMarketOpen = (dayOfWeek >= 1 && dayOfWeek <= 5) &&
                          (currentMinutes >= marketOpenMinutes && currentMinutes <= marketCloseMinutes);

      // Simple data transformation for Recharts
      const transformedData = response.data.data.map((item, index, array) => ({
        time: item.time, // Use actual time from backend, don't force 15:30
        value: item.value
      }));

      // Basic validation
      if (!transformedData || transformedData.length === 0) {
        throw new Error('No chart data available');
      }

      setData(transformedData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Chart fetch error:', err.message);
      setError({
        message: 'Unable to load chart data. Please check your connection and try again.',
        code: 'CHART_LOAD_FAILED',
        timestamp: Date.now(),
        canRetry: true
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount only (no continuous polling)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, lastUpdated, refetch: () => fetchData(false) };
};

// Professional Error Component - Big Tech Style
const ChartErrorState = ({ error, onRetry }) => {
  const getErrorIcon = (code) => {
    switch (code) {
      case 'NETWORK_ERROR': return '🌐';
      case 'API_LIMIT': return '⏱️';
      case 'INVALID_DATA': return '📊';
      case 'CHART_FETCH_FAILED': return '📈';
      default: return '⚠️';
    }
  };

  const getErrorTitle = (code) => {
    switch (code) {
      case 'NETWORK_ERROR': return 'Connection Issue';
      case 'API_LIMIT': return 'Rate Limited';
      case 'INVALID_DATA': return 'Data Unavailable';
      case 'CHART_FETCH_FAILED': return 'Chart Loading Failed';
      default: return 'Something Went Wrong';
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to market data servers. Please check your internet connection.';
      case 'API_LIMIT':
        return 'Too many requests. Our data provider has temporarily limited access. Please try again in a few minutes.';
      case 'INVALID_DATA':
        return 'Market data is temporarily unavailable or in an unexpected format.';
      case 'CHART_FETCH_FAILED':
        return 'Failed to load the chart data. This could be due to server issues or data unavailability.';
      default:
        return 'An unexpected error occurred while loading the chart.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8">
      <div className="text-5xl mb-4 animate-pulse">{getErrorIcon(error.code)}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{getErrorTitle(error.code)}</h3>
      <p className="text-gray-400 text-center mb-6 max-w-md leading-relaxed">
        {getErrorMessage(error.code)}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
        >
          Reload Page
        </button>
      </div>
      {error.timestamp && (
        <p className="text-xs text-gray-500 mt-4">
          Last attempted: {new Date(error.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, status: 'Closed' });
  const [currentPrice, setCurrentPrice] = useState({ value: 0, change: 0, changePercent: 0 });

  // Use enterprise chart hook
  const { data: chartData, error: chartError, loading: chartLoading, lastUpdated, refetch: refetchChart } = useChartData();

  const features = [
    {
      title: "AI-Powered Analysis",
      description: "Advanced LSTM neural networks analyze years of market data to predict stock movements with precision."
    },
    {
      title: "Real-Time Analysis",
      description: "Get instant insights on 1000+ NSE/BSE stocks with live market data and technical indicators."
    },
    {
      title: "Smart Alerts",
      description: "Never miss an opportunity. Set custom alerts and get notified when your targets are hit."
    },
    {
      title: "Portfolio Tracking",
      description: "Monitor your investments with beautiful visualizations and detailed performance metrics."
    }
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch market data on load only (enterprise approach)
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await marketAPI.getIndices();
        if (response?.data?.nifty) {
          const niftyData = response.data.nifty;
          setCurrentPrice({
            value: niftyData.value || 0,
            change: niftyData.change || 0,
            changePercent: niftyData.changePercent || 0
          });
        } else {
          throw new Error('Invalid market data structure');
        }
      } catch (error) {
        console.error('Market data fetch failed:', error);
        // No fallback - let user see zero values or error state
        setCurrentPrice({ value: 0, change: 0, changePercent: 0 });
      }
    };

    fetchMarketData();
    // No continuous polling - only on page load
  }, []);

  // Chart refresh handler for manual updates
  const handleChartRefresh = useCallback(async () => {
    await refetchChart();
  }, [refetchChart]);

  // Function to check market status
  const checkMarketStatus = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);

    const dayOfWeek = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Market is closed on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setMarketStatus({ isOpen: false, status: 'Closed (Weekend)' });
      return;
    }

    // Market hours: 9:15 AM to 3:30 PM IST
    const currentMinutes = hours * 60 + minutes;
    const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
    const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM

    const isOpen = currentMinutes >= marketOpenMinutes && currentMinutes <= marketCloseMinutes;
    const status = isOpen ? 'Live' : 'Closed';

    console.log('Market Status Check:', {
      istTime: istTime.toLocaleString(),
      dayOfWeek,
      currentMinutes,
      marketOpenMinutes,
      marketCloseMinutes,
      isOpen,
      status
    });

    setMarketStatus({
      isOpen,
      status
    });
  };

  useEffect(() => {
    checkMarketStatus();
    // Check every minute
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-transparent min-h-screen font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out"
        style={{
          background: `rgba(255, 255, 255, ${Math.min(scrollY / 100, 0.08)})`,
          backdropFilter: `blur(${Math.min(scrollY / 50, 1) * 20}px)`,
          border: Math.min(scrollY / 50, 1) > 0.1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          margin: `${Math.min(scrollY / 50, 1) * 16}px ${Math.min(scrollY / 50, 1) * 24}px`,
          borderRadius: `${Math.min(scrollY / 50, 1) * 16}px`,
          boxShadow: Math.min(scrollY / 50, 1) > 0.2 ? `0 8px 32px rgba(0, 0, 0, ${Math.min(scrollY / 50, 1) * 0.3})` : 'none',
          transform: `scale(${1 + Math.min(scrollY / 100, 1) * -0.02})`,
          maxHeight: '0.75in' // Limit header height to 0.75 inches
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full"
             style={{
               padding: `${0.5 + Math.min(scrollY / 50, 1) * 0.25}rem ${1 + Math.min(scrollY / 50, 1) * 0.5}rem`,
               transition: 'padding 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
             }}>
          {/* Clickable Logo - Scroll to Top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none outline-none flex-shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-semibold">StockPulse</span>
          </button>


          <div className="flex items-center gap-4">
            <Link to="/login" className="soft-polymer intelligence-accent px-4 py-1.5 text-sm flex items-center justify-center">
              Sign In
            </Link>
            <Link to="/register" className="soft-polymer intelligence-accent px-6 py-2 text-sm flex items-center justify-center">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-700 ease-out"
        style={{
          paddingTop: `${5 + Math.min(scrollY / 50, 1) * 1}rem` // Gentler padding adjustment
        }}
      >
        {/* Mineral Surface Variations - Subtle matte texture shifts */}
        <div className="absolute inset-0 opacity-8"
             style={{
               background:
                 `radial-gradient(ellipse 35% 25% at 25% 45%, rgba(34, 197, 94, 0.06), transparent),
                  radial-gradient(ellipse 30% 20% at 75% 65%, rgba(52, 211, 153, 0.04), transparent)`,
               transform: `translateY(${scrollY * 0.15}px)`
             }} />

        {/* Ceramic Grain Pattern - Minimal structural overlay */}
        <div className="absolute inset-0 opacity-12"
             style={{
               backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.015) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(6, 182, 212, 0.015) 1px, transparent 1px)`,
               backgroundSize: '120px 120px',
               transform: `translateY(${scrollY * -0.08}px)`
             }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

          {/* Structural Headline */}
          <h1 className="text-6xl md:text-8xl mb-8 leading-tight animate-slide-up tracking-tight">
            <span className="text-amber-50">Analyze Markets</span>
            <br />
            <span className="text-amber-100">With AI Precision</span>
          </h1>

          {/* Structural Subheadline */}
          <p className="text-xl md:text-2xl text-amber-200 mb-12 max-w-3xl mx-auto animate-slide-up-delay leading-relaxed">
            Advanced LSTM neural networks analyze market patterns to give you an edge in stock trading.
            Make informed decisions with real-time AI analysis.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-delay">
            <Link to="/register" className="soft-polymer px-12 py-5 text-sm">
              Start Analyzing Free
            </Link>
            <Link to="/dashboard" className="soft-polymer px-12 py-5 text-sm">
              See Live Demo
            </Link>
          </div>

          {/* Quantum Chart Preview */}
          <div className="relative max-w-4xl mx-auto animate-slide-up-slow">
            <div className="absolute inset-0 opacity-30"
                 style={{
                   background: `radial-gradient(ellipse 50% 30% at 50% 50%, rgba(6, 182, 212, 0.1), transparent)`
                 }} />
            <div
              className="relative p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.blur()}
            >
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-3 text-left">{CHART_CONFIG.symbols.nifty.name}</div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-bold text-white">
                      {chartData && chartData.length > 0
                        ? chartData[chartData.length - 1].value.toLocaleString('en-IN')
                        : (currentPrice.value ? currentPrice.value.toLocaleString('en-IN') : '--')
                      }
                    </div>
                    {currentPrice.change !== 0 && (
                      <div className={`text-sm ${currentPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)} ({currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {lastUpdated && (
                    <div className="text-xs text-gray-500">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                  <button
                    onClick={handleChartRefresh}
                    disabled={chartLoading}
                    className="soft-polymer flex items-center gap-2 px-3 py-1 text-sm transition-all duration-200 disabled:opacity-50"
                    title="Refresh chart data"
                  >
                    <RefreshCw className={`w-4 h-4 ${chartLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex gap-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      marketStatus.isOpen ? 'bg-green-400' : 'bg-red-600'
                    }`} />
                    <span className="text-sm text-gray-400">{marketStatus.status}</span>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              {chartError ? (
                <ChartErrorState error={chartError} onRetry={handleChartRefresh} />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={200}
                  style={{ outline: 'none', '&:focus': { outline: 'none' } }}
                >
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading chart data...
                      </div>
                    </div>
                  ) : chartData && chartData.length > 0 ? (
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_CONFIG.styling.colors.primary} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={CHART_CONFIG.styling.colors.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        style={{ fontSize: '12px', outline: 'none' }}
                        tick={{ fill: '#9ca3af' }}
                        axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                        tickLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px', outline: 'none' }}
                        domain={['dataMin - 50', 'dataMax + 50']}
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => value.toLocaleString()}
                        axisLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                        tickLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                        labelStyle={{ color: CHART_CONFIG.styling.colors.primary }}
                        formatter={(value) => [value.toLocaleString('en-IN'), 'Price']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={CHART_CONFIG.styling.colors.primary}
                        strokeWidth={2}
                        dot={false}
                        fill="url(#colorValue)"
                      />
                    </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No chart data available
                    </div>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl mb-6 tracking-tight">
              Built for <span className="text-amber-100">Intelligence</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every feature designed to give you the edge in stock market trading
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-6 material-transition ${
                  activeFeature === index ? 'ring-2 ring-black/50' : ''
                }`}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  transform: scrollY > 500 ? 'translateY(0)' : 'translateY(50px)',
                  opacity: scrollY > 500 ? 1 : 0,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-3xl transition-all duration-500 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Simple. <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Powerful.</span>
            </h2>
            <p className="text-xl text-gray-400">Get started in three easy steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Create Account", desc: "Sign up free in seconds. No credit card required." },
              { step: "02", title: "Search Stocks", desc: "Browse 1000+ stocks with real-time data and AI insights." },
              { step: "03", title: "Get Analysis", desc: "Receive AI-powered analysis and make informed trades." }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-bold text-white/5 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-8"
             style={{
               background: `radial-gradient(ellipse 55% 35% at 50% 50%, rgba(52, 211, 153, 0.05), transparent)`
             }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Ready to start <br />
            <span className="bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              analyzing?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of smart investors using AI to make better trading decisions
          </p>

          <Link to="/register" className="soft-polymer intelligence-accent inline-block px-12 py-5 text-xl font-medium">
            Get Started Free →
          </Link>

          <div className="mt-8 text-sm text-gray-500">
            No credit card required • Free forever • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Clickable Footer Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xl font-semibold">StockPulse</span>
            </Link>
            
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="text-sm text-gray-500">
              © 2025 StockPulse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s backwards;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }

        .animate-slide-up-delay {
          animation: slide-up 1s ease-out 0.2s backwards;
        }

        .animate-slide-up-slow {
          animation: slide-up 1.5s ease-out 0.4s backwards;
        }
      `}</style>
    </div>
  );
}