import { query } from '../config/db.js';

export const AnnouncementModel = {
  async create({ title, message, category, eventAt, isPinned, campus, createdBy, attachments = [] }) {
    const { rows } = await query(`INSERT INTO announcements (title, message, category, event_at, is_pinned, campus, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, message, category, event_at, is_pinned, campus, created_by, created_at;`,
    [title, message, category, eventAt || null, Boolean(isPinned), campus || 'all', createdBy]);
    for (const attachment of attachments) await query(`INSERT INTO event_attachments (announcement_id, label, url, attachment_type) VALUES ($1, $2, $3, $4);`, [rows[0].id, attachment.label, attachment.url, attachment.type]);
    rows[0].attachments = attachments;
    return rows[0];
  },
  async getAll(campus = null) {
    const { rows } = await query(`SELECT a.id, a.title, a.message, a.category, a.event_at, a.is_pinned, a.created_at,
      a.campus, u.name AS posted_by,
      COALESCE(json_agg(json_build_object('id', ea.id, 'label', ea.label, 'url', ea.url, 'type', ea.attachment_type)) FILTER (WHERE ea.id IS NOT NULL), '[]') AS attachments
      FROM announcements a JOIN users u ON u.id = a.created_by LEFT JOIN event_attachments ea ON ea.announcement_id = a.id
      WHERE ($1::text IS NULL OR a.campus = 'all' OR a.campus = $1)
      GROUP BY a.id, u.name ORDER BY a.is_pinned DESC, a.event_at NULLS LAST, a.created_at DESC;`, [campus]);
    return rows;
  },
  async remove(id) {
    const { rows } = await query('DELETE FROM announcements WHERE id = $1 RETURNING id, campus;', [id]);
    return rows[0] || null;
  },
  async update({ id, title, message, category, eventAt, isPinned, campus, attachments = [] }) {
    const { rows } = await query(`UPDATE announcements SET title = $1, message = $2, category = $3,
      event_at = $4, is_pinned = $5, campus = $6 WHERE id = $7
      RETURNING id, title, message, category, event_at, is_pinned, campus, created_by, created_at;`,
    [title, message, category, eventAt || null, Boolean(isPinned), campus || 'all', id]);
    if (rows[0] && attachments.length) {
      await query('DELETE FROM event_attachments WHERE announcement_id = $1;', [id]);
      for (const attachment of attachments) await query(`INSERT INTO event_attachments (announcement_id, label, url, attachment_type) VALUES ($1, $2, $3, $4);`, [id, attachment.label, attachment.url, attachment.type]);
    }
    if (rows[0]) rows[0].attachments = attachments;
    return rows[0] || null;
  }
};
