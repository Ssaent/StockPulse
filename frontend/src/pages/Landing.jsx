import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  // Mock chart data
  const chartData = [
    { time: '9:00', value: 21800 },
    { time: '10:00', value: 21850 },
    { time: '11:00', value: 21820 },
    { time: '12:00', value: 21900 },
    { time: '1:00', value: 21950 },
    { time: '2:00', value: 22000 },
    { time: '3:00', value: 22100 }
  ];

  const features = [
    {
      title: "AI-Powered Predictions",
      description: "Advanced LSTM neural networks analyze years of market data to predict stock movements with precision.",
      icon: "🤖"
    },
    {
      title: "Real-Time Analysis",
      description: "Get instant insights on 1000+ NSE/BSE stocks with live market data and technical indicators.",
      icon: "⚡"
    },
    {
      title: "Smart Alerts",
      description: "Never miss an opportunity. Set custom alerts and get notified when your targets are hit.",
      icon: "🔔"
    },
    {
      title: "Portfolio Tracking",
      description: "Monitor your investments with beautiful visualizations and detailed performance metrics.",
      icon: "📊"
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

  return (
    <div className="bg-black text-white min-h-screen font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Clickable Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-semibold">StockPulse</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it Works</a>
            <a href="#accuracy" className="hover:text-blue-400 transition-colors">Accuracy</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm hover:text-blue-400 transition-colors">Sign In</Link>
            <Link to="/register" className="px-4 py-2 bg-blue-500 rounded-full text-sm font-medium hover:bg-blue-600 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-50"
             style={{ transform: `translateY(${scrollY * 0.5}px)` }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">146 predictions validated • 50% accuracy</span>
          </div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Predict Markets
            </span>
            <br />
            <span className="text-white">With AI Precision</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto animate-slide-up-delay">
            Advanced LSTM neural networks analyze market patterns to give you an edge in stock trading.
            Make informed decisions with real-time AI predictions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-delay">
            <Link to="/register" className="group px-8 py-4 bg-blue-500 rounded-full font-semibold text-lg hover:bg-blue-600 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
              Start Predicting Free
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a href="#demo" className="px-8 py-4 bg-white/5 backdrop-blur-xl rounded-full font-semibold text-lg border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
              See Live Demo
            </a>
          </div>

          {/* Live Chart Preview */}
          <div className="relative max-w-4xl mx-auto animate-slide-up-slow">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 blur-3xl" />
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-400">NIFTY 50</div>
                  <div className="text-3xl font-bold text-white">21,894.35</div>
                  <div className="text-sm text-green-400">+125.40 (+0.58%)</div>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">Live</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} fill="url(#colorValue)" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>AI predictions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 animate-bounce">
            <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Built for <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Intelligence</span>
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
                className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border border-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20 ${
                  activeFeature === index ? 'ring-2 ring-blue-500/50' : ''
                }`}
                style={{
                  transform: scrollY > 500 ? 'translateY(0)' : 'translateY(50px)',
                  opacity: scrollY > 500 ? 1 : 0,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-3xl transition-all duration-500 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-purple-600/10" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                146+
              </div>
              <div className="text-xl text-gray-300">Predictions Validated</div>
              <div className="text-sm text-gray-500 mt-2">Real-time accuracy tracking</div>
            </div>
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                1000+
              </div>
              <div className="text-xl text-gray-300">Stocks Analyzed</div>
              <div className="text-sm text-gray-500 mt-2">NSE & BSE coverage</div>
            </div>
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                50%
              </div>
              <div className="text-xl text-gray-300">Prediction Accuracy</div>
              <div className="text-sm text-gray-500 mt-2">Continuously improving</div>
            </div>
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
              { step: "03", title: "Get Predictions", desc: "Receive AI-powered predictions and make informed trades." }
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            Ready to start <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              predicting?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of smart investors using AI to make better trading decisions
          </p>

          <Link to="/register" className="inline-block px-12 py-5 bg-blue-500 rounded-full font-bold text-xl hover:bg-blue-600 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
            Get Started Free →
          </Link>

          <div className="mt-8 text-sm text-gray-500">
            No credit card required • Free forever • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
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