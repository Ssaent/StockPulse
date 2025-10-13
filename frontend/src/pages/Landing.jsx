import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Shield, Zap, Star, Activity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
              <TrendingUp className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              StockPulse
            </h1>
          </div>

          <p className="text-3xl font-bold mb-4">
            AI-Powered Stock Predictions for Indian Markets
          </p>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Advanced LSTM neural networks with 28+ technical indicators.
            Real-time predictions for NSE & BSE stocks with 75-90% accuracy.
          </p>

          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg">
              Get Started Free →
            </Link>
            <Link to="/login" className="px-6 py-3 glass rounded-lg font-semibold hover:bg-white/10 transition-all">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">AI Predictions</h3>
            <p className="text-sm text-gray-400">
              Multi-timeframe forecasts (intraday, weekly, monthly, long-term)
              with confidence scores up to 95%
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">Technical Analysis</h3>
            <p className="text-sm text-gray-400">
              RSI, MACD, Bollinger Bands, ATR, ADX, and 20+ more indicators
              analyzed in real-time
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">Portfolio Tracking</h3>
            <p className="text-sm text-gray-400">
              Track your investments with live P&L, performance analytics,
              and profit/loss calculations
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">Real-Time Alerts</h3>
            <p className="text-sm text-gray-400">
              Set price alerts and get notified when stocks hit your targets
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">Smart Watchlist</h3>
            <p className="text-sm text-gray-400">
              Save your favorite stocks and monitor them with live price updates
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-bold mb-2 text-lg">2000+ Stocks</h3>
            <p className="text-sm text-gray-400">
              Complete coverage of NSE and BSE markets with instant analysis
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="card text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              2000+
            </div>
            <p className="text-gray-400">NSE/BSE Stocks</p>
          </div>

          <div className="card text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
              75-90%
            </div>
            <p className="text-gray-400">Prediction Accuracy</p>
          </div>

          <div className="card text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              28+
            </div>
            <p className="text-gray-400">Technical Features</p>
          </div>

          <div className="card text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
              10K+
            </div>
            <p className="text-gray-400">Concurrent Users</p>
          </div>
        </div>

        {/* CTA */}
        <div className="card mt-20 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-400 mb-6">Join thousands of investors making smarter decisions with AI</p>
          <Link to="/register" className="btn-primary inline-block">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}