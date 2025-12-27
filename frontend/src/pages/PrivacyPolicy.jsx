import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
              StockPulse
            </h1>
          </Link>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
          <p className="text-amber-200">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="lightly-luminous p-8">
          <div className="prose prose-slate max-w-none">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h3>
            <p className="text-slate-600 mb-6">
              We collect information you provide directly to us, such as your name, email address, and investment preferences
              when you create an account or use our services.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h3>
            <p className="text-slate-600 mb-6">
              We use the information we collect to provide, maintain, and improve our services, to develop new features,
              and to protect StockPulse and our users.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">3. Information Sharing</h3>
            <p className="text-slate-600 mb-6">
              We do not sell, trade, or rent your personal identification information to others. We may share generic
              aggregated demographic information not linked to any personal identification information.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h3>
            <p className="text-slate-600 mb-6">
              We implement appropriate data collection, storage and processing practices and security measures to protect
              against unauthorized access, alteration, disclosure or destruction of your personal information.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">5. Your Rights</h3>
            <p className="text-slate-300 mb-6">
              You have the right to access, correct, or delete your personal data. You can manage your information through
              your account settings or by contacting us.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">6. Contact Us</h3>
            <p className="text-slate-300">
              If you have any questions about this Privacy Policy, please contact us at privacy@stockpulse.com
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <Link
              to="/login"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}