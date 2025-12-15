import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useWebSocketChat() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);  // ✅ PREVENT MULTIPLE CONNECTIONS
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [authError, setAuthError] = useState('');

  // ✅ Get user for optional userId, but don't depend on it
  const { user } = useAuth();
  const typingTimeoutRef = useRef({});

  // Get token from localStorage directly to ensure it's fresh
  const getToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    // ✅ CHANGED: Connect immediately when token exists
    const token = getToken();
    
    // If no token at all, skip entirely
    if (!token) {
      console.log('🔌 WebSocket: No token, skipping connection');
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setIsConnected(false);
      setAuthError('Not authenticated. Please log in again.');
      return;
    }

    // ✅ CHANGED: Always attempt connection when token exists
    // Let server-side auth handle validation
    console.log('🔌 Connecting to WebSocket with token...');
    
    // Prevent multiple connections
    if (socket || isConnecting) {
      console.log('🔌 Socket already exists or connecting, skipping...');
      return;
    }
    
    setIsConnecting(true);

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token,
        userId: user?.id // Optional, server will validate
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected! Socket ID:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);  // ✅ RESET CONNECTING STATE
      setAuthError('');

      // Get chat history
      newSocket.emit('get_history', { limit: 50 });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);  // ✅ RESET ON DISCONNECT

      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected, attempting reconnect...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 WebSocket connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);  // ✅ RESET ON ERROR

      if (error.message.includes('Authentication failed') || error.message.includes('Not authenticated')) {
        setAuthError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    newSocket.on('user_joined', (data) => {
      console.log('👋 User joined:', data);
      setOnlineCount(data.online_count);
    });

    newSocket.on('user_left', (data) => {
      console.log('👋 User left:', data);
      setOnlineCount(data.online_count);
    });

    newSocket.on('online_count', (data) => {
      setOnlineCount(data.count);
    });

    newSocket.on('new_message', (message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    newSocket.on('chat_history', (data) => {
      console.log('📚 Chat history received:', data.total, 'messages');
      setMessages(data.messages || []);
    });

    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.typing) {
          newSet.add(data.username || data.user_id);
        } else {
          newSet.delete(data.username || data.user_id);
        }
        return newSet;
      });

      // Clear typing indicator after 3 seconds
      if (data.typing) {
        if (typingTimeoutRef.current[data.user_id]) {
          clearTimeout(typingTimeoutRef.current[data.user_id]);
        }
        typingTimeoutRef.current[data.user_id] = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username || data.user_id);
            return newSet;
          });
        }, 3000);
      }
    });

    newSocket.on('reaction_update', (data) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.message_id) {
          // Update reactions in message
          const reactions = msg.reactions || [];
          // Update reaction logic here
          return { ...msg, reactions };
        }
        return msg;
      }));
    });

    newSocket.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
      setAuthError(error.message || 'Connection error');
      setIsConnecting(false);  // ✅ RESET ON ERROR
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (newSocket) {
        newSocket.close();
      }
      setIsConnecting(false);  // ✅ RESET ON CLEANUP
    };
  }, []); // ✅ CHANGED: No dependencies - connect once on mount

  const sendMessage = useCallback((content) => {
    if (!socket || !isConnected) {
      console.warn('🚫 Cannot send message: WebSocket not connected');
      setAuthError('Not connected. Please refresh the page.');
      return false;
    }

    const token = getToken();
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

  const reactToMessage = useCallback((messageId, emoji) => {
    if (socket && isConnected && messageId && emoji) {
      socket.emit('react_message', { message_id: messageId, emoji });
      return true;
    }
    return false;
  }, [socket, isConnected]);

  return {
    messages,
    onlineCount,
    isConnected,
    typingUsers: Array.from(typingUsers),
    authError,
    sendMessage,
    sendTyping,
    reactToMessage,
    clearAuthError: () => setAuthError('')
  };
}