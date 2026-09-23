import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { assignMySport, getSportsAdmins, removeMySport } from '../controllers/sportsAdminController.js';

const router = express.Router();
router.get('/', authenticateToken, getSportsAdmins);
router.post('/mine', authenticateToken, requireAdmin, assignMySport);
router.delete('/mine/:sport', authenticateToken, requireAdmin, removeMySport);

export default router;
