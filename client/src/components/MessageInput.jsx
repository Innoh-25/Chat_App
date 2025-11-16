import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './MessageInput.css';

const MessageInput = ({ currentRoom, disabled, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Move useSocket to the top level
  const { sendMessage, startTyping, stopTyping } = useSocket();

  useEffect(() => {
    // Cleanup typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(currentRoom);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(currentRoom);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(currentRoom);
      }
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;

    // Use custom send handler if provided (for direct messages)
    if (onSendMessage) {
      onSendMessage(message.trim());
    } else {
      // Default room message sending
      sendMessage(message.trim(), currentRoom);
    }

    setMessage('');

    // Stop typing when message is sent
    if (isTyping) {
      setIsTyping(false);
      stopTyping(currentRoom);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : `Type a message...`}
            disabled={disabled}
            className="message-textarea"
            rows={1}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="send-button"
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="send-icon">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;