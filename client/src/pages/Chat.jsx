import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { getAuthHeaders } from '../utils/authFetch';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const Chat = ({ playerId: initialPlayerId }) => {
  const { user, token } = useAuth();
  const [players, setPlayers] = useState([]); const [activePlayerId, setActivePlayerId] = useState(initialPlayerId || '');
  const [messages, setMessages] = useState([]); const [body, setBody] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    if (!token) return;
    fetch('/api/chat/players', { headers: getAuthHeaders(token) })
      .then(async res => ({ res, data: await res.json() }))
      .then(({ res, data }) => { if (!res.ok || !data.success) throw new Error(data.message); setPlayers(data.players || []); })
      .catch(err => setError(err.message));
  }, [token]);
  useEffect(() => { setActivePlayerId(initialPlayerId || ''); }, [initialPlayerId]);
  useEffect(() => {
    if (!activePlayerId || !token) { setMessages([]); return; }
    fetch(`/api/chat/${activePlayerId}`, { headers: getAuthHeaders(token) })
      .then(async res => ({ res, data: await res.json() }))
      .then(({ res, data }) => { if (!res.ok || !data.success) throw new Error(data.message); setMessages(data.messages || []); })
      .catch(err => setError(err.message));
  }, [activePlayerId, token]);
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('connect', () => socket.emit('join:user'));
    socket.on('chat:message', message => { if (message.sender_id === activePlayerId) setMessages(items => [...items, message]); });
    return () => socket.disconnect();
  }, [token, activePlayerId]);
  const send = async event => {
    event.preventDefault();
    if (!body.trim() || !activePlayerId || !token) return;
    try {
      const res = await fetch(`/api/chat/${activePlayerId}`, {
        method: 'POST',
        headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ body })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMessages(items => [...items, data.message]);
      setBody('');
    } catch (err) {
      setError(err.message);
    }
  };
  const activePlayer = players.find(player => player.id === activePlayerId);
  return <div className="dashboard-container" style={{ maxWidth: '1000px' }}><div className="auth-header" style={{ textAlign: 'left' }}><h1>💬 Messages</h1><p>Chat directly with registered players and administrators.</p></div><Alert type="error" message={error} /><div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.7fr) minmax(0, 1.5fr)', gap: '1rem' }}><aside className="auth-card" style={{ maxWidth: '100%', maxHeight: '520px', overflowY: 'auto' }}>{players.map(player => <button key={player.id} onClick={() => setActivePlayerId(player.id)} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'left', marginBottom: '0.5rem', borderColor: player.id === activePlayerId ? 'var(--accent-cyan)' : undefined }}>{player.profile_photo ? '🧑 ' : '👤 '}<strong>{player.name}</strong><br /><small>{player.role} · {player.department} · {player.campus}</small></button>)}</aside><section className="auth-card" style={{ maxWidth: '100%', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>{activePlayer ? <><h3 style={{ marginBottom: '1rem' }}>Chat with {activePlayer.name}</h3><div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '360px' }}>{messages.map(message => <div key={message.id} style={{ alignSelf: message.sender_id === user.id ? 'flex-end' : 'flex-start', maxWidth: '76%', padding: '0.65rem 0.8rem', borderRadius: '12px', background: message.sender_id === user.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)', color: message.sender_id === user.id ? '#07101c' : 'var(--text-primary)' }}>{message.body}<small style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7 }}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}</div><form onSubmit={send} style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}><input className="form-input no-icon" value={body} onChange={event => setBody(event.target.value)} maxLength="1000" placeholder="Write a message…" /><button className="btn btn-primary btn-sm" type="submit">Send</button></form></> : <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>Choose an account to start chatting.</div>}</section></div></div>;
};
