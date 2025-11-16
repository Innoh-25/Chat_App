import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import AuthSuccess from './components/AuthSuccess';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const { isConnected } = useSocket();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check if we're in OAuth callback
  if (window.location.pathname === '/auth-success') {
    return <AuthSuccess />;
  }

  return (
    <div className="app">
      {!user ? (
        <Login />
      ) : (
        <div className="app-container">
          <div className="connection-status-bar">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <ChatRoom />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;