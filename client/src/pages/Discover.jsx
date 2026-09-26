import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { getAuthHeaders } from '../utils/authFetch';

export const Discover = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const [query, setQuery] = useState(''); const [sport, setSport] = useState(''); const [type, setType] = useState('');
  const [results, setResults] = useState({ players: [], teams: [], events: [] }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const search = async () => { if (!token) return; setLoading(true); setError(''); try { const params = new URLSearchParams({ q: query, sport, type }); const res = await fetch(`/api/teams/discover?${params}`, { headers: getAuthHeaders(token) }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.message); setResults(data); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { search(); }, [token]); // Initial results are prioritized for the signed-in campus.
  return <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
    <div className="auth-header" style={{ textAlign: 'left' }}><h1>🔎 Campus Discovery</h1><p>Find players, teams, sports, and events. Results prioritize {user?.campus || 'your campus'}.</p></div>
    <Alert type="error" message={error} />
    <form onSubmit={(event) => { event.preventDefault(); search(); }} className="auth-card" style={{ maxWidth: '100%', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}><input className="form-input no-icon" style={{ flex: '1 1 260px' }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, team, sport, or event" /><input className="form-input no-icon" style={{ flex: '0 1 160px' }} value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Sport filter" /><select className="form-select no-icon" value={type} onChange={(e) => setType(e.target.value)}><option value="">Everything</option><option value="players">Players</option><option value="teams">Teams</option><option value="events">Events</option></select><button className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button></form>
    <section className="auth-card" style={{ maxWidth: '100%', marginTop: '1rem' }}><h2>Players</h2>{results.players?.length ? results.players.map((player) => <button key={player.id} className="btn btn-secondary btn-sm" style={{ margin: '0.3rem', textAlign: 'left' }} onClick={() => onNavigate('player-profile', player.id)}>{player.name} · {player.department} · {player.campus}</button>) : <p>No matching players.</p>}</section>
    <section className="auth-card" style={{ maxWidth: '100%', marginTop: '1rem' }}><h2>Teams</h2>{results.teams?.length ? results.teams.map((team) => <button key={team.id} className="btn btn-secondary btn-sm" style={{ margin: '0.3rem', textAlign: 'left' }} onClick={() => onNavigate('team-profile', team.id)}>{team.name} · {team.sport} · {team.campus} · {team.member_count} players</button>) : <p>No matching teams.</p>}</section>
    <section className="auth-card" style={{ maxWidth: '100%', marginTop: '1rem' }}><h2>Events</h2>{results.events?.length ? results.events.map((event) => <div key={event.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}><strong>{event.title}</strong> · {event.category}{event.event_at ? ` · ${new Date(event.event_at).toLocaleString()}` : ''}</div>) : <p>No matching events.</p>}</section>
  </div>;
};
