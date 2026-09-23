import { query } from '../config/db.js';

export const SportsAdminModel = {
  async getAll() {
    const { rows } = await query(`SELECT sa.id, sa.sport, sa.created_at, u.id AS admin_id, u.name, u.email, u.phone,
      u.department, u.campus, u.profile_photo FROM sport_admins sa JOIN users u ON u.id = sa.admin_user_id
      ORDER BY sa.sport ASC, u.name ASC;`);
    return rows;
  },

  async assign({ sport, adminUserId }) {
    const { rows } = await query(`INSERT INTO sport_admins (sport, admin_user_id)
      VALUES ($1, $2) ON CONFLICT (sport, admin_user_id) DO NOTHING
      RETURNING id, sport, admin_user_id, created_at;`, [sport, adminUserId]);
    return rows[0] || null;
  },

  async remove({ sport, adminUserId }) {
    const { rows } = await query(`DELETE FROM sport_admins WHERE LOWER(sport) = LOWER($1) AND admin_user_id = $2 RETURNING id;`, [sport, adminUserId]);
    return rows[0] || null;
  }
};

