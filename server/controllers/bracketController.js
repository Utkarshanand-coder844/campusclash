import { BracketModel } from '../models/bracketModel.js';

/** Public tournament bracket. Defaults to Football when no sport is supplied. */
export const getPublicBracket = async (req, res) => {
  try {
    const sport = (typeof req.query.sport === 'string' && req.query.sport.trim())
      ? req.query.sport.trim()
      : 'Football'; // sensible default so the public bracket page loads without a ?sport= param
    const fixtures = await BracketModel.getForSport(sport);
    return res.json({ success: true, sport, fixtures });
  } catch (error) {
    console.error('Public bracket error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load the tournament bracket' });
  }
};
