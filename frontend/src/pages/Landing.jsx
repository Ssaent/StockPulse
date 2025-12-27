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
      title: "AI-Powered Analysis",
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
    <div className="bg-transparent min-h-screen font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'engineered-glass mx-6 mt-4' : 'bg-transparent'
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

          <div className="hidden md:flex items-center gap-8 text-sm font-light">
            <a href="#features" className="text-amber-100 hover:text-amber-50 material-transition">Features</a>
            <a href="#how-it-works" className="text-amber-100 hover:text-amber-50 material-transition">How it Works</a>
            <a href="#accuracy" className="text-amber-100 hover:text-amber-50 material-transition">Accuracy</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-light text-amber-100 hover:text-amber-50 material-transition">Sign In</Link>
            <Link to="/register" className="soft-polymer intelligence-accent px-6 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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
          {/* Spectral Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 spectral-glass mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">146 analyses validated • 50% accuracy</span>
          </div>

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
            <Link to="/register" className="soft-polymer intelligence-accent group px-8 py-4 text-lg font-medium">
              Start Analyzing Free
              <span className="inline-block ml-2 group-hover:translate-x-1 physical-hover">→</span>
            </Link>
            <a href="#demo" className="engineered-glass px-8 py-4 text-lg font-medium physical-hover">
              See Live Demo
            </a>
          </div>

          {/* Quantum Chart Preview */}
          <div className="relative max-w-4xl mx-auto animate-slide-up-slow">
            <div className="absolute inset-0 opacity-30"
                 style={{
                   background: `radial-gradient(ellipse 50% 30% at 50% 50%, rgba(6, 182, 212, 0.1), transparent)`
                 }} />
            <div className="relative lightly-luminous p-8">
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
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} fill="url(#colorValue)" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span>AI analysis</span>
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
                className={`group relative engineered-glass p-8 material-transition ${
                  activeFeature === index ? 'ring-2 ring-black/50' : ''
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
        <div className="absolute inset-0 opacity-6"
             style={{
               background: `radial-gradient(ellipse 45% 30% at 50% 50%, rgba(34, 197, 94, 0.04), transparent)`
             }} />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                146+
              </div>
              <div className="text-xl text-gray-300">Analyses Validated</div>
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
              <div className="text-xl text-gray-300">Analysis Accuracy</div>
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