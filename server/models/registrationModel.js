import { query } from '../config/db.js';

export const RegistrationModel = {
  async getDeadline(sport) {
    const { rows } = await query('SELECT sport, opens_at, closes_at, updated_at FROM registration_deadlines WHERE sport = $1 LIMIT 1;', [sport]);
    return rows[0] || null;
  },

  async getAllDeadlines() {
    const { rows } = await query('SELECT sport, opens_at, closes_at, updated_at FROM registration_deadlines ORDER BY sport ASC;');
    return rows;
  },

  async saveDeadline({ sport, opensAt, closesAt }) {
    const { rows } = await query(`INSERT INTO registration_deadlines (sport, opens_at, closes_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (sport) DO UPDATE SET opens_at = EXCLUDED.opens_at, closes_at = EXCLUDED.closes_at, updated_at = CURRENT_TIMESTAMP
      RETURNING sport, opens_at, closes_at, updated_at;`, [sport, opensAt, closesAt]);
    return rows[0];
  },

  async isRegistrationOpen(sport) {
    const deadline = await this.getDeadline(sport);
    if (!deadline) return true;
    const now = Date.now();
    return (!deadline.opens_at || new Date(deadline.opens_at).getTime() <= now) && (!deadline.closes_at || now <= new Date(deadline.closes_at).getTime());
  }
};
