import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // In-memory token and user state strictly (no localStorage persistence)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Log in user by storing JWT and user details in memory
   */
  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  }, []);

  /**
   * Log out user by wiping in-memory state
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Fetch latest profile from backend /api/auth/me using in-memory token
   */
  const fetchProfile = useCallback(async () => {
    if (!token) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return data.user;
      } else {
        // If token is invalid or expired
        logout();
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
