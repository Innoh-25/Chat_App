import React from 'react';
import './MessageReactions.css';

const MessageReactions = ({ message, onReaction, currentUser }) => {
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  // Safe access to reactions with fallback
  const reactions = message.reactions || [];

  const handleReaction = (emoji) => {
    if (onReaction) {
      onReaction(message._id || message.id, emoji);
    }
  };

  const hasUserReacted = (reaction) => {
    if (!reaction || !currentUser) return false;
    
    // Handle both object and string user formats
    return reaction.users?.some(user => {
      if (typeof user === 'object') {
        return user._id === currentUser._id;
      }
      return user === currentUser._id;
    });
  };

  return (
    <div className="reactions-picker">
      {commonReactions.map(emoji => {
        const existingReaction = reactions.find(r => r.emoji === emoji);
        const userReacted = hasUserReacted(existingReaction);
        
        return (
          <button
            key={emoji}
            className={`reaction-option ${userReacted ? 'active' : ''}`}
            onClick={() => handleReaction(emoji)}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;