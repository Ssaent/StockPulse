import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');

    setOtp(newOtp);
    document.getElementById('otp-5')?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the reset code');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Resetting password...');

      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: email,
        otp: otpCode,
        new_password: newPassword
      });

      console.log('✅ Password reset successful:', response.data);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('❌ Password reset failed:', err);

      if (err.response?.data?.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.response.data.attempts_remaining);
      }

      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Password Reset!</h2>
            <p className="text-gray-400 mb-4">Your password has been successfully reset.</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
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
          <h2 className="text-2xl font-bold mb-2 text-white">Reset Password</h2>
          <p className="text-gray-400">Enter the code sent to {email}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-300">{error}</p>
                  {attemptsRemaining < 5 && (
                    <p className="text-xs text-red-400 mt-1">
                      Attempts remaining: {attemptsRemaining}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-3 text-center text-slate-300">
                Enter 6-Digit Reset Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-800/50 border border-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    disabled={loading}
                    required
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center pt-4 border-t border-slate-700">
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Didn't receive code? Resend
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}