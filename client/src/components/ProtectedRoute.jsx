import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2>Authentication Required</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
          Please sign in with your College ID to view this section.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => onNavigate('login')}
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return children;
};
