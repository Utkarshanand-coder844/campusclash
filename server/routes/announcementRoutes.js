import express from 'express';
import { getAnnouncements } from '../controllers/announcementController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
// Announcements are public — guests can see them. optionalAuth enriches the
// response for logged-in users (e.g. personalised pinning) without blocking guests.
router.get('/', optionalAuth, getAnnouncements);
export default router;
