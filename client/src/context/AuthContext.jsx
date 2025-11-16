import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const _VITE_API = import.meta.env.VITE_API_URL;
const API_URL = (() => {
  if (_VITE_API) {
    // remove trailing slashes
    const trimmed = _VITE_API.replace(/\/+$/, '');
    // ensure it ends with /api
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  // Do NOT fall back to localhost in production.
  // Use same-origin relative '/api' so the client will call the API on the current host
  // (or set VITE_API_URL explicitly in your deployment). This avoids accidentally
  // pointing production to a localhost URL.
  if (typeof window !== 'undefined' && window.location) {
    console.warn('VITE_API_URL not set — defaulting to same-origin /api. Set VITE_API_URL to your API base to override.');
    return `${window.location.origin}/api`;
  }

  // Fallback to a relative path (safe for server-side/build contexts) so requests
  // resolve against the current origin rather than localhost.
  console.warn('VITE_API_URL not set — defaulting to relative /api.');
  return '/api';
})();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor for auth tokens
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

  const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });

      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const handleOAuthSuccess = (token, userData) => {
    setToken(token);
    setUser(userData);
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    handleOAuthSuccess,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};