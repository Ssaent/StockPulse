// frontend/src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  Star,
  Activity,
} from 'lucide-react';

/* ---------- RGV (no-rain) primitives ---------- */
const NoirPanel = ({ className = '', children }) => (
  <section
    className={[
      'relative overflow-hidden rounded-2xl p-6 border border-white/10',
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
  </section>
);

/* ---------- Landing ---------- */
export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="container mx-auto px-6 py-20">
        <NoirPanel className="p-10">
          <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(168,85,247,0.22) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 10px 28px rgba(59,130,246,0.25)',
                }}
                aria-hidden
              >
                <TrendingUp className="w-10 h-10 text-blue-300" />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
                StockPulse
              </h1>
            </div>

            <p className="text-2xl md:text-3xl font-bold mb-3">
              AI-Powered Stock Predictions for Indian Markets
            </p>

            <p className="text-lg md:text-xl text-gray-300/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Advanced LSTM ensembles fused with 28+ technical indicators.
              Real-time forecasts for NSE &amp; BSE with production-grade reliability.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-base md:text-lg px-6 py-3 rounded-lg"
              >
                Get Started Free →
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-lg font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Sign In
              </Link>
            </div>
          </header>

          {/* Mini trust strip */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { k: 'Coverage', v: 'NSE & BSE' },
              { k: 'Latency', v: '< 1.2s' },
              { k: 'Uptime', v: '99.9%' },
              { k: 'TLS', v: 'AES-256' },
            ].map((i) => (
              <div
                key={i.k}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-center"
              >
                <div className="text-gray-400">{i.k}</div>
                <div className="font-semibold">{i.v}</div>
              </div>
            ))}
          </div>
        </NoirPanel>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            icon={<Activity className="w-6 h-6 text-blue-300" />}
            title="AI Predictions"
            desc="Multi-timeframe forecasts (intraday, weekly, monthly, long-term) with calibrated confidence."
            tint="59,130,246"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6 text-purple-300" />}
            title="Technical Analysis"
            desc="RSI, MACD, Bollinger Bands, ATR, ADX and 20+ indicators computed in real-time."
            tint="168,85,247"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-green-300" />}
            title="Portfolio Tracking"
            desc="Live P&L, drawdown, risk buckets and performance analytics that scale."
            tint="34,197,94"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-yellow-300" />}
            title="Real-Time Alerts"
            desc="Price/Rsi/Macd triggers with instant notifications across devices."
            tint="234,179,8"
          />
          <FeatureCard
            icon={<Star className="w-6 h-6 text-pink-300" />}
            title="Smart Watchlist"
            desc="Follow favorites with live quotes, news sentiment and corporate actions."
            tint="236,72,153"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6 text-cyan-300" />}
            title="2000+ Stocks"
            desc="Full-coverage for NSE/BSE tickers with instant lookups and caching."
            tint="34,211,238"
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          <Stat k="2000+" v="NSE/BSE Stocks" from="blue-300" to="purple-300" />
          <Stat k="75–90%" v="Prediction Accuracy*" from="green-300" to="blue-300" />
          <Stat k="28+" v="Technical Features" from="purple-300" to="pink-300" />
          <Stat k="10K+" v="Concurrent Users" from="yellow-300" to="orange-300" />
        </div>

        {/* CTA */}
        <NoirPanel className="mt-14 text-center p-10">
          <h2 className="text-3xl font-bold mb-3">Ready to Start?</h2>
          <p className="text-gray-300/80 mb-6">
            Join thousands of investors making sharper decisions with AI.
          </p>
          <Link to="/register" className="btn-primary inline-block text-lg px-6 py-3 rounded-lg">
            Create Free Account
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            *Accuracy varies by asset regime and timeframe.
          </p>
        </NoirPanel>
      </div>

      {/* local keyframes only (no global CSS edits) */}
      <style>{`
        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 22px 60px rgba(0,0,0,0.45);
        }
        .btn-primary {
          background: linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(168,85,247,0.9) 100%);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 12px 34px rgba(59,130,246,0.35);
        }
        .btn-primary:hover { filter: brightness(1.05); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}

/* ---------- Bits ---------- */
function FeatureCard({ icon, title, desc, tint = '59,130,246' }) {
  return (
    <div
      className="card cursor-pointer transition-transform hover:scale-[1.02] relative overflow-hidden"
      role="article"
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full blur-2xl opacity-25"
        style={{ background: `radial-gradient(circle, rgba(${tint},0.35) 0%, transparent 70%)` }}
      />
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{
          background: `linear-gradient(135deg, rgba(${tint},0.18) 0%, rgba(${tint},0.06) 100%)`,
          border: `1px solid rgba(${tint},0.28)`,
          boxShadow: `0 8px 22px rgba(${tint},0.18)`,
        }}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="font-bold mb-2 text-lg">{title}</h3>
      <p className="text-sm text-gray-300/80 leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ k, v, from, to }) {
  return (
    <div className="card text-center">
      <div
        className={`text-4xl font-extrabold bg-gradient-to-r from-${from} to-${to} bg-clip-text text-transparent mb-2`}
        style={{ letterSpacing: '-0.02em' }}
      >
        {k}
      </div>
      <p className="text-gray-300/80">{v}</p>
    </div>
  );
}
