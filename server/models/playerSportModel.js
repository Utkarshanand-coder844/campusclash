import { query } from '../config/db.js';

export const PlayerSportModel = {
  async getForUser(userId) {
    const { rows } = await query('SELECT sport FROM player_sports WHERE user_id = $1 ORDER BY sport ASC;', [userId]);
    return rows.map(row => row.sport);
  },
  async replaceForUser({ userId, sports }) {
    await query('DELETE FROM player_sports WHERE user_id = $1;', [userId]);
    await Promise.all(sports.map(sport => query('INSERT INTO player_sports (user_id, sport) VALUES ($1, $2) ON CONFLICT (user_id, sport) DO NOTHING RETURNING sport;', [userId, sport])));
    return this.getForUser(userId);
  }
};
