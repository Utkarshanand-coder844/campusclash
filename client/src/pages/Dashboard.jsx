import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { getAuthHeaders } from '../utils/authFetch';

export const Dashboard = ({ onNavigate }) => {
  const { user, token, fetchProfile } = useAuth();
  const [adminTestStatus, setAdminTestStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2>No Active Session</h2>
        <p>Your session was cleared or you have not logged in yet.</p>
      </div>
    );
  }

  // Get initials for avatar
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AT';

  // Test the /api/auth/admin-only endpoint to verify requireAdmin middleware
  const testAdminRoute = async () => {
    setAdminTestStatus(null);
    try {
      const res = await fetch('/api/auth/admin-only', {
        headers: getAuthHeaders(token)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminTestStatus({ type: 'success', message: `✅ Admin Access Granted: ${data.message}` });
      } else {
        setAdminTestStatus({ type: 'error', message: `🔒 ${data.message || 'Forbidden: requireAdmin blocked this route'}` });
      }
    } catch (err) {
      setAdminTestStatus({ type: 'error', message: `Connection error: ${err.message}` });
    }
  };

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  return (
    <div className="dashboard-container">
      {/* Athlete ID Card Hero */}
      <div className="id-card-hero">
        <div className="id-card-header">
          <div className="id-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Verified Campus Clash Athlete Credential</span>
          </div>

          <span className={`role-pill ${user.role}`}>
            {user.role === 'admin' ? '🛡️ Tournament Admin' : '⚡ Player Member'}
          </span>
        </div>

        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{user.profile_photo ? <img src={user.profile_photo} alt={`${user.name}'s profile`} /> : initials}</div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <div className="profile-sub">
              <span><strong>ID:</strong> {user.college_id}</span>
              <span>•</span>
              <span>{user.department}</span>
              <span>•</span>
              <span>{user.year}</span>
            </div>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-item">
            <div className="detail-label">College ID</div>
            <div className="detail-value">{user.college_id}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Department / Branch</div>
            <div className="detail-value">{user.department}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Email Contact</div>
            <div className="detail-value" style={{ fontSize: '0.95rem' }}>{user.email}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Phone</div>
            <div className="detail-value">{user.phone}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Account Role</div>
            <div className="detail-value" style={{ textTransform: 'capitalize' }}>{user.role}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Session Token Storage</div>
            <div className="detail-value" style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
              In-Memory Context (Safe)
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleRefreshProfile}
            disabled={refreshing}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Verify GET /api/auth/me'}
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={testAdminRoute}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Test Admin Middleware Guard
          </button>
        </div>

        {adminTestStatus && (
          <div style={{ marginTop: '1rem' }}>
            <Alert type={adminTestStatus.type} message={adminTestStatus.message} />
          </div>
        )}
      </div>

      {/* Quick Action Preview for Subsequent Tournament Prompts */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          TOURNAMENT WORKSPACE
        </h3>
        <div className="actions-row">
          <div className="action-card">
            <div>
              <h3>
                <span style={{ color: 'var(--accent-cyan)' }}>⚽</span> 
                Create or Manage Squad
              </h3>
              <p>Form a squad with your classmates, assign team positions, or view your current roster.</p>
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onNavigate && onNavigate('my-team')}
            >
              Go to My Team →
            </button>
          </div>

          <div className="action-card">
            <div>
              <h3>
                <span style={{ color: 'var(--accent-amber)' }}>🏆</span> 
                Live Match Scores
              </h3>
              <p>Real-time match scores updated live by tournament referees and admins.</p>
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onNavigate && onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'leaderboard')}
            >
              {user.role === 'admin' ? 'Go to Admin Desk →' : 'View Live Scores →'}
            </button>
          </div>

          <div className="action-card">
            <div>
              <h3>
                <span style={{ color: 'var(--accent-purple)' }}>📊</span> 
                Tournament Leaderboard
              </h3>
              <p>League points tables, fixtures, knockout rounds, and championship standings.</p>
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onNavigate && onNavigate('scorehub')}
            >
              Open ScoreHub →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
