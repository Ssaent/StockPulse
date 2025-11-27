import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📧 Requesting password reset for:', email);

      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });

      console.log('✅ Reset email sent:', response.data);
      setSuccess(true);

    } catch (err) {
      console.error('❌ Forgot password failed:', err);
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                StockPulse
              </h1>
            </Link>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent password reset instructions to{' '}
              <strong className="text-white">{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The email contains a 6-digit code that expires in 10 minutes.
            </p>
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all mb-3"
            >
              Enter Reset Code
            </button>
            <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              StockPulse
            </h1>
          </Link>
          <h2 className="text-2xl font-bold mb-2 text-white">Forgot Password?</h2>
          <p className="text-gray-400">Enter your email to reset your password</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}