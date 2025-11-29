import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useWebSocketChat() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [authError, setAuthError] = useState('');

  const { user } = useAuth();
  const typingTimeoutRef = useRef({});

  // Get token from localStorage directly to ensure it's fresh
  const getToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    const token = getToken();

    if (!token || !user) {
      console.log('🔌 WebSocket: No token or user, skipping connection');
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    console.log('🔌 Connecting to WebSocket with token:', token ? 'Present' : 'Missing');

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token,
        userId: user.id
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected! Socket ID:', newSocket.id);
      setIsConnected(true);
      setAuthError('');
      newSocket.emit('get_history', { limit: 100 });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);

      // Handle authentication errors specifically
      if (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403')) {
        setAuthError('Authentication failed. Please log in again.');
        console.error('🔐 Auth error - clearing token');
        localStorage.removeItem('token');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ WebSocket disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect on network errors
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(() => {
          if (getToken()) {
            newSocket.connect();
          }
        }, 2000);
      }
    });

    newSocket.on('auth_error', (data) => {
      console.error('🔐 Server auth error:', data.message);
      setAuthError(data.message || 'Authentication failed');
      setIsConnected(false);
    });

    newSocket.on('chat_history', (data) => {
      console.log(`📜 Loaded ${data.messages?.length || 0} messages`);
      setMessages(data.messages || []);
    });

    newSocket.on('new_message', (message) => {
      console.log('📨 New message from:', message.username);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('online_count', (data) => {
      console.log(`👥 Online users: ${data.count}`);
      setOnlineCount(data.count || 0);
    });

    newSocket.on('user_joined', (data) => {
      console.log(`✅ ${data.username} joined the chat`);
      setOnlineCount(data.online_count || 0);
    });

    newSocket.on('user_left', (data) => {
      console.log(`❌ ${data.username} left the chat`);
      setOnlineCount(data.online_count || 0);
    });

    newSocket.on('user_typing', (data) => {
      if (data.typing) {
        setTypingUsers(prev => new Set(prev).add(data.username));

        if (typingTimeoutRef.current[data.username]) {
          clearTimeout(typingTimeoutRef.current[data.username]);
        }

        typingTimeoutRef.current[data.username] = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }
    });

    newSocket.on('error', (data) => {
      console.error('⚠️ Server error:', data.message);
      setAuthError(data.message || 'Connection error');
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [user]);

  const sendMessage = useCallback((content) => {
    const token = getToken();

    if (!socket || !isConnected) {
      setAuthError('Not connected to chat. Please refresh the page.');
      return false;
    }

    if (!token) {
      setAuthError('Not authenticated. Please log in again.');
      return false;
    }

    if (content.trim()) {
      socket.emit('send_message', { content: content.trim() });
      return true;
    }

    return false;
  }, [socket, isConnected]);

  const sendTyping = useCallback((isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { typing: isTyping });
    }
  }, [socket, isConnected]);

  // Add reconnection function
  const reconnect = useCallback(() => {
    if (socket) {
      socket.connect();
    }
  }, [socket]);

  return {
    messages,
    onlineCount,
    sendMessage,
    sendTyping,
    isConnected,
    authError,
    setAuthError,
    reconnect,
    typingUsers: Array.from(typingUsers),
    socket
  };
}