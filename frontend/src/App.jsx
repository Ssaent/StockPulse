import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Namaste from "./components/RgvNamaste";
import Dashboard from './pages/Dashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Security from './pages/Security';
import ForgotPassword from './pages/ForgotPassword';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import Backtesting from './pages/Backtesting';
import MarketNews from './pages/MarketNews';
import ChatSidebar from './components/chat/ChatSidebar';
import ChatToggleButton from './components/chat/ChatToggleButton';
import { useWebSocketChat } from './hooks/useWebSocketChat';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Get token and online count for the toggle button
  const token = localStorage.getItem('token');
  const { onlineCount } = useWebSocketChat(token);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/namaste" /> : <Landing />} /> {/* ✅ UPDATED */}
        <Route path="/login" element={user ? <Navigate to="/namaste" /> : <Login />} /> {/* ✅ UPDATED */}
        <Route path="/register" element={user ? <Navigate to="/namaste" /> : <Register />} /> {/* ✅ UPDATED */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/security" element={<Security />} />

        {/* OTP Verification Route */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Namaste Splash Page - NEW */}
        <Route
          path="/namaste"
          element={
            <PrivateRoute>
              <Namaste />
            </PrivateRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <PrivateRoute>
              <Watchlist />
            </PrivateRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <Portfolio />
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <Alerts />
            </PrivateRoute>
          }
        />
        <Route
          path="/backtesting"
          element={
            <PrivateRoute>
              <Backtesting />
            </PrivateRoute>
          }
        />
        <Route
          path="/news"
          element={
            <PrivateRoute>
              <MarketNews />
            </PrivateRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Chat - Only show for logged-in users */}
      {user && (
        <>
          <ChatToggleButton
            onClick={() => setChatOpen(true)}
            onlineCount={onlineCount}
            isOpen={chatOpen}
          />
          <ChatSidebar
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;