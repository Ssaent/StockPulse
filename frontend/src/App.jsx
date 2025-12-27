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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // ✅ REMOVED: useWebSocketChat hook from here to prevent duplicate connections
  // ✅ ADDED: Static onlineCount for now, can be shared from WebSocket context later
  const [onlineCount, setOnlineCount] = useState(0);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/namaste" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/namaste" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/namaste" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/security" element={<Security />} />

        {/* OTP Verification Route */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Namaste Splash Page */}
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
          path="/market-news"
          element={
            <PrivateRoute>
              <MarketNews />
            </PrivateRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Chat - Show during loading if token exists, or when user exists */}
      {/* ✅ FIXED: Show chat components during auth loading to allow WebSocket connection */}
      {(user || localStorage.getItem('token')) && (
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