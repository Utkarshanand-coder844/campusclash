import { AnnouncementModel } from '../models/announcementModel.js';
import { UserModel } from '../models/userModel.js';

/** Public event and tournament notice feed. */
export const getAnnouncements = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id || req.user.userId);
    return res.json({ success: true, announcements: await AnnouncementModel.getAll(user?.campus || null) });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load announcements' });
  }
};
