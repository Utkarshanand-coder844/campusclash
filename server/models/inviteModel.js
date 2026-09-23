import { query } from '../config/db.js';

export const InviteModel = {
  async create({ teamId, invitedUserId, invitedBy }) {
    const { rows } = await query(`INSERT INTO team_invites (team_id, invited_user_id, invited_by)
      VALUES ($1, $2, $3) RETURNING id, team_id, invited_user_id, invited_by, status, created_at;`, [teamId, invitedUserId, invitedBy]);
    return rows[0];
  },
  async getForUser(userId) {
    const { rows } = await query(`SELECT i.*, t.name AS team_name, t.sport, u.name AS invited_by_name
      FROM team_invites i JOIN teams t ON t.id = i.team_id JOIN users u ON u.id = i.invited_by
      WHERE i.invited_user_id = $1 ORDER BY i.created_at DESC;`, [userId]);
    return rows;
  },
  async respond({ inviteId, userId, status }) {
    const { rows } = await query(`UPDATE team_invites SET status = $1, responded_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND invited_user_id = $3 AND status = 'pending'
      RETURNING id, team_id, invited_user_id, status, responded_at;`, [status, inviteId, userId]);
    return rows[0] || null;
  }
};
