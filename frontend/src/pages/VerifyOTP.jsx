import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');

    setOtp(newOtp);
    document.getElementById('otp-5')?.focus();
  };

  // Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Verifying OTP...');

      const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: email,
        otp: otpCode
      });

      console.log('✅ OTP verified:', response.data);

      // Save token
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      setSuccess('Email verified successfully! Redirecting...');

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('❌ OTP verification failed:', err);

      if (err.response?.data?.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.response.data.attempts_remaining);
      }

      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']); // Clear OTP
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      console.log('📧 Resending OTP...');

      const response = await axios.post('http://localhost:5000/api/auth/resend-otp', {
        email: email
      });

      console.log('✅ OTP resent:', response.data);

      setSuccess('New OTP sent! Please check your email.');
      setTimeLeft(300); // Reset timer to 5 minutes
      setAttemptsRemaining(5); // Reset attempts
      setOtp(['', '', '', '', '', '']); // Clear OTP
      document.getElementById('otp-0')?.focus();

    } catch (err) {
      console.error('❌ Resend OTP failed:', err);
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              StockPulse
            </h1>
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-400">
            We've sent a 6-digit code to <strong className="text-white">{email}</strong>
          </p>
        </div>

        {/* Verification Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            )}

            {/* Error Message */}
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

            {/* OTP Input Boxes */}
            <div>
              <label className="block text-sm font-medium mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={loading || success}
                    required
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">
                  Code expires in: <strong>{formatTime(timeLeft)}</strong>
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success || otp.join('').length !== 6}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verifying...
                </span>
              ) : success ? (
                'Verified ✓'
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending || timeLeft > 240} // Can resend after 1 minute (60 seconds)
                className="text-blue-400 hover:text-blue-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
              {timeLeft > 240 && (
                <p className="text-xs text-gray-500 mt-1">
                  Available in {formatTime(timeLeft - 240)}
                </p>
              )}
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Wrong email?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register again
              </Link>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          🔒 Never share your verification code with anyone
        </p>
      </div>
    </div>
  );
}