import { NotificationModel } from '../models/notificationModel.js';

const userId = (req) => req.user.id || req.user.userId;

export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.getForUser(userId(req));
    return res.json({ success: true, notifications, unreadCount: notifications.filter(item => !item.read_at).length });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load notifications' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await NotificationModel.markRead({ id: req.params.id, userId: userId(req) });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update notification' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const updatedCount = await NotificationModel.markAllRead(userId(req));
    return res.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update notifications' });
  }
};
