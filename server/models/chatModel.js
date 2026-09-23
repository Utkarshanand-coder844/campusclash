import { query } from '../config/db.js';

export const ChatModel = {
  async getPlayers(excludeUserId) {
    const { rows } = await query(`SELECT id, name, department, campus, year, role, profile_photo FROM users
      WHERE id <> $1 ORDER BY name ASC;`, [excludeUserId]);
    return rows;
  },
  async getMessages({ userId, peerId }) {
    const { rows } = await query(`SELECT id, sender_id, recipient_id, body, read_at, created_at FROM direct_messages
      WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY created_at ASC;`, [userId, peerId]);
    return rows;
  },
  async send({ senderId, recipientId, body }) {
    const { rows } = await query(`INSERT INTO direct_messages (sender_id, recipient_id, body)
      VALUES ($1, $2, $3) RETURNING id, sender_id, recipient_id, body, read_at, created_at;`, [senderId, recipientId, body]);
    return rows[0];
  },
  async markRead({ userId, peerId }) {
    const { rows } = await query(`UPDATE direct_messages SET read_at = CURRENT_TIMESTAMP
      WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL RETURNING id;`, [peerId, userId]);
    return rows.length;
  },
  async getUnreadCount(userId) {
    const { rows } = await query(`SELECT COUNT(*)::int AS count FROM direct_messages WHERE recipient_id = $1 AND read_at IS NULL;`, [userId]);
    return Number(rows[0]?.count) || 0;
  }
};
