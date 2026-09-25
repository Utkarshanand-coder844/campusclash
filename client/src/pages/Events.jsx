import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
const categoryLabel = { tournament: '🏆 Tournament', match: '⚽ Match', notice: '📣 Notice' };
const orderAnnouncements = (items) => [...items].sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)));

export const Events = () => {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load events');
        setAnnouncements(data.announcements || []);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    load();
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('connect', () => socket.emit('join:user'));
    socket.on('announcement:new', (announcement) => setAnnouncements((items) => orderAnnouncements([announcement, ...items])));
    socket.on('announcement:updated', (announcement) => setAnnouncements((items) => orderAnnouncements(items.map((item) => item.id === announcement.id ? { ...item, ...announcement } : item))));
    socket.on('announcement:deleted', ({ id }) => setAnnouncements((items) => items.filter((item) => item.id !== id)));
    return () => socket.disconnect();
  }, [token]);

  return <div className="dashboard-container" style={{ maxWidth: '900px' }}>
    <div className="auth-header" style={{ textAlign: 'left', marginBottom: 0 }}><h1>📣 Tournament Events</h1><p>Official match dates, tournament updates, and important notices from the organizers.</p></div>
    <Alert type="error" message={error} />
    {loading ? <div className="auth-card">Loading event updates…</div> : announcements.length === 0 ? <div className="auth-card" style={{ textAlign: 'center' }}>No announcements have been posted yet.</div> : <div className="event-feed">
      {announcements.map((item) => <article className="event-card" key={item.id}>
        <div className="event-card-top"><span className={`role-pill ${item.category === 'match' ? 'player' : 'admin'}`}>{categoryLabel[item.category] || '📣 Notice'}</span><span>{item.is_pinned ? '📌 Pinned' : ''} {item.event_at && <time>🗓️ {new Date(item.event_at).toLocaleString()}</time>}</span></div>
        <h2>{item.title}</h2>
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {item.message?.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
            /(https?:\/\/[^\s]+)/.test(part) ? (
              <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>
                {part}
              </a>
            ) : part
          )}
        </p>
        {item.attachments?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>{item.attachments.map((attachment) => <a className="btn btn-secondary btn-sm" key={attachment.id || attachment.url} href={attachment.url} target="_blank" rel="noreferrer">{({ poster: '🖼 Poster', rules: '📄 Rules', venue_map: '🗺 Venue map', schedule: '📅 Schedule' }[attachment.type] || '📎 Attachment')} · {attachment.label}</a>)}</div>}
        <small>Posted {new Date(item.created_at).toLocaleString()}{item.posted_by ? ` by ${item.posted_by}` : ''}{item.campus && item.campus !== 'all' ? ` · ${item.campus}` : ''}</small>
      </article>)}</div>}
  </div>;
};
