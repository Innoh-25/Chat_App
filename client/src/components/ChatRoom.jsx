import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile';
import DirectChat from './DirectChat';
import './ChatRoom.css';

const ChatRoom = () => {
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState(['general', 'random', 'tech']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState('room'); // 'room' or 'direct'
  const [directChatUser, setDirectChatUser] = useState(null);

  const { socket, isConnected, joinRoom, onlineUsers } = useSocket();
  const { user, logout } = useAuth();

  // Load room messages when room changes
  useEffect(() => {
    if (socket && isConnected && activeChat === 'room') {
      joinRoom(currentRoom);
      
      // Listen for room messages
      const handleRoomMessages = (data) => {
        if (data.room === currentRoom) {
          setMessages(data.messages || []);
        }
      };

      // Listen for new messages
      const handleReceiveMessage = (message) => {
        if (message.room === currentRoom && message.type !== 'direct') {
          setMessages(prev => [...prev, message]);
        }
      };

      // Listen for message updates (reactions)
      const handleMessageUpdated = (message) => {
        if (message.room === currentRoom) {
          setMessages(prev => prev.map(msg => 
            msg._id === message._id ? message : msg
          ));
        }
      };

      // Listen for message deletions
      const handleMessageDeleted = (data) => {
        if (data.room === currentRoom) {
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        }
      };

      socket.on('room_messages', handleRoomMessages);
      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_updated', handleMessageUpdated);
      socket.on('message_deleted', handleMessageDeleted);

      return () => {
        socket.off('room_messages', handleRoomMessages);
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_updated', handleMessageUpdated);
        socket.off('message_deleted', handleMessageDeleted);
      };
    }
  }, [socket, isConnected, currentRoom, activeChat, joinRoom]);

  // Listen for direct messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleDirectMessage = (message) => {
      if (activeChat === 'direct' && directChatUser && 
          (message.sender._id === directChatUser.id || message.receiver._id === directChatUser.id)) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleMessageUpdated = (message) => {
      if (message.type === 'direct' && activeChat === 'direct' && directChatUser) {
        setMessages(prev => prev.map(msg => 
          msg._id === message._id ? message : msg
        ));
      }
    };

    const handleMessageDeleted = (data) => {
      if (activeChat === 'direct') {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    socket.on('direct_message', handleDirectMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('direct_message', handleDirectMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, isConnected, activeChat, directChatUser]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRoomChange = (roomName) => {
    setCurrentRoom(roomName);
    setActiveChat('room');
    setDirectChatUser(null);
    setMessages([]); // Clear messages while loading new ones
  };

  const handleDirectMessage = (targetUser) => {
    setDirectChatUser(targetUser);
    setActiveChat('direct');
    setMessages([]); // Clear previous messages
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleBackToRooms = () => {
    setActiveChat('room');
    setDirectChatUser(null);
    setMessages([]); // Clear direct messages
  };

  const handleMessagesUpdate = (updatedMessages) => {
    setMessages(updatedMessages);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="chat-room">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <h2>
          {activeChat === 'direct' && directChatUser ? (
            `💬 ${directChatUser.username}`
          ) : (
            `#${currentRoom}`
          )}
        </h2>
        <UserProfile user={user} onLogout={logout} />
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
          <Sidebar
            currentRoom={currentRoom}
            rooms={rooms}
            onlineUsers={onlineUsers}
            onRoomChange={handleRoomChange}
            onDirectMessage={handleDirectMessage}
            onLogout={logout}
            user={user}
          />
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {activeChat === 'direct' ? (
            <DirectChat
              targetUser={directChatUser}
              onBack={handleBackToRooms}
              messages={messages}
              setMessages={setMessages}
            />
          ) : (
            <>
              <div className="chat-header">
                <div className="room-info">
                  <h2>#{currentRoom}</h2>
                  <span className="room-description">
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                  </span>
                </div>
                <UserProfile user={user} onLogout={logout} />
              </div>

              <MessageList
                messages={messages}
                currentUser={user}
                currentRoom={currentRoom}
                onMessagesUpdate={handleMessagesUpdate}
              />

              <MessageInput
                currentRoom={currentRoom}
                disabled={!isConnected}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;