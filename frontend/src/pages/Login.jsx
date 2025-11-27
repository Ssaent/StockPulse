import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      console.log('✅ Login successful:', response.data);

      // Save token
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('❌ Login failed:', err);

      if (err.response?.status === 403 && err.response?.data?.requires_verification) {
        // Email not verified - block login
        setRequiresVerification(true);
        setError(err.response.data.message || 'Please verify your email before logging in.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
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

        {/* Candlestick Chart */}
        <div className="absolute top-28 left-20 animate-float-slow opacity-30" style={{ animationDelay: '0s' }}>
          <svg width="110" height="100" viewBox="0 0 110 100" className="drop-shadow-2xl">
            <g>
              <line x1="20" y1="30" x2="20" y2="75" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
              <rect x="12" y="45" width="16" height="20" fill="#10b981" rx="2" opacity="0.9"/>
              <line x1="45" y1="20" x2="45" y2="70" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              <rect x="37" y="30" width="16" height="25" fill="#ef4444" rx="2" opacity="0.9"/>
              <line x1="70" y1="25" x2="70" y2="65" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
              <rect x="62" y="35" width="16" height="20" fill="#10b981" rx="2" opacity="0.9"/>
              <line x1="95" y1="35" x2="95" y2="80" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              <rect x="87" y="50" width="16" height="18" fill="#ef4444" rx="2" opacity="0.9"/>
            </g>
          </svg>
          <div className="text-center text-xs font-bold text-emerald-400 mt-2 tracking-wider">CANDLESTICK</div>
        </div>

        {/* Coins/Cash Stack */}
        <div className="absolute top-32 right-24 animate-float-slow opacity-30" style={{ animationDelay: '1.5s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="coinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="75" rx="28" ry="9" fill="url(#coinGradient)" opacity="0.5"/>
            <ellipse cx="50" cy="62" rx="28" ry="9" fill="url(#coinGradient)" opacity="0.6"/>
            <ellipse cx="50" cy="49" rx="28" ry="9" fill="url(#coinGradient)" opacity="0.7"/>
            <ellipse cx="50" cy="36" rx="28" ry="9" fill="url(#coinGradient)" opacity="0.9"/>
            <text x="50" y="42" fontSize="18" fill="#78350f" textAnchor="middle" fontWeight="bold">₹</text>
            <rect x="25" y="20" width="35" height="18" rx="2" fill="#22c55e" opacity="0.3" transform="rotate(-15 42 29)"/>
            <rect x="30" y="15" width="35" height="18" rx="2" fill="#22c55e" opacity="0.4" transform="rotate(-8 47 24)"/>
          </svg>
          <div className="text-center text-xs font-bold text-amber-400 mt-2 tracking-wider">MONEY</div>
        </div>

        {/* BSE Logo */}
        <div className="absolute top-1/4 left-16 animate-pulse-slow opacity-30" style={{ animationDelay: '2s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="bseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M 50 15 L 75 25 L 75 55 Q 75 70 50 80 Q 25 70 25 55 L 25 25 Z" fill="url(#bseGradient)" opacity="0.8"/>
            <text x="50" y="52" fontSize="22" fill="#ffffff" textAnchor="middle" fontWeight="bold">BSE</text>
          </svg>
          <div className="text-center text-xs font-bold text-blue-400 mt-2 tracking-wider">BOMBAY SE</div>
        </div>

        {/* NSE Logo */}
        <div className="absolute top-1/3 right-20 animate-pulse-slow opacity-30" style={{ animationDelay: '3s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="nseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6d28d9', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M 50 15 L 75 30 L 75 60 L 50 75 L 25 60 L 25 30 Z" fill="url(#nseGradient)" opacity="0.8"/>
            <text x="50" y="52" fontSize="22" fill="#ffffff" textAnchor="middle" fontWeight="bold">NSE</text>
          </svg>
          <div className="text-center text-xs font-bold text-purple-400 mt-2 tracking-wider">NATIONAL SE</div>
        </div>

        {/* NIFTY */}
        <div className="absolute bottom-1/4 right-1/3 animate-float-diagonal opacity-30" style={{ animationDelay: '2.5s' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="niftyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="15" y="15" width="70" height="70" rx="12" fill="url(#niftyGradient)" opacity="0.8"/>
            <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.3"/>
            <text x="50" y="45" fontSize="12" fill="#ffffff" textAnchor="middle" fontWeight="bold">NIFTY</text>
            <text x="50" y="63" fontSize="18" fill="#ffffff" textAnchor="middle" fontWeight="bold">50</text>
          </svg>
          <div className="text-center text-xs font-bold text-emerald-400 mt-2 tracking-wider">NIFTY 50</div>
        </div>

        {/* Sand Timer/Hourglass */}
        <div className="absolute top-1/2 left-1/3 animate-flip opacity-30" style={{ animationDelay: '4s' }}>
          <svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="hourglassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M 30 20 L 70 20 L 70 25 L 55 45 L 55 55 L 70 75 L 70 80 L 30 80 L 30 75 L 45 55 L 45 45 L 30 25 Z" fill="none" stroke="#94a3b8" strokeWidth="3"/>
            <path d="M 35 25 L 65 25 L 53 43 L 47 43 Z" fill="url(#hourglassGradient)" opacity="0.8"/>
            <path d="M 35 75 L 65 75 L 65 68 L 35 68 Z" fill="url(#hourglassGradient)" opacity="0.8"/>
            <line x1="50" y1="45" x2="50" y2="68" stroke="#f59e0b" strokeWidth="2"/>
          </svg>
          <div className="text-center text-xs font-bold text-amber-400 mt-2 tracking-wider">TIME</div>
        </div>

        {/* Graph Dropping/Falling */}
        <div className="absolute top-2/3 right-16 animate-shake opacity-30" style={{ animationDelay: '0.5s' }}>
          <svg width="110" height="100" viewBox="0 0 110 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.2 }} />
              </linearGradient>
            </defs>
            <path d="M 10 85 L 10 30 L 30 35 L 50 50 L 70 60 L 90 75 L 105 80 L 105 85 Z" fill="url(#dropGradient)"/>
            <polyline points="10,30 30,35 50,50 70,60 90,75 105,80" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 95 70 L 105 80 L 100 75" fill="#ef4444"/>
            <circle cx="10" cy="30" r="3" fill="#ef4444"/>
            <circle cx="30" cy="35" r="3" fill="#ef4444"/>
            <circle cx="50" cy="50" r="3" fill="#ef4444"/>
            <circle cx="70" cy="60" r="3" fill="#ef4444"/>
            <circle cx="90" cy="75" r="3" fill="#ef4444"/>
            <circle cx="105" cy="80" r="3" fill="#ef4444"/>
          </svg>
          <div className="text-center text-xs font-bold text-red-400 mt-2 tracking-wider">BEARISH</div>
        </div>

        {/* Balance Scale */}
        <div className="absolute bottom-20 left-1/4 animate-sway opacity-30" style={{ animationDelay: '3.5s' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="scaleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="35" y="85" width="30" height="5" rx="2" fill="#64748b"/>
            <rect x="48" y="45" width="4" height="40" fill="#64748b"/>
            <rect x="15" y="43" width="70" height="4" rx="2" fill="url(#scaleGradient)"/>
            <line x1="25" y1="45" x2="25" y2="55" stroke="#64748b" strokeWidth="2"/>
            <path d="M 15 55 L 35 55 L 33 60 L 17 60 Z" fill="url(#scaleGradient)" opacity="0.8"/>
            <line x1="75" y1="45" x2="75" y2="55" stroke="#64748b" strokeWidth="2"/>
            <path d="M 65 55 L 85 55 L 83 60 L 67 60 Z" fill="url(#scaleGradient)" opacity="0.8"/>
          </svg>
          <div className="text-center text-xs font-bold text-cyan-400 mt-2 tracking-wider">BALANCE</div>
        </div>

        {/* Magnifying Glass */}
        <div className="absolute top-1/2 right-1/4 animate-zoom opacity-30" style={{ animationDelay: '5s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="25" fill="url(#glassGradient)" stroke="#3b82f6" strokeWidth="3"/>
            <circle cx="40" cy="40" r="20" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.4"/>
            <path d="M 58 58 L 75 75" stroke="#64748b" strokeWidth="6" strokeLinecap="round"/>
            <path d="M 60 60 L 77 77" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/>
            <polyline points="30,45 35,40 40,42 45,35" fill="none" stroke="#10b981" strokeWidth="2"/>
          </svg>
          <div className="text-center text-xs font-bold text-blue-400 mt-2 tracking-wider">RESEARCH</div>
        </div>

        {/* Globe */}
        <div className="absolute bottom-32 right-24 animate-rotate-slow opacity-30" style={{ animationDelay: '6s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6d28d9', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="url(#globeGradient)" opacity="0.8"/>
            <ellipse cx="50" cy="50" rx="30" ry="10" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4"/>
            <ellipse cx="50" cy="50" rx="30" ry="20" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4"/>
            <ellipse cx="50" cy="50" rx="10" ry="30" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4"/>
            <ellipse cx="50" cy="50" rx="20" ry="30" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4"/>
            <path d="M 35 40 Q 40 35 45 40 Q 50 38 52 42 Q 55 40 58 43" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6"/>
          </svg>
          <div className="text-center text-xs font-bold text-purple-400 mt-2 tracking-wider">GLOBAL</div>
        </div>

        {/* Rocket Ship - Growth */}
        <div className="absolute top-1/4 right-1/3 animate-float-diagonal opacity-25" style={{ animationDelay: '1s' }}>
          <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="40" rx="12" ry="18" fill="url(#rocketGradient)"/>
            <path d="M 50 22 Q 40 15 50 10 Q 60 15 50 22" fill="#8b5cf6"/>
            <circle cx="50" cy="38" r="6" fill="#1e293b" opacity="0.8"/>
            <circle cx="50" cy="38" r="4" fill="#60a5fa" opacity="0.4"/>
            <path d="M 38 50 L 30 65 L 38 58 Z" fill="#6366f1"/>
            <path d="M 62 50 L 70 65 L 62 58 Z" fill="#6366f1"/>
            <path d="M 45 58 Q 40 70 45 80 Q 50 75 50 80 Q 50 75 55 80 Q 60 70 55 58" fill="#f59e0b" opacity="0.7"/>
          </svg>
          <div className="text-center text-xs font-bold text-purple-400 mt-2 tracking-wider">GROWTH</div>
        </div>

        {/* Chart Trending Up */}
        <div className="absolute top-1/2 left-12 animate-draw-line opacity-30" style={{ animationDelay: '1.5s' }}>
          <svg width="120" height="100" viewBox="0 0 120 100" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>
            <path d="M 10 90 L 10 70 L 30 60 L 50 65 L 70 40 L 90 35 L 110 20 L 110 90 Z" fill="url(#chartGradient)"/>
            <polyline points="10,70 30,60 50,65 70,40 90,35 110,20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="70" r="4" fill="#10b981"/>
            <circle cx="30" cy="60" r="4" fill="#10b981"/>
            <circle cx="50" cy="65" r="4" fill="#10b981"/>
            <circle cx="70" cy="40" r="4" fill="#10b981"/>
            <circle cx="90" cy="35" r="4" fill="#10b981"/>
            <circle cx="110" cy="20" r="4" fill="#10b981"/>
            <path d="M 100 25 L 110 20 L 105 30" fill="#10b981"/>
          </svg>
          <div className="text-center text-xs font-bold text-emerald-400 mt-2 tracking-wider">BULLISH</div>
        </div>

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
                        className="w-full mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors"
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
                <a href="#" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
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
                <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
                <span>•</span>
                <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
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

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        @keyframes float-diagonal {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -25px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }

        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes zoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes flip {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
        }

        @keyframes draw-line {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }

        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-diagonal { animation: float-diagonal 10s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-shake { animation: shake 4s ease-in-out infinite; }
        .animate-sway { animation: sway 5s ease-in-out infinite; }
        .animate-zoom { animation: zoom 6s ease-in-out infinite; }
        .animate-rotate-slow { animation: rotate-slow 30s linear infinite; }
        .animate-flip { animation: flip 8s ease-in-out infinite; }
        .animate-draw-line { animation: draw-line 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}