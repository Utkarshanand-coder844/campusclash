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
      if (rows[0]) rows[0].attachments = announcement.attachments || [];
      return rows[0];
    }));
    return notifications;
  },

  async getForUser(userId) {
    const { rows } = await query(`
      SELECT n.id, n.type, n.title, n.message, n.announcement_id, n.read_at, n.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', ea.id, 'label', ea.label, 'url', ea.url, 'type', ea.attachment_type)
          ) FILTER (WHERE ea.id IS NOT NULL),
          '[]'
        ) AS attachments
      FROM notifications n
      LEFT JOIN event_attachments ea ON ea.announcement_id = n.announcement_id
      WHERE n.user_id = $1
      GROUP BY n.id
      ORDER BY n.created_at DESC
      LIMIT 100;
    `, [userId]);
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
