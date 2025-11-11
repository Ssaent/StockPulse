import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export function useWebSocketChat(token) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const typingTimeoutRef = useRef({});

  useEffect(() => {
    if (!token) return;

    console.log('🔌 Connecting to WebSocket...');

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected!');
      setIsConnected(true);
      newSocket.emit('get_history', { limit: 100 });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('chat_history', (data) => {
      console.log(`📜 Loaded ${data.messages.length} messages`);
      setMessages(data.messages);
    });

    newSocket.on('new_message', (message) => {
      console.log('📨 New message:', message.username);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('online_count', (data) => {
      console.log(`👥 Online: ${data.count}`);
      setOnlineCount(data.count);
    });

    newSocket.on('user_joined', (data) => {
      console.log(`✅ ${data.username} joined`);
      setOnlineCount(data.online_count);
    });

    newSocket.on('user_left', (data) => {
      console.log(`❌ ${data.username} left`);
      setOnlineCount(data.online_count);
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
      alert(data.message);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      newSocket.close();
    };
  }, [token]);

  const sendMessage = useCallback((content) => {
    if (socket && isConnected && content.trim()) {
      socket.emit('send_message', { content: content.trim() });
    }
  }, [socket, isConnected]);

  const sendTyping = useCallback((isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { typing: isTyping });
    }
  }, [socket, isConnected]);

  return {
    messages,
    onlineCount,
    sendMessage,
    sendTyping,
    isConnected,
    typingUsers: Array.from(typingUsers),
    socket
  };
}