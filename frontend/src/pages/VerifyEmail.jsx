import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-email', { token });

      // Update token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      setStatus('success');
      setMessage(response.data.message);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Email verification failed');
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
        </div>

        {/* Verification Status */}
        <div className="glass rounded-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <Loader className="w-16 h-16 text-blue-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifying Your Email</h2>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">Email Verified!</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">Verification Failed</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}