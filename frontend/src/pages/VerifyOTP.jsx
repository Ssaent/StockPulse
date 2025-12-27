import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userName, setUserName] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP } = useAuth();

  // Get email and username from navigation state
  useEffect(() => {
    const stateEmail = location.state?.email;
    const stateUsername = location.state?.username; // NEW: Get username from state

    if (stateEmail) {
      setEmail(stateEmail);
      // FIXED: Use provided username or fallback to name from email
      if (stateUsername) {
        setUserName(stateUsername);
      } else {
        // Fallback: extract name from email
        const nameFromEmail = stateEmail.split('@')[0];
        setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
      }
    } else {
      // If no email in state, try to get from localStorage or prompt
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        const nameFromEmail = storedEmail.split('@')[0];
        setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
      } else {
        // Redirect back if no email available
        navigate('/register');
      }
    }
  }, [location, navigate]);

  // Handle OTP input changes
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  // Handle key events for OTP inputs
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
      setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
    }
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
    setOtp(newOtp);

    // Focus the last input
    const inputs = document.querySelectorAll('.otp-input');
    const focusIndex = Math.min(pasteData.length, 5);
    if (inputs[focusIndex]) {
      inputs[focusIndex].focus();
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await resendOTP(email);
      setSuccess('New OTP sent to your email!');
      setResendCooldown(30); // 30 seconds cooldown

      // Start cooldown timer
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(email, otpString);

      if (result.success) {
        setSuccess('Email verified successfully! Redirecting...');

        // Clear pending email from storage
        localStorage.removeItem('pendingVerificationEmail');

        // Redirect to Namaste page after short delay
        setTimeout(() => {
          navigate('/namaste');
        }, 1500);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.error || 'Verification failed. Please check the OTP and try again.');

      // Clear OTP on error for security
      setOtp(['', '', '', '', '', '']);

      // Focus first input
      const firstInput = document.querySelector('.otp-input');
      if (firstInput) firstInput.focus();
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all OTP digits are entered
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 6 && !loading) {
      handleVerify(new Event('submit'));
    }
  }, [otp]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-purple-500/30 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-indigo-500/15 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-emerald-500/25 rounded-full animate-pulse"></div>

        {/* Security icons */}
        <div className="absolute top-1/2 left-1/6 opacity-10">
          <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div className="absolute bottom-1/4 left-1/6 opacity-10">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              StockPulse
            </h1>
          </Link>

          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h2>

            {userName && (
              <p className="text-lg text-slate-300 mb-1">
                Welcome, <span className="font-semibold text-emerald-400">{userName}</span>! 👋
              </p>
            )}

            <p className="text-slate-400">
              Enter the 6-digit code sent to
            </p>
            <p className="text-slate-300 font-medium">{email}</p>
          </div>
        </div>

        {/* Verification Card */}
        <div className="lightly-luminous p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-emerald-300">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleVerify}>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-300 mb-4 text-center">
                6-Digit Verification Code
              </label>

              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((data, index) => (
                  <input
                    key={index}
                    className="otp-input w-12 h-12 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-white text-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm"
                    type="text"
                    name="otp"
                    maxLength="1"
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onFocus={e => e.target.select()}
                    disabled={loading || success}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <p className="text-center text-sm text-slate-400">
                Check your email for the verification code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success || otp.join('').length !== 6}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 mb-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-3">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || resendCooldown > 0}
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-3 text-sm text-slate-500">
              <svg className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                For security reasons, the OTP will expire in 5 minutes. Make sure to check your spam folder if you don't see the email.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-slate-400">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Back to Login
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure email verification
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .otp-input::-webkit-outer-spin-button,
        .otp-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .otp-input {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}