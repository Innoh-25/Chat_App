import React, { useState } from 'react';
import UserProfile from './UserProfile';
import './Sidebar.css';

const Sidebar = ({ currentRoom, rooms, onlineUsers, onRoomChange, onDirectMessage, onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'users'

  return (
    <div className="sidebar">
      {/* User Profile Section */}
      <div className="sidebar-section">
        <UserProfile user={user} onLogout={onLogout} />
      </div>

      {/* Tabs for Rooms/Users */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Direct Messages
        </button>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">Rooms</h3>
          <div className="room-list">
            {rooms.map(room => (
              <button
                key={room}
                className={`room-item ${currentRoom === room ? 'active' : ''}`}
                onClick={() => onRoomChange(room)}
              >
                <span className="room-icon">#</span>
                <span className="room-name">{room}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">
            Online Users ({onlineUsers.length})
          </h3>
          <div className="user-list">
            {onlineUsers
              .filter(onlineUser => onlineUser.id !== user._id) // Don't show yourself
              .map(onlineUser => (
              <div 
                key={onlineUser.id} 
                className="user-item clickable"
                onClick={() => onDirectMessage(onlineUser)}
              >
                <div className="user-avatar">
                  {onlineUser.avatar ? (
                    <img src={onlineUser.avatar} alt={onlineUser.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {onlineUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="online-indicator"></div>
                </div>
                <span className="user-name">{onlineUser.username}</span>
                <span className="message-indicator">💬</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;