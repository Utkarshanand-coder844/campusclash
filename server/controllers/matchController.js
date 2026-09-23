import { MatchModel } from '../models/matchModel.js';

/**
 * GET /api/matches
 * Public route — anyone can view the match schedule/fixtures list, no login required
 */
export const getMatches = async (req, res) => {
  try {
    const matches = await MatchModel.getAllMatches();
    return res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching matches'
    });
  }
};
