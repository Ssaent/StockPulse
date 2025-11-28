import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [marketData, setMarketData] = useState({
    nifty50: { value: '---', change: '+0.00', changePercent: '+0.00%', isPositive: true },
    sensex: { value: '---', change: '+0.00', changePercent: '+0.00%', isPositive: true },
    gold: { value: '---', change: '+0', changePercent: '+0.00%', isPositive: true },
    silver: { value: '---', change: '0', changePercent: '0.00%', isPositive: false }
  });

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ FIXED: Using AuthContext

  // Fetch real-time market data every 10 seconds
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const indicesResponse = await axios.get('http://localhost:5000/api/market/indices');

        if (indicesResponse.data) {
          const { nifty, sensex, gold, silver } = indicesResponse.data;

          setMarketData({
            nifty50: {
              value: nifty?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '21,894.35',
              change: nifty?.change >= 0 ? `+${nifty?.change.toFixed(2)}` : nifty?.change.toFixed(2),
              changePercent: nifty?.changePercent >= 0 ? `+${nifty?.changePercent.toFixed(2)}%` : `${nifty?.changePercent.toFixed(2)}%`,
              isPositive: nifty?.change >= 0
            },
            sensex: {
              value: sensex?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '72,304.42',
              change: sensex?.change >= 0 ? `+${sensex?.change.toFixed(2)}` : sensex?.change.toFixed(2),
              changePercent: sensex?.changePercent >= 0 ? `+${sensex?.changePercent.toFixed(2)}%` : `${sensex?.changePercent.toFixed(2)}%`,
              isPositive: sensex?.change >= 0
            },
            gold: {
              value: gold?.value?.toFixed(0) || '62,450',
              change: gold?.change >= 0 ? `+${gold?.change.toFixed(0)}` : gold?.change.toFixed(0),
              changePercent: gold?.changePercent >= 0 ? `+${gold?.changePercent.toFixed(2)}%` : `${gold?.changePercent.toFixed(2)}%`,
              isPositive: gold?.change >= 0
            },
            silver: {
              value: silver?.value?.toFixed(0) || '74,320',
              change: silver?.change >= 0 ? `+${silver?.change.toFixed(0)}` : silver?.change.toFixed(0),
              changePercent: silver?.changePercent >= 0 ? `+${silver?.changePercent.toFixed(2)}%` : `${silver?.changePercent.toFixed(2)}%`,
              isPositive: silver?.change >= 0
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRequiresVerification(false);
    setLoading(true);

    try {
      console.log('🔐 Attempting login...');

      // ✅ FIXED: Using AuthContext login instead of direct axios
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        console.log('✅ Login successful, redirecting to dashboard...');
        navigate('/dashboard');
      } else if (result.requiresVerification) {
        // Email not verified - redirect to OTP verification
        setRequiresVerification(true);
        setError('Please verify your email before logging in. Check your inbox for OTP.');
      }

    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoToVerify = () => {
    navigate('/verify-otp', { state: { email: email.trim().toLowerCase() } });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Smooth Animated Market Ticker at Top */}
      <div className="absolute top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 z-20 py-3 overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {/* Triple repeat for seamless infinite scroll */}
            {[1, 2, 3].map((set) => (
              <div key={set} className="ticker-item-group">
                <div className="ticker-item">
                  <span className="text-slate-400 font-semibold text-sm">NIFTY 50</span>
                  <span className="text-white font-bold text-base ml-2">{marketData.nifty50.value}</span>
                  <span className={`text-sm font-medium ml-2 ${marketData.nifty50.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marketData.nifty50.change} ({marketData.nifty50.changePercent})
                  </span>
                </div>

                <div className="ticker-item">
                  <span className="text-slate-400 font-semibold text-sm">SENSEX</span>
                  <span className="text-white font-bold text-base ml-2">{marketData.sensex.value}</span>
                  <span className={`text-sm font-medium ml-2 ${marketData.sensex.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marketData.sensex.change} ({marketData.sensex.changePercent})
                  </span>
                </div>

                <div className="ticker-item">
                  <span className="text-slate-400 font-semibold text-sm">GOLD</span>
                  <span className="text-white font-bold text-base ml-2">₹{marketData.gold.value}</span>
                  <span className="text-xs text-slate-500 ml-1">/10g</span>
                  <span className={`text-sm font-medium ml-2 ${marketData.gold.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marketData.gold.change} ({marketData.gold.changePercent})
                  </span>
                </div>

                <div className="ticker-item">
                  <span className="text-slate-400 font-semibold text-sm">SILVER</span>
                  <span className="text-white font-bold text-base ml-2">₹{marketData.silver.value}</span>
                  <span className="text-xs text-slate-500 ml-1">/kg</span>
                  <span className={`text-sm font-medium ml-2 ${marketData.silver.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {marketData.silver.change} ({marketData.silver.changePercent})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Stock Market Doodles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* ... keep all your SVG doodles here ... */}
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10 mt-16">
        <div className="max-w-md">
          <div className="mb-8">
            {/* Clickable Logo - Desktop */}
            <Link
              to="/"
              className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity cursor-pointer group"
              title="Go to Home"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 transform group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                StockPulse
              </h1>
            </Link>

            <h2 className="text-3xl font-bold text-white mb-4">
              AI-Powered Stock Predictions
            </h2>

            <p className="text-lg text-slate-400 mb-8">
              Join thousands of smart investors using advanced LSTM neural networks to predict market movements.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-Time Analysis</h3>
                  <p className="text-sm text-slate-400">Get instant predictions for 1000+ NSE/BSE stocks</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Advanced LSTM Models</h3>
                  <p className="text-sm text-slate-400">Neural networks trained on years of market data</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bank-Level Security</h3>
                  <p className="text-sm text-slate-400">Your data is encrypted and protected</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50% Accuracy</div>
                  <p className="text-sm text-slate-400">From 146 validated predictions</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Live tracking with transparent, real-time results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 mt-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Home"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                StockPulse
              </h1>
            </Link>
            <p className="text-slate-400">AI-Powered Stock Predictions</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 p-8 border border-slate-800">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-slate-400">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-300">{error}</p>
                    {requiresVerification && (
                      <button
                        type="button"
                        onClick={handleGoToVerify}
                        className="w-full mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        Verify Email Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500 backdrop-blur-sm"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500 backdrop-blur-sm"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-900" />
                  <span className="ml-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms</span>
                <span>•</span>
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy</span>
                <span>•</span>
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Security</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Your connection is secure and encrypted
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
        }

        .ticker-content {
          display: flex;
          animation: ticker-scroll 60s linear infinite;
          will-change: transform;
        }

        .ticker-item-group {
          display: flex;
          flex-shrink: 0;
          gap: 3rem;
          padding-right: 3rem;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          white-space: nowrap;
        }

        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}