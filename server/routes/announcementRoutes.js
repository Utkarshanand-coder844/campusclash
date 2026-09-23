import express from 'express';
import { getAnnouncements } from '../controllers/announcementController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', authenticateToken, getAnnouncements);
export default router;
