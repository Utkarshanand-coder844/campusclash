import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getMySports, updateMySports,
  getMyProfiles, getProfilesForUser, updateMyProfile, updateMyProfilesBatch,
  getPlayersForSport
} from '../controllers/playerSportController.js';

const router = express.Router();
router.use(authenticateToken);

// Sport registrations
router.get('/mine', getMySports);
router.put('/mine', updateMySports);

// Sport role profiles
router.get('/profiles', getMyProfiles);
router.get('/profiles/:userId', getProfilesForUser);
router.put('/profile', updateMyProfile);
router.put('/profiles/batch', updateMyProfilesBatch);

// Players list for a sport (with role data)
router.get('/players', getPlayersForSport);

export default router;
