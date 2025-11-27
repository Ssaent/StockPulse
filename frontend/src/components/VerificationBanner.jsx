import React, { useState } from 'react';
import { AlertCircle, Mail, X } from 'lucide-react';
import axios from 'axios';

export default function VerificationBanner({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.is_verified || dismissed) {
    return null;
  }

  const resendVerification = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/resend-verification');
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-300">
              <strong>Email not verified.</strong> Please check your inbox and verify your email to access all features.
            </p>
            {message && (
              <p className="text-xs text-gray-400 mt-1">{message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resendVerification}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {loading ? 'Sending...' : 'Resend Email'}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}