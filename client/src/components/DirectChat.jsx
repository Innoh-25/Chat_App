import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './DirectChat.css';

const DirectChat = ({ targetUser, onBack, messages, setMessages }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected, startDirectChat, sendDirectMessage } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected || !targetUser) return;

    // Start direct chat and load previous messages
    startDirectChat(targetUser.id);

    const handleDirectChatMessages = (data) => {
      setMessages(data.messages || []);
      setIsLoading(false);
      console.log('Direct chat messages loaded:', data.messages.length);
    };

    const handleDirectMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('direct_chat_messages', handleDirectChatMessages);
    socket.on('direct_message', handleDirectMessage);

    return () => {
      socket.off('direct_chat_messages', handleDirectChatMessages);
      socket.off('direct_message', handleDirectMessage);
    };
  }, [socket, isConnected, targetUser, startDirectChat, setMessages]);

  const handleSendMessage = (content) => {
    if (socket && isConnected && targetUser) {
      sendDirectMessage(targetUser.id, content);
    }
  };

  const handleMessagesUpdate = (updatedMessages) => {
    setMessages(updatedMessages);
  };

  if (!targetUser) {
    return (
      <div className="direct-chat-placeholder">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="direct-chat-loading">
        <div className="loading-spinner"></div>
        <p>Starting chat with {targetUser.username}...</p>
      </div>
    );
  }

  return (
    <div className="direct-chat">
      <div className="direct-chat-header">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="chat-partner-info">
          {targetUser.avatar ? (
            <img src={targetUser.avatar} alt={targetUser.username} className="partner-avatar" />
          ) : (
            <div className="partner-avatar-placeholder">
              {targetUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3>{targetUser.username}</h3>
            <span className="online-status">Online</span>
          </div>
        </div>
      </div>

      <MessageList
        messages={messages}
        currentUser={user}
        currentRoom={`direct_${targetUser.id}`}
        onMessagesUpdate={handleMessagesUpdate}
      />

      <MessageInput
        currentRoom={`direct_${targetUser.id}`}
        disabled={!isConnected}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default DirectChat;