import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'password') {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const pwdErrors = validatePassword(formData.password);
    if (pwdErrors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Sending registration request...');

      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      console.log('✅ Registration response:', response.data);

      // Redirect to OTP verification page
      navigate('/verify-otp', {
        state: {
          email: formData.email.trim().toLowerCase(),
          message: response.data.message
        }
      });

    } catch (err) {
      console.error('❌ Registration error:', err);

      let errorMessage = 'Registration failed. Please try again.';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      if (err.response?.data?.details) {
        if (Array.isArray(err.response.data.details)) {
          setPasswordErrors(err.response.data.details);
          errorMessage = 'Password requirements not met';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold mb-2">Create Account</h2>
          <p className="text-gray-400">Start your investment journey today</p>
        </div>

        {/* Register Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map((req, i) => {
                    const errors = validatePassword(formData.password);
                    const isValid = !errors.includes(req);
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={isValid ? 'text-green-400' : 'text-gray-500'}>{req}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-300">{error}</p>
                  {passwordErrors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {passwordErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-400">• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Terms & Privacy */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}