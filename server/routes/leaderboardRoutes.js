import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

// Public route — no authenticateToken middleware, viewers don't need to log in
router.get('/', getLeaderboard);

export default router;
