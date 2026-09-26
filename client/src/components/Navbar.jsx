import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { MessageToast } from './MessageToast';
import { getAuthHeaders } from '../utils/authFetch';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const Navbar = ({ currentView, onViewChange }) => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [messageToast, setMessageToast] = useState(null);

  useEffect(() => {
    if (!isAboutOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsAboutOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAboutOpen]);

  useEffect(() => {
    if (!token) { setPendingInviteCount(0); return undefined; }
    const loadInvites = async () => {
      try { const res = await fetch('/api/teams/invites/mine', { headers: getAuthHeaders(token) }); const data = await res.json(); if (res.ok && data.success) setPendingInviteCount(data.invites.filter(invite => invite.status === 'pending').length); } catch { /* My Team surfaces connection errors. */ }
    };
    loadInvites();
    const interval = window.setInterval(loadInvites, 60000);
    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) { setUnreadMessageCount(0); return undefined; }
    const loadUnreadMessages = async () => {
      try {
        const res = await fetch('/api/chat/unread/count', { headers: getAuthHeaders(token) });
        const data = await res.json();
        if (res.ok && data.success) setUnreadMessageCount(data.count || 0);
      } catch { /* Ignored */ }
    };
    loadUnreadMessages();
    const interval = window.setInterval(loadUnreadMessages, 60000);
    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('connect', () => socket.emit('join:user'));
    socket.on('announcement:notification', () => setUnreadNotificationCount(count => count + 1));
    socket.on('security:password-changed', () => setUnreadNotificationCount(count => count + 1));
    socket.on('team:notification', () => setUnreadNotificationCount(count => count + 1));

    const handleMessageReceived = (message) => {
      setUnreadMessageCount(count => count + 1);
      setUnreadNotificationCount(count => count + 1);
      if (currentView !== 'chat') {
        setMessageToast({
          sender_id: message.sender_id,
          sender_name: message.sender_name || 'A player',
          body: message.body
        });
      }
    };

    socket.on('message:notification', handleMessageReceived);

    return () => socket.disconnect();
  }, [token, currentView]);

  useEffect(() => {
    if (!token) { setUnreadNotificationCount(0); return undefined; }
    const loadNotifications = async () => {
      try { const res = await fetch('/api/notifications', { headers: getAuthHeaders(token) }); const data = await res.json(); if (res.ok && data.success) setUnreadNotificationCount(data.unreadCount || 0); } catch { /* The notification page shows connection errors. */ }
    };
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [token]);

  return (
    <header className="navbar">
      <div className="nav-brand-area">
      <div className="brand-logo" onClick={() => onViewChange('dashboard')} style={{ cursor: 'pointer' }}>
        <button
          type="button"
          className="brand-icon"
          onClick={(e) => { e.stopPropagation(); setIsAboutOpen(true); }}
          aria-haspopup="dialog"
          aria-expanded={isAboutOpen}
          aria-label="Open information about Playr-Pool"
          style={{ padding: 0, overflow: 'hidden', borderRadius: '50%', width: '42px', height: '42px', border: '2px solid rgba(230, 189, 84, 0.7)', boxShadow: '0 0 12px rgba(230, 189, 84, 0.35)', background: '#0a101d', flexShrink: 0 }}
        >
          <img src="/logo.jpg" alt="Playr-Pool Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
        <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
          Playr<span style={{ color: 'var(--accent-cyan, #00f2fe)' }}>-Pool</span>
        </span>
        <span className="brand-badge" style={{ background: 'linear-gradient(135deg, rgba(230,189,84,0.2), rgba(0,242,254,0.2))', borderColor: 'rgba(230,189,84,0.4)', color: '#f3c766' }}>SPORTS</span>
      </div>
      </div>

      <div className="nav-actions">
        <button
          className={`btn btn-sm ${currentView === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onViewChange('leaderboard')}
          style={{ marginRight: '0.5rem' }}
        >
          🏆 Leaderboard
        </button>

        <button
          className={`btn btn-sm ${currentView === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onViewChange('schedule')}
          style={{ marginRight: '0.5rem' }}
        >
          📅 Matches
        </button>
        <button className={`btn btn-sm ${currentView === 'scorehub' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('scorehub')} style={{ marginRight: '0.5rem' }}>🏆 ScoreHub</button>
        <button className={`btn btn-sm ${currentView === 'events' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('events')} style={{ marginRight: '0.5rem' }}>📣 Events</button>

        {isAuthenticated && user ? (
          <>
            <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.5rem' }}>
              <button
                className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onViewChange('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`btn btn-sm ${currentView === 'my-team' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onViewChange('my-team')}
              >
                ⚽ My Team{pendingInviteCount > 0 ? ` · ${pendingInviteCount} invite${pendingInviteCount > 1 ? 's' : ''}` : ''}
              </button>
              <button className={`btn btn-sm ${currentView === 'notifications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('notifications')}>
                🔔 Alerts{unreadNotificationCount > 0 ? ` · ${unreadNotificationCount}` : ''}
              </button>
              <button className={`btn btn-sm ${currentView === 'sports-admins' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('sports-admins')}>
                🛡️ Sports Admins
              </button>
              {user.role === 'player' && <button className={`btn btn-sm ${currentView === 'my-sports' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('my-sports')}>🏅 My Sports</button>}
              <button
                className={`btn btn-sm ${currentView === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  onViewChange('chat');
                  setUnreadMessageCount(0);
                }}
                style={unreadMessageCount > 0 ? {
                  borderColor: 'var(--accent-cyan)',
                  boxShadow: '0 0 12px rgba(0, 242, 254, 0.4)'
                } : undefined}
              >
                💬 Messages{unreadMessageCount > 0 ? ` · ${unreadMessageCount}` : ''}
              </button>
              <button className={`btn btn-sm ${currentView === 'discover' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onViewChange('discover')}>🔎 Discover</button>
              {user.role === 'admin' && (
                <button
                  className={`btn btn-sm ${currentView === 'admin-dashboard' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={() => onViewChange('admin-dashboard')}
                >
                  🛡️ Admin Desk
                </button>
              )}
            </div>

            <div className="user-badge">
              <span className={`role-pill ${user.role}`}>
                {user.role}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</span>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                logout();
                onViewChange('login');
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              className={`btn btn-sm ${currentView === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onViewChange('login')}
            >
              Login
            </button>
            <button 
              className={`btn btn-sm ${currentView === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onViewChange('signup')}
            >
              Register
            </button>
          </div>
        )}
      </div>

      {isAboutOpen && createPortal(
        <div className="about-overlay" role="presentation" onMouseDown={() => setIsAboutOpen(false)}>
          <section
            className="about-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playrpool-about-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="about-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/logo.jpg" alt="Playr-Pool Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(230, 189, 84, 0.7)' }} />
                <div>
                  <p className="about-eyebrow">ABOUT PLAYR-POOL</p>
                  <h2 id="playrpool-about-title">Connect, Play, Conquer</h2>
                </div>
              </div>
              <button type="button" className="about-close" onClick={() => setIsAboutOpen(false)} aria-label="Close Playr-Pool information">Close <span aria-hidden="true">×</span></button>
            </div>

            <div className="about-modal-content">
              <p>Playr-Pool is a digital sports tournament management platform that makes college and outdoor sports more organized, interactive, and engaging.</p>
              <p>Built for the players who have guts to compete and conquer — it brings teams, matches, live scores, and results into one place instead of scattered announcements and manual records.</p>

              <div className="about-columns">
                <div>
                  <h3>What you can do</h3>
                  <ul>
                    <li>Create and manage teams</li>
                    <li>Find opponents and follow matches</li>
                    <li>See live scores, standings, and results</li>
                    <li>View player profiles and match information</li>
                    <li>Use secure college authentication</li>
                  </ul>
                </div>
                <div>
                  <h3>Developer &amp; team</h3>
                  <p><strong>Utkarsh Anand</strong><br />B.Tech, Computer Science &amp; Engineering<br />FET, GKV, Haridwar</p>
                  <p><a href="tel:+918809853489">+91 8809853489</a><br /><a href="mailto:utkarshiit098@gmail.com">utkarshiit098@gmail.com</a></p>
                  <p>Made with the Playr-Pool Team: Rishav Raj, Utkarsh Kumar Singh, Priyanshu Raj, Anal Roy, and Shivam.</p>
                </div>
              </div>

              <div className="about-purpose">
                <div><h3>Our mission</h3><p>Make college sports more organized, accessible, and exciting through technology.</p></div>
                <div><h3>Our vision</h3><p>Grow into a complete digital sports ecosystem connecting players, teams, organizers, and spectators - from campus tournaments to inter-college competition.</p></div>
              </div>

              <p className="about-signoff"><em>“I don't chase victory. I chase the version of me that deserves it.”</em><br />Have a nice day 🫡🫡</p>
              <p className="about-signoff">Made with <span aria-label="love">♥</span> for student welfare. <strong>Playr-Pool - Connect. Play. Conquer.</strong></p>
            </div>
          </section>
        </div>
      , document.body)}

      {messageToast && (
        <MessageToast
          toast={messageToast}
          onClose={() => setMessageToast(null)}
          onOpenChat={(senderId) => {
            onViewChange('chat', senderId);
            setUnreadMessageCount(0);
          }}
        />
      )}
    </header>
  );
};

