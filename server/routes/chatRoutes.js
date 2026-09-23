import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getChatPlayers, getMessages, sendMessage, getUnreadCount } from '../controllers/chatController.js';
const router = express.Router();
router.use(authenticateToken);
router.get('/unread/count', getUnreadCount);
router.get('/players', getChatPlayers);
router.get('/:playerId', getMessages);
router.post('/:playerId', sendMessage);
export default router;

