import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const { handleOAuthSuccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        handleOAuthSuccess(token, user);
        
        // Clean URL and redirect
        window.history.replaceState({}, '', '/');
        navigate('/');
      } catch (error) {
        console.error('Error processing OAuth success:', error);
        navigate('/login?error=auth_failed');
      }
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [handleOAuthSuccess, navigate]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Completing authentication...</p>
    </div>
  );
};

export default AuthSuccess;