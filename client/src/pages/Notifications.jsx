import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';

export const Notifications = ({ onNavigate }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load notifications');
      setNotifications(data.notifications || []);
    } catch (err) { setError(err.message); }
  }, [token]);

  useEffect(() => { if (token) loadNotifications(); }, [token, loadNotifications]);

  const markRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update notification');
      setNotifications(items => items.map(item => item.id === id ? data.notification : item));
    } catch (err) { setError(err.message); }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update notifications');
      setNotifications(items => items.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch (err) { setError(err.message); }
  };

  const unreadCount = notifications.filter(item => !item.read_at).length;
  return <div className="dashboard-container" style={{ maxWidth: '900px' }}>
    <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1rem' }}>
      <h1>🔔 Notifications & Alerts</h1>
      <p>Your incoming messages, event updates, and tournament notices.</p>
    </div>
    <Alert type="error" message={error} />
    {unreadCount > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead} style={{ marginBottom: '1rem' }}>Mark all as read ({unreadCount})</button>}
    {notifications.length === 0 ? <div className="auth-card" style={{ textAlign: 'center' }}>You have no notifications yet.</div> : <div className="event-feed">
      {notifications.map(item => (
        <article className="event-card" key={item.id} style={{ opacity: item.read_at ? 0.7 : 1 }}>
          <div className="event-card-top">
            {item.type === 'message' ? (
              <span className="role-pill" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.4)' }}>
                💬 Direct Message
              </span>
            ) : (
              <span className="role-pill admin">📣 Event update</span>
            )}
            <time>{new Date(item.created_at).toLocaleString()}</time>
          </div>
          <h2>{item.title}</h2>
          <p>{item.message}</p>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {!item.read_at && (
              <button className="btn btn-secondary btn-sm" onClick={() => markRead(item.id)}>
                Mark as read
              </button>
            )}
            {item.type === 'message' && onNavigate && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!item.read_at) markRead(item.id);
                  onNavigate('chat');
                }}
              >
                💬 Open in Chat
              </button>
            )}
          </div>
        </article>
      ))}
    </div>}
  </div>;
};
