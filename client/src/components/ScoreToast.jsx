import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Same origin the Leaderboard page connects to — Vite's dev proxy only
// forwards plain HTTP under /api, not the WebSocket upgrade Socket.io needs.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const ScoreToast = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('connect', () => {
      // Join this user's personal notification room — matches the
      // `user:${userId}` room the server joins sockets to on 'join:user',
      // and the room adminController targets when a team's score changes.
      socket.emit('join:user');
    });

    socket.on('score:update', (payload) => {
      setNotification({ type: 'score', ...payload });
      setTimeout(() => setNotification(null), 5000);
    });

    socket.on('announcement:notification', (payload) => {
      setNotification(payload);
      setTimeout(() => setNotification(null), 5000);
    });
    socket.on('security:password-changed', (payload) => {
      setNotification({ type: 'security', ...payload });
      setTimeout(() => setNotification(null), 7000);
    });
    socket.on('team:notification', (payload) => {
      setNotification({ type: 'team', ...payload });
      setTimeout(() => setNotification(null), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, token]);

  if (!notification) return null;

  const isAnnouncement = notification.type === 'announcement';
  const isSecurity = notification.type === 'security';
  const isTeam = notification.type === 'team';
  const announcement = notification.announcement;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '25px',
        zIndex: 9999,
        background: isSecurity
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.96), rgba(185, 28, 28, 0.96))'
          : isTeam ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.96), rgba(79, 70, 229, 0.96))'
          : isAnnouncement
          ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.96), rgba(255, 126, 95, 0.96))'
          : 'linear-gradient(135deg, rgba(0, 242, 254, 0.95), rgba(79, 172, 254, 0.95))',
        color: '#060a14',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.4)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '320px',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{isSecurity ? '🔐' : isTeam ? '👥' : isAnnouncement ? '📣' : '🏆'}</span>
      <span>
        {isSecurity || isTeam ? <><strong>{notification.title}</strong><br />{notification.message}</> : isAnnouncement ? <><strong>{announcement.title}</strong><br />{announcement.message}</> : <>Your team "{notification.team_name}" scored {notification.points} points!</>}
      </span>
      <button
        onClick={() => setNotification(null)}
        style={{ background: 'transparent', border: 'none', color: '#060a14', cursor: 'pointer', marginLeft: '0.25rem' }}
      >
        ✕
      </button>
    </div>
  );
};
