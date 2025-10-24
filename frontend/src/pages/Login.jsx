// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NamasteWelcome from '../components/NamasteWelcome';

function formatRGVError(err) {
  // Network or unknown fetch/axios style errors
  const status = err?.response?.status;
  const apiMsg = err?.response?.data?.error || err?.message || '';

  if (status === 400) return "Bad request. Clean it up and try again.";
  if (status === 401) return "Credentials don’t check out. Try again—carefully.";
  if (status === 403) return "Access denied. You don’t have the keys to this door.";
  if (status === 404) return "Endpoint not found. Someone moved the street sign.";
  if (status === 409) return "Conflict. This account is already in play.";
  if (status === 422) return "Invalid payload. Keep it simple, keep it correct.";
  if (status === 429) return "Too many attempts. Step back for a minute.";
  if (status >= 500) return "Server’s having a bad day. It’s on us, not you.";

  // No status? Likely network/cors
  if (!status && apiMsg.toLowerCase().includes('network')) {
    return "No signal. Check your connection and try again.";
  }

  // Fallbacks
  if (apiMsg) return apiMsg;
  return "Login failed. Keep it sharp and try again.";
}

function validate(email, password) {
  if (!email || !password) return "Email and password—both. No excuses.";
  // light email check
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!ok) return "That email doesn’t look real. Fix it.";
  if (password.length < 6) return "Password’s too short. Make it count (6+).";
  return null;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const v = validate(email, password);
    if (v) { setErrorMsg(v); return; }

    setLoading(true);
    try {
      const userData = await login(email, password);
      const name = userData?.name || userData?.email?.split('@')?.[0] || 'Friend';
      setUserName(name);
      // RGV move: we don’t waste a beat—straight to welcome
      setShowWelcome(true);
    } catch (err) {
      setErrorMsg(formatRGVError(err));
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative min-h-screen">
      {/* Post-login welcome overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50">
          <NamasteWelcome userName={userName} onComplete={handleWelcomeComplete} />
        </div>
      )}

      {/* Background: RGV neon-noir, no rain */}
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            'radial-gradient(120% 100% at 70% 10%, #0e1220 0%, #05070c 50%, #000 100%)',
        }}
      >
        <div className="w-full max-w-md relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          {/* neon ghosts */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.30) 0%, transparent 70%)' }}
          />
          {/* scanlines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 3px)',
            }}
          />

          <div className="relative z-10 p-8 bg-black/30 backdrop-blur">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
              <p className="text-gray-400">Log in to <span className="text-white/90 font-semibold">StockPulse</span></p>
            </div>

            {/* Error bar (RGV tone) */}
            {errorMsg && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={[
                  'w-full py-3 px-4 rounded-lg font-semibold text-white transition-all',
                  loading
                    ? 'bg-white/10 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-[1.01]',
                ].join(' ')}
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <div className="text-center text-sm text-gray-400">
                Don’t have an account?{' '}
                <Link to="/register" className="text-blue-300 hover:text-blue-200 font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Local styles only */}
      <style>{`
        /* Keep animations subtle; RGV doesn't do fireworks here */
      `}</style>
    </div>
  );
}
