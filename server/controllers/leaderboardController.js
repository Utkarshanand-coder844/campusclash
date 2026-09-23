import { MatchModel } from '../models/matchModel.js';

/**
 * GET /api/leaderboard
 * Public route — no auth required. Anyone can check live standings.
 */
export const getLeaderboard = async (req, res) => {
  try {
    const sport = typeof req.query.sport === 'string' && req.query.sport.trim() ? req.query.sport.trim() : null;
    const leaderboard = await MatchModel.getLeaderboard(sport);
    return res.json({
      success: true,
      leaderboard,
      sport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching leaderboard'
    });
  }
};
