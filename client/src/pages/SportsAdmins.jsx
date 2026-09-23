import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';

const toTitleCase = (str) =>
  str ? str.replace(/\b\w/g, (c) => c.toUpperCase()) : '';

export const SportsAdmins = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [registeredSports, setRegisteredSports] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'my-sports'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/sports-admins', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load sports administrators');
        const list = data.admins || [];
        const fullList = data.allAdmins || list;
        setAdmins(list);
        setAllAdmins(fullList);
        setRegisteredSports(data.registeredSports || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Filter based on active tab and search query
  const displayedAdmins = (filterMode === 'my-sports'
    ? allAdmins.filter((a) => a.is_my_sport)
    : allAdmins
  ).filter((admin) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      admin.sport?.toLowerCase().includes(q) ||
      admin.name?.toLowerCase().includes(q) ||
      admin.campus?.toLowerCase().includes(q) ||
      admin.department?.toLowerCase().includes(q)
    );
  });

  // Group by canonical title-cased sport name
  const groupedAdmins = displayedAdmins.reduce((groups, admin) => {
    const sportKey = toTitleCase(admin.sport || 'General');
    (groups[sportKey] ||= []).push(admin);
    return groups;
  }, {});

  const mySportsCount = allAdmins.filter((a) => a.is_my_sport).length;

  return (
    <div className="dashboard-container" style={{ maxWidth: '980px' }}>
      <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1>🛡️ Sports Administrators</h1>
            <p>Connect with faculty and staff in charge of tournaments and sports at CampusClash.</p>
          </div>
          {user?.role === 'admin' && onNavigate && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('admin-dashboard')}
            >
              ⚙️ Manage Sports Admins
            </button>
          )}
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Filter and Search Bar */}
      <div
        className="auth-card"
        style={{
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.9rem 1.2rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterMode('all')}
          >
            All Sports ({allAdmins.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterMode === 'my-sports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterMode('my-sports')}
          >
            My Enrolled Sports {mySportsCount > 0 ? `(${mySportsCount})` : ''}
          </button>
        </div>

        <input
          type="text"
          className="form-input no-icon"
          style={{ maxWidth: '280px', padding: '0.45rem 0.8rem', fontSize: '0.88rem' }}
          placeholder="Search by sport, name, campus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="auth-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading sports administrators...</p>
        </div>
      ) : Object.keys(groupedAdmins).length === 0 ? (
        <div className="auth-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛡️</div>
          <h3 style={{ marginBottom: '0.5rem' }}>
            {filterMode === 'my-sports'
              ? 'No administrators assigned to your enrolled sports yet'
              : 'No matching sports administrators found'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
            {filterMode === 'my-sports'
              ? 'You can view the full directory to contact administrators for any sport across the college.'
              : 'Try clearing your search query or check back later.'}
          </p>
          {filterMode === 'my-sports' && (
            <button className="btn btn-primary btn-sm" onClick={() => setFilterMode('all')}>
              View All Sports Administrators ({allAdmins.length})
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {Object.entries(groupedAdmins).map(([sport, sportAdmins]) => (
            <section
              className="auth-card"
              style={{
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              key={sport}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🏅 {sport}</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {sportAdmins.length} {sportAdmins.length === 1 ? 'Admin' : 'Admins'}
                  </span>
                </div>

                {sportAdmins.map((admin, idx) => (
                  <div
                    key={admin.id || idx}
                    style={{
                      paddingTop: idx > 0 ? '0.85rem' : '0.4rem',
                      marginTop: idx > 0 ? '0.85rem' : '0',
                      borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                      {admin.profile_photo ? (
                        <img
                          src={admin.profile_photo}
                          alt={`${admin.name}'s profile`}
                          style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'rgba(0, 242, 254, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                          }}
                        >
                          🛡️
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{admin.name}</strong>
                          {admin.is_my_sport && (
                            <span
                              style={{
                                background: 'rgba(0, 242, 254, 0.18)',
                                color: 'var(--accent-cyan)',
                                border: '1px solid rgba(0, 242, 254, 0.35)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '10px',
                                fontSize: '0.72rem',
                                fontWeight: 600
                              }}
                            >
                              🎯 Your Sport
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {admin.department} {admin.campus ? `• ${admin.campus}` : ''}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '0.65rem 0.8rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      {admin.email && (
                        <div>
                          ✉️ <a href={`mailto:${admin.email}`} style={{ color: 'var(--accent-cyan)' }}>{admin.email}</a>
                        </div>
                      )}
                      {admin.phone && (
                        <div>
                          📞 <a href={`tel:${admin.phone}`} style={{ color: 'var(--text-primary)' }}>{admin.phone}</a>
                        </div>
                      )}
                    </div>

                    {/* Direct action button */}
                    {onNavigate && admin.admin_id && admin.admin_id !== user?.id && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.82rem' }}
                        onClick={() => onNavigate('chat', admin.admin_id)}
                      >
                        💬 Send Direct Message
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
