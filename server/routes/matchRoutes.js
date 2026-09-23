import express from 'express';
import { getMatches } from '../controllers/matchController.js';

const router = express.Router();

// Public route — no authenticateToken middleware, anyone can view the schedule
router.get('/', getMatches);

export default router;
