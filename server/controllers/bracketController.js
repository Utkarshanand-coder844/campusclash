import { BracketModel } from '../models/bracketModel.js';

/** Public tournament bracket. A sport is required to keep results focused and inexpensive. */
export const getPublicBracket = async (req, res) => {
  try {
    const sport = typeof req.query.sport === 'string' ? req.query.sport.trim() : '';
    if (!sport) return res.status(400).json({ success: false, message: 'Sport is required' });
    const fixtures = await BracketModel.getForSport(sport);
    return res.json({ success: true, sport, fixtures });
  } catch (error) {
    console.error('Public bracket error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load the tournament bracket' });
  }
};
