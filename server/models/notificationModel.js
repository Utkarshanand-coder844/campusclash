import { query } from '../config/db.js';

export const NotificationModel = {
  async create({ userId, type, title, message }) {
    const { rows } = await query(`INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, type, title, message, announcement_id, read_at, created_at;`, [userId, type, title, message]);
    return rows[0];
  },
  async createForUsers({ userIds, announcement }) {
    const notifications = await Promise.all(userIds.map(async (userId) => {
      const { rows } = await query(`INSERT INTO notifications (user_id, type, title, message, announcement_id)
        VALUES ($1, 'announcement', $2, $3, $4)
        RETURNING id, user_id, type, title, message, announcement_id, read_at, created_at;`,
      [userId, announcement.title, announcement.message, announcement.id]);
      return rows[0];
    }));
    return notifications;
  },

  async getForUser(userId) {
    const { rows } = await query(`SELECT id, type, title, message, announcement_id, read_at, created_at
      FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100;`, [userId]);
    return rows;
  },

  async markRead({ id, userId }) {
    const { rows } = await query(`UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = $1 AND user_id = $2
      RETURNING id, type, title, message, announcement_id, read_at, created_at;`, [id, userId]);
    return rows[0] || null;
  },

  async markAllRead(userId) {
    const { rows } = await query(`UPDATE notifications SET read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND read_at IS NULL RETURNING id;`, [userId]);
    return rows.length;
  }
};
