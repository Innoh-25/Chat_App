import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState(['general', 'random', 'tech']);

  const connect = (userData) => {
    socket.connect();
    if (userData) {
      socket.emit('user_join', userData);
      setCurrentRoom(userData.room || 'general');
    }
  };

  const disconnect = () => {
    socket.disconnect();
  };

  const sendMessage = (message) => {
    socket.emit('send_message', { message });
  };

  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  const setTyping = (isTyping) => {
    socket.emit('typing', isTyping);
  };

  const switchRoom = (newRoom) => {
    socket.emit('switch_room', newRoom);
    setCurrentRoom(newRoom);
    setMessages([]); // Clear messages while loading new ones
  };

  const addReaction = (messageId, reaction) => {
    socket.emit('message_reaction', { 
      messageId, 
      reaction, 
      room: currentRoom 
    });
  };

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages(prev => [...prev, message]);
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages(prev => [...prev, message]);
    };

    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          type: 'system',
          message: `${data.username} joined the room`,
          timestamp: data.timestamp,
        },
      ]);
    };

    const onUserLeft = (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          type: 'system',
          message: `${data.username} left the room`,
          timestamp: data.timestamp,
        },
      ]);
    };

    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    const onRoomMessages = (data) => {
      setMessages(data.messages || []);
    };

    const onMessageUpdated = (message) => {
      setMessages(prev => 
        prev.map(msg => msg.id === message.id ? message : msg)
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('room_messages', onRoomMessages);
    socket.on('message_updated', onMessageUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('room_messages', onRoomMessages);
      socket.off('message_updated', onMessageUpdated);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    switchRoom,
    addReaction,
  };
};