import React from 'react';
import { Link } from 'react-router-dom';

export default function Security() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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
          <h2 className="text-4xl font-bold text-white mb-4">Security</h2>
          <p className="text-slate-400">Protecting your data and investments</p>
        </div>

        {/* Content */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 p-8 border border-slate-800">
          <div className="prose prose-invert prose-slate max-w-none">
            <h3 className="text-2xl font-bold text-white mb-4">Bank-Level Security</h3>
            <p className="text-slate-300 mb-6">
              StockPulse employs enterprise-grade security measures to protect your financial data and personal information.
              Our security infrastructure is designed to meet the highest industry standards.
            </p>

            <h3 className="text-2xl font-bold text-white mb-4">Data Encryption</h3>
            <p className="text-slate-300 mb-6">
              All data transmitted between your device and our servers is encrypted using TLS 1.3. Your personal information
              and investment data are encrypted at rest using AES-256 encryption.
            </p>

            <h3 className="text-2xl font-bold text-white mb-4">Two-Factor Authentication</h3>
            <p className="text-slate-300 mb-6">
              We support OTP-based email verification and are working on implementing additional 2FA methods to provide
              multiple layers of security for your account.
            </p>

            <h3 className="text-2xl font-bold text-white mb-4">Secure Infrastructure</h3>
            <p className="text-slate-300 mb-6">
              Our infrastructure is regularly audited and monitored for security vulnerabilities. We employ firewalls,
              intrusion detection systems, and continuous security monitoring.
            </p>

            <h3 className="text-2xl font-bold text-white mb-4">Privacy First</h3>
            <p className="text-slate-300 mb-6">
              We follow privacy-by-design principles and minimize data collection to only what's necessary to provide
              our services. Your data is never sold to third parties.
            </p>

            <h3 className="text-2xl font-bold text-white mb-4">Security Tips</h3>
            <ul className="text-slate-300 mb-6 list-disc list-inside space-y-2">
              <li>Use a strong, unique password for your StockPulse account</li>
              <li>Never share your login credentials with anyone</li>
              <li>Enable email notifications for account activity</li>
              <li>Log out from shared devices</li>
              <li>Keep your contact information up to date</li>
            </ul>

            <h3 className="text-2xl font-bold text-white mb-4">Reporting Security Issues</h3>
            <p className="text-slate-300">
              If you discover a security vulnerability or have security concerns, please contact us immediately at
              security@stockpulse.com
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