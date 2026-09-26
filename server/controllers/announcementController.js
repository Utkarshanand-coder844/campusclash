import { AnnouncementModel } from '../models/announcementModel.js';
import { UserModel } from '../models/userModel.js';

/** Public event and tournament notice feed. Works for guests (req.user may be undefined). */
export const getAnnouncements = async (req, res) => {
  try {
    // req.user is only set when a valid JWT was provided (optionalAuth).
    // Guests get all campus-agnostic announcements (campus = null).
    const userId = req.user?.id || req.user?.userId || null;
    let campus = null;
    if (userId) {
      const user = await UserModel.findById(userId);
      campus = user?.campus || null;
    }
    return res.json({ success: true, announcements: await AnnouncementModel.getAll(campus) });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load announcements' });
  }
};

