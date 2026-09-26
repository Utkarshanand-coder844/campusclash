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

/**
 * AdminRoute
 * Synchronous guard that checks both authentication AND admin role on every
 * render. Because this is NOT inside a useEffect, there is zero flash of
 * admin content for logged-in players who try to navigate directly.
 */
export const AdminRoute = ({ children, onNavigate }) => {
  const { isAuthenticated, user } = useAuth();

  // Not logged in at all
  if (!isAuthenticated) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2>Authentication Required</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
          Please sign in with your College ID to view this section.
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('login')}>
          Go to Sign In
        </button>
      </div>
    );
  }

  // Logged in but not an admin
  if (user?.role !== 'admin') {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ color: 'var(--danger, #ef4444)' }}>Access Denied</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
          This section is reserved for tournament administrators only.
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return children;
};
