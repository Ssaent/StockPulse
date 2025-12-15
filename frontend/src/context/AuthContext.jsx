import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    console.log('🔍 checkAuth: Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ checkAuth: No token found, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('📡 checkAuth: Calling /api/auth/me with token...');
      console.log('📡 checkAuth: Full URL:', 'http://localhost:5000/api/auth/me');
      console.log('📡 checkAuth: Headers will include:', `Authorization: Bearer ${token.substring(0, 20)}...`);
      
      const response = await authAPI.getCurrentUser();
      console.log('✅ checkAuth: Response received:', response);
      console.log('✅ checkAuth: Response status:', response.status);
      console.log('✅ checkAuth: Response data:', response.data);
      console.log('✅ checkAuth: User loaded successfully:', response.data.user.username);
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ checkAuth: Auth check failed:', error);
      console.error('❌ checkAuth: Error response:', error.response);
      console.error('❌ checkAuth: Error status:', error.response?.status);
      console.error('❌ checkAuth: Error data:', error.response?.data);
      console.error('❌ checkAuth: Error message:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🗑️ checkAuth: Token invalid, removing from localStorage');
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      console.log('🏁 checkAuth: Setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      console.log('✅ Token saved to localStorage:', token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);

      // Handle OTP verification requirement
      if (error.response?.data?.requires_verification) {
        return {
          success: false,
          requiresVerification: true,
          email: error.response.data.email
        };
      }

      throw error;
    }
  };

  const register = async (name, email, username, password) => {
    try {
      const response = await authAPI.register(name, email, username, password);
      // Register only sends OTP, doesn't return token/user yet
      return { success: true, email };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await authAPI.verifyOTP(email, otp);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      console.log('✅ OTP verification token saved:', token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  };

  const resendOTP = async (email) => {
    try {
      await authAPI.resendOTP(email);
      return { success: true };
    } catch (error) {
      console.error('Resend OTP failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    console.log('🚪 User logged out, token removed');
  };

  const resetPassword = async (email) => {
    try {
      await authAPI.resetPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await authAPI.changePassword(oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔄 AuthContext: useEffect triggered, checking auth...');
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}