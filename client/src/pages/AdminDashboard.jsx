import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { SPORT_LIST, SPORT_ROLES, formatSportProfile } from '../utils/sportRoles';
import { getAuthHeaders } from '../utils/authFetch';

export const AdminDashboard = ({ onNavigate }) => {
  const { user, token } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      onNavigate('dashboard');
    }
  }, [user, onNavigate]);

  // State data
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [bracketFixtures, setBracketFixtures] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sportsAdmins, setSportsAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Athlete Directory & Role Filter
  const [playerSportFilter, setPlayerSportFilter] = useState('All');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('All');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Match creation form
  const [newMatchName, setNewMatchName] = useState('');
  const [newMatchDate, setNewMatchDate] = useState(new Date().toISOString().slice(0, 16));
  const [newMatchStatus, setNewMatchStatus] = useState('upcoming');
  const [newMatchSport, setNewMatchSport] = useState('Football');
  const [customMatchSport, setCustomMatchSport] = useState('');
  const [newMatchTeamA, setNewMatchTeamA] = useState('');
  const [newMatchTeamB, setNewMatchTeamB] = useState('');
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [deadlineSport, setDeadlineSport] = useState('Football');
  const [deadlineOpensAt, setDeadlineOpensAt] = useState('');
  const [deadlineClosesAt, setDeadlineClosesAt] = useState('');
  const [bracketSport, setBracketSport] = useState('Football');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState('tournament');
  const [announcementDate, setAnnouncementDate] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [announcementCampus, setAnnouncementCampus] = useState('all');
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState('poster');
  const [announcementAttachments, setAnnouncementAttachments] = useState([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [adminSport, setAdminSport] = useState('');

  // Score update form
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [scorePoints, setScorePoints] = useState(0);
  const [submittingScore, setSubmittingScore] = useState(false);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Trigger temporary success toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Fetch all admin data
  const fetchData = useCallback(async () => {
    if (!token || !user || user.role !== 'admin') return;

    setLoading(true);
    try {
      const headers = getAuthHeaders(token);

      const [matchesRes, teamsRes, playersRes, scoresRes, deadlinesRes, auditRes, announcementsRes, sportsAdminsRes] = await Promise.all([
        fetch('/api/admin/matches', { headers }),
        fetch('/api/admin/teams', { headers }),
        fetch('/api/admin/players', { headers }),
        fetch('/api/admin/scores', { headers }),
        fetch('/api/admin/registration-deadlines', { headers }),
        fetch('/api/admin/audit-log?limit=20', { headers }),
        fetch('/api/announcements', { headers }),
        fetch('/api/sports-admins', { headers })
      ]);

      const matchesData = await matchesRes.json();
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();
      const scoresData = await scoresRes.json();
      const deadlinesData = await deadlinesRes.json();
      const auditData = await auditRes.json();
      const announcementsData = await announcementsRes.json();
      const sportsAdminsData = await sportsAdminsRes.json();

      if (matchesRes.ok && matchesData.success) {
        setMatches(matchesData.matches || []);
        if (matchesData.matches.length > 0 && !selectedMatchId) {
          setSelectedMatchId(matchesData.matches[0].id);
        }
      }

      if (teamsRes.ok && teamsData.success) {
        setTeams(teamsData.teams || []);
        if (teamsData.teams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamsData.teams[0].id);
        }
      }
      if (playersRes.ok && playersData.success) setPlayers(playersData.players || []);

      if (scoresRes.ok && scoresData.success) {
        setScores(scoresData.scores || []);
      }
      if (deadlinesRes.ok && deadlinesData.success) setDeadlines(deadlinesData.deadlines || []);
      if (auditRes.ok && auditData.success) setAuditEntries(auditData.entries || []);
      if (announcementsRes.ok && announcementsData.success) setAnnouncements(announcementsData.announcements || []);
      if (sportsAdminsRes.ok && sportsAdminsData.success) setSportsAdmins(sportsAdminsData.admins || []);
    } catch (err) {
      setErrorMessage('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user, selectedMatchId, selectedTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Match Creation
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newMatchName.trim()) {
      setErrorMessage('Match title is required');
      return;
    }
    const sport = newMatchSport === 'Other' ? customMatchSport.trim() : newMatchSport;
    if (!sport) { setErrorMessage('Enter a sport for the fixture'); return; }
    if (!newMatchTeamA || !newMatchTeamB || newMatchTeamA === newMatchTeamB) { setErrorMessage('Choose two different teams for this fixture'); return; }

    setCreatingMatch(true);
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newMatchName.trim(),
          sport,
          team_a_id: newMatchTeamA,
          team_b_id: newMatchTeamB,
          match_date: newMatchDate,
          status: newMatchStatus
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create match');
      }

      showToast(`🏆 Match "${data.match.name}" created successfully!`);
      setNewMatchName('');
      setNewMatchTeamA('');
      setNewMatchTeamB('');
      fetchData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setCreatingMatch(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (matchId, status) => {
    setErrorMessage('');
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status');
      }

      showToast(`Status updated to "${status.toUpperCase()}"`);
      fetchData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Handle Score Submit (UPSERT)
  const handleSaveScore = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedMatchId) {
      setErrorMessage('Please select a match');
      return;
    }
    if (!selectedTeamId) {
      setErrorMessage('Please select a team');
      return;
    }

    setSubmittingScore(true);
    try {
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          match_id: selectedMatchId,
          team_id: selectedTeamId,
          points: parseInt(scorePoints, 10)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update score');
      }

      showToast(`✅ Score saved: ${scorePoints} points recorded!`);
      fetchData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmittingScore(false);
    }
  };

  // Populate score edit from table click
  const handleQuickEdit = (scoreItem) => {
    setSelectedMatchId(scoreItem.match_id);
    setSelectedTeamId(scoreItem.team_id);
    setScorePoints(scoreItem.points);
    window.scrollTo({ top: 400, behavior: 'smooth' });
    showToast(`Loaded score for ${scoreItem.team_name} into editor`);
  };

  const handleSaveDeadline = async (e) => {
    e.preventDefault(); setErrorMessage('');
    try {
      const res = await fetch('/api/admin/registration-deadlines', { method: 'PUT', headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ sport: deadlineSport, opens_at: deadlineOpensAt || null, closes_at: deadlineClosesAt || null }) });
      const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.message || 'Unable to save deadline');
      showToast(`Registration window saved for ${data.deadline.sport}`); fetchData();
    } catch (err) { setErrorMessage(err.message); }
  };

  const loadBracket = async (sport = bracketSport) => {
    try { const res = await fetch(`/api/admin/brackets?sport=${encodeURIComponent(sport)}`, { headers: getAuthHeaders(token) }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.message); setBracketFixtures(data.fixtures || []); } catch (err) { setErrorMessage(err.message); }
  };

  const handleGenerateBracket = async () => {
    setErrorMessage('');
    try { const res = await fetch('/api/admin/brackets/generate', { method: 'POST', headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ sport: bracketSport }) }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.message || 'Unable to generate bracket'); showToast(data.message); loadBracket(); fetchData(); } catch (err) { setErrorMessage(err.message); }
  };

  const handlePostAnnouncement = async (event) => {
    event.preventDefault(); setErrorMessage('');
    if (!announcementTitle.trim() || !announcementMessage.trim()) { setErrorMessage('An event title and message are required.'); return; }
    setPostingAnnouncement(true);
    try {
      let finalAttachments = [...announcementAttachments];
      if (attachmentUrl && attachmentUrl.trim()) {
        let url = attachmentUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        const label = attachmentLabel.trim() || 'Event Link';
        if (!finalAttachments.some(a => a.url === url)) {
          finalAttachments.push({ label, url, type: attachmentType || 'other' });
        }
      }
      const response = await fetch(editingAnnouncementId ? `/api/admin/announcements/${editingAnnouncementId}` : '/api/admin/announcements', { method: editingAnnouncementId ? 'PUT' : 'POST', headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ title: announcementTitle, message: announcementMessage, category: announcementCategory, event_at: announcementDate || null, is_pinned: announcementPinned, campus: announcementCampus, attachments: finalAttachments }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to post announcement');
      showToast(editingAnnouncementId ? 'Announcement updated.' : 'Announcement posted to the public Events feed.');
      setAnnouncementTitle(''); setAnnouncementMessage(''); setAnnouncementDate(''); setAnnouncementPinned(false); setAnnouncementCampus('all'); setAnnouncementAttachments([]); setAttachmentLabel(''); setAttachmentUrl(''); setEditingAnnouncementId(null); fetchData();
    } catch (err) { setErrorMessage(err.message); }
    finally { setPostingAnnouncement(false); }
  };

  const startEditingAnnouncement = (item) => {
    setEditingAnnouncementId(item.id);
    setAnnouncementTitle(item.title);
    setAnnouncementMessage(item.message);
    setAnnouncementCategory(item.category);
    setAnnouncementDate(item.event_at ? new Date(item.event_at).toISOString().slice(0, 16) : '');
    setAnnouncementPinned(Boolean(item.is_pinned));
    setAnnouncementCampus(item.campus || 'all');
    setAnnouncementAttachments(item.attachments || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncementId(null); setAnnouncementTitle(''); setAnnouncementMessage(''); setAnnouncementDate(''); setAnnouncementPinned(false); setAnnouncementCampus('all'); setAnnouncementAttachments([]);
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Unable to remove announcement');
      showToast('Announcement removed.'); fetchData();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleAssignMySport = async (event) => {
    event.preventDefault(); setErrorMessage('');
    if (!adminSport.trim()) return setErrorMessage('Enter a sport name.');
    try {
      const response = await fetch('/api/sports-admins/mine', { method: 'POST', headers: getAuthHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ sport: adminSport.trim() }) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Unable to assign sport');
      showToast(data.message); setAdminSport(''); fetchData();
    } catch (err) { setErrorMessage(err.message); }
  };

  const handleRemoveMySport = async (sport) => {
    try {
      const response = await fetch(`/api/sports-admins/mine/${encodeURIComponent(sport)}`, { method: 'DELETE', headers: getAuthHeaders(token) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Unable to remove sport');
      showToast(data.message); fetchData();
    } catch (err) { setErrorMessage(err.message); }
  };

  const exportCsv = (name, rows) => {
    if (!rows.length) { setErrorMessage(`There is no ${name} data to export yet.`); return; }
    const columns = Object.keys(rows[0]);
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(','), ...rows.map(row => columns.map(column => quote(row[column])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `playrpool-${name}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  // Available roles for dynamic dropdown filter
  const availableRolesForFilter = (() => {
    if (playerSportFilter === 'All') return [];
    const cfg = SPORT_ROLES[playerSportFilter];
    if (!cfg) return [];
    const list = [];
    if (cfg.primaryRoles) list.push(...cfg.primaryRoles);
    if (cfg.positions) list.push(...cfg.positions);
    if (cfg.categories) list.push(...cfg.categories);
    if (cfg.events) list.push(...cfg.events);
    if (cfg.formats) list.push(...cfg.formats);
    return list;
  })();

  // Filtered players list
  const filteredPlayers = players.filter((p) => {
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.trim().toLowerCase();
      const matchText =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.college_id && p.college_id.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.campus && p.campus.toLowerCase().includes(q));
      if (!matchText) return false;
    }

    if (playerSportFilter !== 'All') {
      const prof = p.sport_profiles?.[playerSportFilter];
      if (!prof) return false;

      if (playerRoleFilter !== 'All') {
        const hasRole =
          prof.primary_role === playerRoleFilter ||
          prof.position === playerRoleFilter ||
          prof.event_category === playerRoleFilter ||
          prof.bowling_style === playerRoleFilter ||
          prof.batting_hand === playerRoleFilter ||
          prof.playing_style === playerRoleFilter;
        if (!hasRole) return false;
      }
    } else if (playerRoleFilter !== 'All') {
      const hasAnyRoleMatch = Object.values(p.sport_profiles || {}).some(
        (prof) =>
          prof.primary_role === playerRoleFilter ||
          prof.position === playerRoleFilter ||
          prof.event_category === playerRoleFilter
      );
      if (!hasAnyRoleMatch) return false;
    }

    return true;
  });

  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1080px' }}>
      {/* Toast Notification Container */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.4)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span>✨</span>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage('')}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="id-card-hero">
        <div className="id-card-header">
          <div className="id-badge" style={{ borderColor: '#f43f5e', color: '#fda4af' }}>
            <span>🛡️ OFFICIAL TOURNAMENT CONTROL DESK</span>
          </div>
          <span className="role-pill admin">ADMIN CONSOLE</span>
        </div>

        <div className="profile-info">
          <h2>Live Score & Match Operations</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Schedule fixtures, toggle match statuses (Upcoming / Live / Completed), and update points live.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCsv('players', players)}>Export players CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCsv('teams', teams)}>Export teams CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCsv('fixtures', matches)}>Export fixtures CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCsv('scores', scores)}>Export scores CSV</button>
          </div>
        </div>
      </div>

      <Alert type="error" message={errorMessage} />

      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h3 style={{ marginBottom: '0.4rem' }}>📣 {editingAnnouncementId ? 'Edit event update' : 'Publish event update'}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Post official tournament news, match details, dates, venue reminders, or other instructions for every visitor.</p>
        <form onSubmit={handlePostAnnouncement}>
          <div className="form-grid"><div className="form-group"><label className="form-label">Event type</label><select className="form-select no-icon" value={announcementCategory} onChange={(e) => setAnnouncementCategory(e.target.value)}><option value="tournament">Tournament</option><option value="match">Match</option><option value="notice">General notice</option></select></div><div className="form-group"><label className="form-label">Event date and time (optional)</label><input type="datetime-local" className="form-input no-icon" value={announcementDate} onChange={(e) => setAnnouncementDate(e.target.value)} /></div></div>
          <div className="form-group"><label className="form-label">Audience campus</label><input className="form-input no-icon" value={announcementCampus} onChange={(e) => setAnnouncementCampus(e.target.value)} placeholder="all or exact campus name" /><small style={{ color: 'var(--text-muted)' }}>Use “all” for every campus. Campus notices are delivered only to matching campus accounts.</small></div>
          <div className="form-group"><label className="form-label">Title</label><input maxLength="120" className="form-input no-icon" placeholder="e.g. Football semi-final schedule" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Message</label><textarea maxLength="2000" className="form-input no-icon" style={{ minHeight: '110px', resize: 'vertical' }} placeholder="Include teams, venue, reporting time, or other important information." value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} required /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}><input type="checkbox" checked={announcementPinned} onChange={(e) => setAnnouncementPinned(e.target.checked)} /> Pin this update at the top of Events</label>
          <div className="form-grid"><div className="form-group"><label className="form-label">Attachment label</label><input className="form-input no-icon" value={attachmentLabel} onChange={(e) => setAttachmentLabel(e.target.value)} placeholder="Tournament rules PDF" /></div><div className="form-group"><label className="form-label">Attachment URL</label><input className="form-input no-icon" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://…" /></div></div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1rem' }}><select className="form-select no-icon" style={{ maxWidth: '160px' }} value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}><option value="poster">Poster</option><option value="rules">Rules PDF</option><option value="venue_map">Venue map</option><option value="schedule">Schedule</option><option value="other">Link / Other</option></select><button type="button" className="btn btn-secondary btn-sm" onClick={() => { if (attachmentUrl.trim()) { let url = attachmentUrl.trim(); if (!/^https?:\/\//i.test(url)) url = `https://${url}`; const label = attachmentLabel.trim() || 'Event Link'; setAnnouncementAttachments(items => [...items, { label, url, type: attachmentType || 'other' }]); setAttachmentLabel(''); setAttachmentUrl(''); } }}>Add attachment</button></div>
          {announcementAttachments.map((attachment, index) => <div key={`${attachment.url}-${index}`} style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>📎 {attachment.label} <button type="button" className="btn btn-danger btn-sm" onClick={() => setAnnouncementAttachments(items => items.filter((_, i) => i !== index))}>Remove</button></div>)}
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={postingAnnouncement}>{postingAnnouncement ? 'Saving…' : editingAnnouncementId ? 'Save changes' : 'Post to Events'}</button>{editingAnnouncementId && <button type="button" className="btn btn-secondary" style={{ width: 'auto', marginLeft: '0.6rem' }} onClick={cancelEditingAnnouncement}>Cancel</button>}
        </form>
        {announcements.map((item) => <div key={item.id} className="admin-announcement"><span><strong>{item.is_pinned ? '📌 ' : ''}{item.title}</strong> · {item.category}{item.event_at ? ` · ${new Date(item.event_at).toLocaleString()}` : ''}</span><span style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-secondary btn-sm" onClick={() => startEditingAnnouncement(item)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnnouncement(item.id)}>Remove</button></span></div>)}
      </div>

      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h3 style={{ marginBottom: '0.4rem' }}>🛡️ My sports administration</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Add the sports you manage. Players will find your contact information in the Sports Admins directory.</p>
        <form onSubmit={handleAssignMySport} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select no-icon"
            style={{ maxWidth: '220px' }}
            value={SPORT_LIST.includes(adminSport) ? adminSport : adminSport ? '__custom__' : ''}
            onChange={(e) => {
              if (e.target.value === '__custom__') setAdminSport('');
              else setAdminSport(e.target.value);
            }}
          >
            <option value="">Choose standard sport...</option>
            {SPORT_LIST.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__custom__">Other / Custom Sport...</option>
          </select>
          {(!SPORT_LIST.includes(adminSport) || adminSport === '') && (
            <input
              className="form-input no-icon"
              style={{ maxWidth: '240px' }}
              value={adminSport}
              onChange={(e) => setAdminSport(e.target.value)}
              placeholder="Enter custom sport"
              maxLength="60"
            />
          )}
          <button className="btn btn-primary btn-sm" type="submit">Add sport</button>
        </form>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>{sportsAdmins.filter(item => item.admin_id === user.id).map(item => <span key={item.id} className="role-pill admin">{item.sport} <button type="button" onClick={() => handleRemoveMySport(item.sport)} aria-label={`Remove ${item.sport}`} style={{ marginLeft: '0.35rem', border: 0, cursor: 'pointer', background: 'transparent', color: 'inherit' }}>×</button></span>)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <h3 style={{ marginBottom: '0.4rem' }}>Registration deadlines</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Set a separate opening and closing time for each sport.</p>
          <form onSubmit={handleSaveDeadline}>
            <input className="form-input no-icon" value={deadlineSport} onChange={(e) => setDeadlineSport(e.target.value)} placeholder="Sport" required />
            <label className="form-label" style={{ marginTop: '0.65rem' }}>Opens</label><input type="datetime-local" className="form-input no-icon" value={deadlineOpensAt} onChange={(e) => setDeadlineOpensAt(e.target.value)} />
            <label className="form-label" style={{ marginTop: '0.65rem' }}>Closes</label><input type="datetime-local" className="form-input no-icon" value={deadlineClosesAt} onChange={(e) => setDeadlineClosesAt(e.target.value)} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.8rem' }} type="submit">Save deadline</button>
          </form>
          {deadlines.map(d => <div key={d.sport} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}><strong>{d.sport}</strong>: {d.opens_at ? new Date(d.opens_at).toLocaleString() : 'open now'} → {d.closes_at ? new Date(d.closes_at).toLocaleString() : 'no close time'}</div>)}
        </div>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <h3 style={{ marginBottom: '0.4rem' }}>ScoreHub · Knockout format</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create league fixtures with the match form below. Generate a knockout round here, then advance winners after decisive completed results.</p>
          <input className="form-input no-icon" value={bracketSport} onChange={(e) => setBracketSport(e.target.value)} placeholder="Sport" />
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}><button className="btn btn-primary btn-sm" onClick={handleGenerateBracket}>Generate next round</button><button className="btn btn-secondary btn-sm" onClick={() => loadBracket()}>View bracket</button></div>
          {bracketFixtures.map(f => <div key={f.id} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.55rem' }}>Round {f.round_number}: <strong>{f.team_a_name}</strong> vs <strong>{f.team_b_name}</strong> ({f.status})</div>)}
        </div>
      </div>

      {/* TWO COLUMN GRID: MATCH CREATION & SCORE CONTROLLER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* FORM 1: CREATE MATCH */}
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>Create Tournament Match</h2>
            <p>Schedule a new fixture between competing teams</p>
          </div>

          <form onSubmit={handleCreateMatch}>
            <div className="form-group full-width">
              <label className="form-label">Match Title / Fixture *</label>
              <input
                type="text"
                className="form-input no-icon"
                placeholder="e.g. Quarterfinal 1: Strikers vs Phoenix"
                value={newMatchName}
                onChange={(e) => setNewMatchName(e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Sport *</label>
                <select className="form-select no-icon" value={newMatchSport} onChange={(e) => setNewMatchSport(e.target.value)}>
                  <option>Badminton</option><option>Table Tennis</option><option>Cricket</option><option>Football</option><option>Other</option>
                </select>
                {newMatchSport === 'Other' && <input className="form-input no-icon" style={{ marginTop: '0.5rem' }} placeholder="Custom sport" value={customMatchSport} onChange={(e) => setCustomMatchSport(e.target.value)} required />}
              </div>
              <div className="form-group">
                <label className="form-label">Team A *</label>
                <select className="form-select no-icon" value={newMatchTeamA} onChange={(e) => setNewMatchTeamA(e.target.value)} required>
                  <option value="" disabled>Choose Team A</option>
                  {teams.filter(team => team.sport === (newMatchSport === 'Other' ? customMatchSport.trim() : newMatchSport)).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team B *</label>
                <select className="form-select no-icon" value={newMatchTeamB} onChange={(e) => setNewMatchTeamB(e.target.value)} required>
                  <option value="" disabled>Choose Team B</option>
                  {teams.filter(team => team.sport === (newMatchSport === 'Other' ? customMatchSport.trim() : newMatchSport) && team.id !== newMatchTeamA).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Match Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input no-icon"
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select no-icon"
                  value={newMatchStatus}
                  onChange={(e) => setNewMatchStatus(e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live (In Progress)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={creatingMatch}
              style={{ marginTop: '0.75rem' }}
            >
              {creatingMatch ? 'Scheduling...' : '➕ Schedule Match Fixture'}
            </button>
          </form>
        </div>

        {/* FORM 2: LIVE SCORE UPDATER */}
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>Update Live Score</h2>
            <p>Select match & team, update points (auto-upserted)</p>
          </div>

          <form onSubmit={handleSaveScore}>
            <div className="form-group full-width">
              <label className="form-label">Select Match *</label>
              <select
                className="form-select no-icon"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                required
              >
                <option value="" disabled>-- Choose Match --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.team_a_name && m.team_b_name ? `${m.team_a_name} vs ${m.team_b_name}` : m.name} ({m.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Select Team *</label>
              <select
                className="form-select no-icon"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
              >
                <option value="" disabled>-- Choose Team --</option>
                {teams.filter(t => {
                  const match = matches.find(m => m.id === selectedMatchId);
                  return !match || (t.sport === match.sport && (!match.team_a_id || [match.team_a_id, match.team_b_id].includes(t.id)));
                }).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Points / Goals Tally</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  className="form-input no-icon"
                  style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}
                  value={scorePoints}
                  onChange={(e) => setScorePoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setScorePoints(prev => Math.max(0, prev - 1))}
                >
                  -1
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setScorePoints(prev => prev + 1)}
                >
                  +1
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setScorePoints(prev => prev + 2)}
                >
                  +2
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setScorePoints(prev => prev + 3)}
                >
                  +3
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingScore || matches.length === 0 || teams.length === 0}
              style={{ marginTop: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {submittingScore ? 'Saving Score...' : '💾 Save & Broadcast Score'}
            </button>
          </form>
        </div>
      </div>

      {/* MATCH STATUS MANAGER LIST */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          FIXTURES & STATUS CONTROLS ({matches.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.length === 0 ? (
            <div className="auth-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No matches scheduled yet. Create one above!</p>
            </div>
          ) : (
            matches.map(m => {
              const isLive = m.status === 'live';
              const isCompleted = m.status === 'completed';

              return (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                        {m.team_a_name && m.team_b_name ? `${m.team_a_name} vs ${m.team_b_name}` : m.name}
                      </span>
                      <span className="role-pill player">{m.sport || 'Football'}</span>
                      <span
                        className="role-pill"
                        style={{
                          background: isLive ? 'rgba(244, 63, 94, 0.2)' : isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(79, 172, 254, 0.2)',
                          color: isLive ? '#fb7185' : isCompleted ? '#6ee7b7' : '#00f2fe',
                          border: `1px solid ${isLive ? 'rgba(244, 63, 94, 0.4)' : isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(79, 172, 254, 0.4)'}`
                        }}
                      >
                        {isLive ? '🔴 LIVE' : isCompleted ? '🟢 COMPLETED' : '⚪ UPCOMING'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Date: {new Date(m.match_date).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn btn-sm ${m.status === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(m.id, 'upcoming')}
                      disabled={m.status === 'upcoming'}
                    >
                      Upcoming
                    </button>
                    <button
                      className={`btn btn-sm ${isLive ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(m.id, 'live')}
                      disabled={isLive}
                    >
                      🔴 Set Live
                    </button>
                    <button
                      className={`btn btn-sm ${isCompleted ? 'btn-primary' : 'btn-secondary'}`}
                      style={isCompleted ? { background: '#10b981' } : {}}
                      onClick={() => handleStatusChange(m.id, 'completed')}
                      disabled={isCompleted}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TABLE OF ALL CURRENT SCORES */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          LIVE SCORES REVIEW TABLE ({scores.length} RECORDS)
        </h3>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Match Fixture</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score / Points</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Match Status</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Updated</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No scores recorded yet. Select a match and team above to enter points!
                  </td>
                </tr>
              ) : (
                scores.map((s) => (
                  <tr 
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s ease' }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                      {s.match_name}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {s.sport || '🏅'} {s.team_name}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: 'rgba(0, 242, 254, 0.15)',
                        color: 'var(--accent-cyan)',
                        padding: '0.35rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 800,
                        fontSize: '1.1rem'
                      }}>
                        {s.points} PTS
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`role-pill ${s.match_status === 'live' ? 'admin' : 'player'}`}>
                        {s.match_status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(s.updated_at).toLocaleTimeString()} by {s.updated_by_name}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickEdit(s)}
                      >
                        ✏️ Quick Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTERED ATHLETES & SPORT ROLE DIRECTORY */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', margin: 0 }}>
              🏃 REGISTERED ATHLETES & SPORT ROLE DIRECTORY ({filteredPlayers.length} / {players.length})
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Filter registered athletes by sport and playing role to evaluate squad eligibility.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCsv('filtered-players', filteredPlayers)}
          >
            Export Filtered Athletes CSV
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="auth-card" style={{ maxWidth: '100%', marginBottom: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Search input */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', fontSize: '0.8rem' }}>Search Athlete</label>
              <input
                type="text"
                className="form-input no-icon"
                placeholder="Name, College ID, Dept..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', fontSize: '0.8rem' }}>Sport</label>
              <select
                className="form-select no-icon"
                value={playerSportFilter}
                onChange={(e) => {
                  setPlayerSportFilter(e.target.value);
                  setPlayerRoleFilter('All');
                }}
              >
                <option value="All">All Sports</option>
                {SPORT_LIST.map((sp) => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                Playing Role / Position
              </label>
              <select
                className="form-select no-icon"
                value={playerRoleFilter}
                onChange={(e) => setPlayerRoleFilter(e.target.value)}
                disabled={playerSportFilter === 'All' && availableRolesForFilter.length === 0}
              >
                <option value="All">All Roles / Positions</option>
                {availableRolesForFilter.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '0.55rem' }}
                onClick={() => {
                  setPlayerSportFilter('All');
                  setPlayerRoleFilter('All');
                  setPlayerSearchQuery('');
                }}
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Athlete</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dept / Year</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campus</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sport Roles & Attributes</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No registered athletes match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => {
                  const profiles = p.sport_profiles || {};
                  const enrolledSports = Object.keys(profiles);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{p.college_id}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>
                        <div>{p.department || '—'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.year}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {p.campus || 'Main Campus'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {enrolledSports.length === 0 ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No roles defined
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {enrolledSports
                              .filter((sp) => playerSportFilter === 'All' || sp === playerSportFilter)
                              .map((sp) => {
                                const prof = profiles[sp];
                                const tags = formatSportProfile(sp, prof);
                                return (
                                  <div key={sp} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '0.8rem', color: '#fff' }}>{sp}:</strong>
                                    {tags.length > 0 ? (
                                      tags.map((t, idx) => (
                                        <span
                                          key={idx}
                                          style={{
                                            fontSize: '0.7rem',
                                            background: 'rgba(0, 242, 254, 0.12)',
                                            color: 'var(--accent-cyan)',
                                            border: '1px solid rgba(0, 242, 254, 0.25)',
                                            padding: '0.1rem 0.45rem',
                                            borderRadius: '8px',
                                            fontWeight: 600
                                          }}
                                        >
                                          {t}
                                        </span>
                                      ))
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => onNavigate && onNavigate('player-profile', p.id)}
                        >
                          👤 Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '1.75rem' }}>
        <h3 style={{ marginBottom: '0.8rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>ADMIN AUDIT LOG</h3>
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          {auditEntries.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No administrative actions recorded yet.</p> : auditEntries.map(entry => (
            <div key={entry.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span><strong>{entry.admin_name}</strong> · {entry.action.replaceAll('_', ' ')} · {entry.entity_type}</span>
              <span style={{ color: 'var(--text-muted)' }}>{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
