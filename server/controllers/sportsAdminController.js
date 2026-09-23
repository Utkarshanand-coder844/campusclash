import { SportsAdminModel } from '../models/sportsAdminModel.js';
import { PlayerSportModel } from '../models/playerSportModel.js';
import { UserModel } from '../models/userModel.js';
import { SUPPORTED_SPORTS } from '../config/sportRoles.js';

const userId = (req) => req.user.id || req.user.userId;
const validSport = (value) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 60;

// Capitalize first letter of each word as canonical fallback
const toTitleCase = (str) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

export const getSportsAdmins = async (_req, res) => {
  try {
    const allAdmins = await SportsAdminModel.getAll();
    if (_req.user.role === 'admin') {
      return res.json({ success: true, admins: allAdmins, allAdmins });
    }

    const registeredSports = await PlayerSportModel.getForUser(userId(_req));
    const player = await UserModel.findById(userId(_req));
    const playerCampus = (player?.campus || '').trim().toLowerCase();
    const registeredSportsLower = (registeredSports || []).map(s => (s || '').trim().toLowerCase());

    // Enrich each admin record with relevance flags for this player
    const enriched = allAdmins.map(admin => {
      const adminSportLower = (admin.sport || '').trim().toLowerCase();
      const adminCampusLower = (admin.campus || '').trim().toLowerCase();

      const isMySport = registeredSportsLower.includes(adminSportLower);
      const isMyCampus = !adminCampusLower || adminCampusLower === 'all' || adminCampusLower === playerCampus;

      return {
        ...admin,
        is_my_sport: isMySport,
        is_my_campus: isMyCampus
      };
    });

    const filterMode = _req.query.filter; // 'my-sports' | 'all'
    let visibleAdmins;

    if (filterMode === 'my-sports') {
      visibleAdmins = enriched.filter(a => a.is_my_sport);
    } else {
      // By default: Show all admins, prioritized by player's enrolled sport and campus
      visibleAdmins = [...enriched].sort((a, b) => {
        if (a.is_my_sport && a.is_my_campus && (!b.is_my_sport || !b.is_my_campus)) return -1;
        if (b.is_my_sport && b.is_my_campus && (!a.is_my_sport || !a.is_my_campus)) return 1;
        if (a.is_my_sport && !b.is_my_sport) return -1;
        if (b.is_my_sport && !a.is_my_sport) return 1;
        return (a.sport || '').localeCompare(b.sport || '') || (a.name || '').localeCompare(b.name || '');
      });
    }

    return res.json({
      success: true,
      admins: visibleAdmins,
      allAdmins: enriched,
      registeredSports,
      playerCampus: player?.campus || 'Main Campus'
    });
  } catch (error) {
    console.error('Get sports admins error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load sports administrators' });
  }
};

export const assignMySport = async (req, res) => {
  try {
    if (!validSport(req.body.sport)) return res.status(400).json({ success: false, message: 'Enter a sport name up to 60 characters.' });
    const rawSport = req.body.sport.trim();
    // Normalize to canonical casing from SUPPORTED_SPORTS (e.g. 'badminton' -> 'Badminton')
    const canonicalSport = SUPPORTED_SPORTS.find(s => s.toLowerCase() === rawSport.toLowerCase()) || toTitleCase(rawSport);
    const assignment = await SportsAdminModel.assign({ sport: canonicalSport, adminUserId: userId(req) });
    return res.status(assignment ? 201 : 200).json({
      success: true,
      message: assignment ? `You are now listed for ${canonicalSport}.` : `You are already listed for ${canonicalSport}.`,
      assignment
    });
  } catch (error) {
    console.error('Assign sports admin error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save sports administrator assignment' });
  }
};

export const removeMySport = async (req, res) => {
  try {
    if (!validSport(req.params.sport)) return res.status(400).json({ success: false, message: 'Invalid sport name.' });
    const assignment = await SportsAdminModel.remove({ sport: req.params.sport.trim(), adminUserId: userId(req) });
    if (!assignment) return res.status(404).json({ success: false, message: 'Sports administrator assignment not found.' });
    return res.json({ success: true, message: 'Sports administrator assignment removed.' });
  } catch (error) {
    console.error('Remove sports admin error:', error);
    return res.status(500).json({ success: false, message: 'Unable to remove sports administrator assignment' });
  }
};

