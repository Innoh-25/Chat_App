import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Identify user to server (redundant but ensures user is tracked)
      newSocket.emit('user_identified', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Online users events
    newSocket.on('online_users', (users) => {
      console.log(`📊 Online users updated: ${users.length} users`);
      setOnlineUsers(users);
    });

    // Room messages events
    newSocket.on('room_messages', (data) => {
      console.log(`Received ${data.messages.length} messages for room: ${data.room}`);
    });

    newSocket.on('receive_message', (message) => {
      console.log('New message received:', message.content);
    });

    // Direct message events
    newSocket.on('direct_message', (message) => {
      console.log('New direct message received:', message.content);
    });

    newSocket.on('direct_chat_ready', (data) => {
      console.log('Direct chat ready with:', data.withUser?.username);
    });

    newSocket.on('direct_chat_messages', (data) => {
      console.log('Direct chat messages loaded:', data.messages.length);
    });

    newSocket.on('direct_chat_started', (data) => {
      console.log('Direct chat started by:', data.withUser?.username);
    });

    // Message update events (for reactions)
    newSocket.on('message_updated', (message) => {
      console.log('Message updated with reactions');
    });

    // Message deletion events
    newSocket.on('message_deleted', (data) => {
      console.log('Message deleted:', data.messageId);
    });

    // Error events
    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
    });

    // Typing events
    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.username !== data.username || u.room !== data.room);
        return [...filtered, data];
      });
    });

    newSocket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.username !== data.username || u.room !== data.room));
    });

    // User join/leave events
    newSocket.on('user_joined', (data) => {
      console.log(`User joined: ${data.username}`);
    });

    newSocket.on('user_left', (data) => {
      console.log(`User left: ${data.username}`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user, token]);

  const joinRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomName);
    }
  };

  const sendMessage = (content, room) => {
    if (socket && isConnected) {
      socket.emit('send_message', { content, room });
    }
  };

  const sendDirectMessage = (toUserId, content) => {
    if (socket && isConnected) {
      socket.emit('direct_message', { toUserId, content });
    }
  };

  const startDirectChat = (targetUserId) => {
    if (socket && isConnected) {
      socket.emit('start_direct_chat', targetUserId);
    }
  };

  const startTyping = (room) => {
    if (socket && isConnected) {
      socket.emit('typing_start', room);
    }
  };

  const stopTyping = (room) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', room);
    }
  };

  const addReaction = (messageId, reaction, room) => {
    if (socket && isConnected) {
      socket.emit('message_reaction', { messageId, reaction, room });
    }
  };

  const deleteMessage = (messageId, room) => {
    if (socket && isConnected) {
      socket.emit('delete_message', { messageId, room });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinRoom,
    sendMessage,
    sendDirectMessage,
    startDirectChat,
    startTyping,
    stopTyping,
    addReaction,
    deleteMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};