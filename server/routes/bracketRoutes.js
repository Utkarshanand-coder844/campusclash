import express from 'express';
import { getPublicBracket } from '../controllers/bracketController.js';

const router = express.Router();
router.get('/', getPublicBracket);
export default router;
