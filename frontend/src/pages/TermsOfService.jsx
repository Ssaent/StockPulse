import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h2>
          <p className="text-amber-200">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="lightly-luminous p-8">
          <div className="prose prose-invert prose-slate max-w-none">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h3>
            <p className="text-slate-600 mb-6">
              By accessing and using StockPulse, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">2. Use License</h3>
            <p className="text-slate-600 mb-6">
              Permission is granted to temporarily use StockPulse for personal, non-commercial transitory viewing only.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">3. Investment Disclaimer</h3>
            <p className="text-slate-600 mb-6">
              StockPulse provides AI-powered stock analyses for informational purposes only. All investment decisions
              and responsibilities remain solely with the user. Past performance does not guarantee future results.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">4. User Responsibilities</h3>
            <p className="text-slate-600 mb-6">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept
              responsibility for all activities that occur under your account.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">5. Limitation of Liability</h3>
            <p className="text-slate-600 mb-6">
              StockPulse shall not be held liable for any investment losses, damages, or financial decisions made based
              on the information provided through our platform.
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">6. Contact Information</h3>
            <p className="text-slate-300">
              If you have any questions about these Terms, please contact us at support@stockpulse.com
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