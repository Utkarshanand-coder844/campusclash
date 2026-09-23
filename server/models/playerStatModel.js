import { query } from '../config/db.js';

export const PlayerStatModel = {
  async upsert({ matchId, teamId, playerId, statType, value, recordedBy }) {
    const { rows } = await query(`INSERT INTO player_stats (match_id, team_id, player_id, stat_type, value, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (match_id, player_id, stat_type) DO UPDATE SET value = EXCLUDED.value, team_id = EXCLUDED.team_id, recorded_by = EXCLUDED.recorded_by, updated_at = CURRENT_TIMESTAMP
      RETURNING id, match_id, team_id, player_id, stat_type, value, updated_at;`, [matchId, teamId, playerId, statType, value, recordedBy]);
    return rows[0];
  },
  async getForPlayer(playerId) {
    const { rows } = await query(`SELECT ps.id, ps.stat_type, ps.value, ps.updated_at, m.name AS match_name, m.sport, t.name AS team_name
      FROM player_stats ps JOIN matches m ON m.id = ps.match_id JOIN teams t ON t.id = ps.team_id
      WHERE ps.player_id = $1 ORDER BY ps.updated_at DESC;`, [playerId]);
    return rows;
  }
};
