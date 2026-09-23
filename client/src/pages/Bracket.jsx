import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/Alert';

export const ScoreHub = () => {
  const [sport, setSport] = useState('Football');
  const [format, setFormat] = useState('league');
  const [knockoutFixtures, setKnockoutFixtures] = useState([]);
  const [leagueFixtures, setLeagueFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [bracketResponse, leaderboardResponse, matchesResponse] = await Promise.all([
          fetch(`/api/brackets?sport=${encodeURIComponent(sport)}`),
          fetch(`/api/leaderboard?sport=${encodeURIComponent(sport)}`),
          fetch('/api/matches')
        ]);
        const [bracketData, leaderboardData, matchesData] = await Promise.all([bracketResponse.json(), leaderboardResponse.json(), matchesResponse.json()]);
        if (!bracketResponse.ok || !bracketData.success) throw new Error(bracketData.message || 'Unable to load knockout fixtures');
        if (!leaderboardResponse.ok || !leaderboardData.success) throw new Error(leaderboardData.message || 'Unable to load league standings');
        if (!matchesResponse.ok || !matchesData.success) throw new Error(matchesData.message || 'Unable to load league fixtures');
        const bracketItems = bracketData.fixtures || [];
        const knockoutMatchIds = new Set(bracketItems.map((fixture) => fixture.match_id));
        setKnockoutFixtures(bracketItems);
        setStandings(leaderboardData.leaderboard || []);
        setLeagueFixtures((matchesData.matches || []).filter((match) => match.sport === sport && !knockoutMatchIds.has(match.id)));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [sport]);
  const rounds = useMemo(() => knockoutFixtures.reduce((result, fixture) => { (result[fixture.round_number] ||= []).push(fixture); return result; }, {}), [knockoutFixtures]);
  return <div className="dashboard-container" style={{ maxWidth: '1080px' }}>
    <div className="auth-header" style={{ textAlign: 'left', marginBottom: 0 }}><h1>🏆 ScoreHub</h1><p>Your tournament center for league standings, fixtures, knockout rounds, and results.</p></div>
    <div className="form-group" style={{ maxWidth: 260 }}><label className="form-label">Sport</label><select className="form-select no-icon" value={sport} onChange={e => setSport(e.target.value)}>{['Badminton', 'Table Tennis', 'Cricket', 'Football'].map(item => <option key={item}>{item}</option>)}</select></div>
    <div className="scorehub-tabs" role="tablist" aria-label="Tournament format">
      <button role="tab" aria-selected={format === 'league'} className={`btn btn-sm ${format === 'league' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormat('league')}>📊 League format</button>
      <button role="tab" aria-selected={format === 'knockout'} className={`btn btn-sm ${format === 'knockout' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormat('knockout')}>🏁 Knockout format</button>
    </div>
    <Alert type="error" message={error} />
    {loading ? <div className="auth-card">Loading ScoreHub…</div> : format === 'league' ? <>
      <div className="scorehub-section-heading"><div><h2>League standings</h2><p>Teams earn 3 points for a win and 1 point for a draw.</p></div><span className="role-pill player">{sport}</span></div>
      {standings.length === 0 ? <div className="auth-card">No completed league matches have been recorded for {sport} yet.</div> : <div className="scorehub-table-wrap"><table className="scorehub-table"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Diff</th><th>Pts</th></tr></thead><tbody>{standings.map((team) => <tr key={team.team_id}><td>{team.rank}</td><td><strong>{team.team_name}</strong></td><td>{team.played}</td><td>{team.wins}</td><td>{team.draws}</td><td>{team.losses}</td><td>{team.score_difference > 0 ? '+' : ''}{team.score_difference}</td><td><strong>{team.total_points}</strong></td></tr>)}</tbody></table></div>}
      <div className="scorehub-section-heading"><div><h2>League fixtures</h2><p>Round-robin or group-stage fixtures created by the administrator.</p></div></div>
      {leagueFixtures.length === 0 ? <div className="auth-card">No league fixtures have been scheduled for {sport} yet.</div> : <div className="league-fixtures">{leagueFixtures.map((match) => <article key={match.id} className="league-fixture"><span className={`role-pill ${match.status === 'live' ? 'admin' : 'player'}`}>{match.status}</span><strong>{match.team_a_name || 'TBD'} <em>vs</em> {match.team_b_name || 'TBD'}</strong><span>{new Date(match.match_date).toLocaleString()}</span>{match.status !== 'upcoming' && <b>{match.team_a_score ?? '-'} – {match.team_b_score ?? '-'}</b>}</article>)}</div>}
    </> : knockoutFixtures.length === 0 ? <div className="auth-card">No knockout format has been generated for {sport} yet.</div> : <div className="bracket-board">{Object.entries(rounds).map(([round, matches]) => <section key={round} className="bracket-round"><h3>Round {round}</h3>{matches.map(match => <div className="bracket-fixture" key={match.id}><strong>{match.team_a_name || 'TBD'}</strong><span>vs</span><strong>{match.team_b_name || 'TBD'}</strong><small>{match.status} · {new Date(match.match_date).toLocaleString()}</small></div>)}</section>)}</div>}
  </div>;
};
