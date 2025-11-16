import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import MessageReactions from './MessageReactions';
import './MessageList.css';

const MessageList = ({ messages, currentUser, currentRoom, onMessagesUpdate }) => {
  const { socket, isConnected, typingUsers, deleteMessage } = useSocket();
  const messagesEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = (data) => {
      if (data.room === currentRoom && onMessagesUpdate) {
        onMessagesUpdate(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, currentRoom, onMessagesUpdate]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageContent = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="message-link">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const isOwnMessage = (message) => {
    return message.sender?._id === currentUser._id || message.sender === currentUser._id;
  };

  const handleReaction = (messageId, emoji) => {
    if (socket && isConnected) {
      socket.emit('message_reaction', {
        messageId,
        emoji,
        room: currentRoom
      });
    }
  };

  const hasUserReacted = (message, emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    if (!reaction || !currentUser) return false;
    
    return reaction.users?.some(user => {
      if (typeof user === 'object') {
        return user._id === currentUser._id;
      }
      return user === currentUser._id;
    });
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    
    // Only show context menu for user's own messages
    if (!isOwnMessage(message)) return;

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: message
    });
  };

  const handleDeleteMessage = () => {
    if (contextMenu.message) {
      deleteMessage(contextMenu.message._id, currentRoom);
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    }
  };

  const handleLongPress = (message, e) => {
    // Only for touch devices
    if (!isOwnMessage(message)) return;

    setContextMenu({
      visible: true,
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      message: message
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id || message.id}
            className={`message ${isOwnMessage(message) ? 'own-message' : ''} ${message.type === 'system' ? 'system-message' : ''}`}
            onContextMenu={(e) => handleContextMenu(e, message)}
            onTouchStart={(e) => {
              // Set up long press timer
              message.longPressTimer = setTimeout(() => {
                handleLongPress(message, e);
              }, 500);
            }}
            onTouchEnd={() => {
              // Clear long press timer
              if (message.longPressTimer) {
                clearTimeout(message.longPressTimer);
              }
            }}
            onTouchMove={() => {
              // Clear long press timer if user moves finger
              if (message.longPressTimer) {
                clearTimeout(message.longPressTimer);
              }
            }}
          >
            {message.type === 'system' ? (
              <div className="system-message-content">
                {message.content}
                <span className="message-time">
                  {formatTime(message.createdAt || message.timestamp)}
                </span>
              </div>
            ) : (
              <>
                <div className="message-header">
                  <div className="message-sender">
                    {message.sender?.avatar ? (
                      <img src={message.sender.avatar} alt={message.sender.username} className="sender-avatar" />
                    ) : (
                      <div className="sender-avatar-placeholder">
                        {message.sender?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="sender-name">{message.sender?.username}</span>
                  </div>
                  <span className="message-time">
                    {formatTime(message.createdAt || message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {formatMessageContent(message.content)}
                </div>
                
                {/* Message Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="message-reactions">
                    {message.reactions.map((reaction, index) => (
                      <span 
                        key={index} 
                        className={`reaction ${hasUserReacted(message, reaction.emoji) ? 'user-reacted' : ''}`}
                      >
                        {reaction.emoji} {reaction.users?.length || 0}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reactions Picker - Only show for non-system messages */}
                {message.type !== 'system' && (
                  <MessageReactions 
                    message={message}
                    onReaction={handleReaction}
                    currentUser={currentUser}
                  />
                )}
              </>
            )}
          </div>
        ))}

        {typingUsers.filter(user => user.room === currentRoom).length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {typingUsers.filter(user => user.room === currentRoom).map(user => user.username).join(', ')} 
              {typingUsers.filter(user => user.room === currentRoom).length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={closeContextMenu}
        >
          <button className="context-menu-item delete-btn" onClick={handleDeleteMessage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageList;