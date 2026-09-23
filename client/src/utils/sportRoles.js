/**
 * Canonical sport-role definitions for CampusClash (frontend mirror).
 * Keep in sync with server/config/sportRoles.js.
 */

export const SPORT_ROLES = {
  Cricket: {
    label: '🏏 Cricket',
    primaryRoles: [
      'Batter',
      'Wicketkeeper Batter',
      'Batting All-rounder',
      'Bowling All-rounder',
      'Bowler'
    ],
    battingHands: [
      'Right-hand Batter',
      'Left-hand Batter',
      'Not applicable'
    ],
    bowlingStyles: [
      'Right-arm Fast',
      'Right-arm Medium Fast',
      'Right-arm Medium',
      'Right-arm Off Spin',
      'Right-arm Leg Spin',
      'Left-arm Fast',
      'Left-arm Medium Fast',
      'Left-arm Orthodox Spin',
      'Left-arm Wrist Spin',
      'None / Does not bowl'
    ]
  },

  Football: {
    label: '⚽ Football',
    positions: [
      'Goalkeeper',
      'Centre Back',
      'Full Back',
      'Wing Back',
      'Defensive Midfielder',
      'Central Midfielder',
      'Attacking Midfielder',
      'Winger',
      'Forward',
      'Striker'
    ],
    preferredFoot: [
      'Right-footed',
      'Left-footed',
      'Both'
    ]
  },

  Futsal: {
    label: '⚽ Futsal',
    positions: [
      'Goalkeeper',
      'Centre Back',
      'Full Back',
      'Wing Back',
      'Defensive Midfielder',
      'Central Midfielder',
      'Attacking Midfielder',
      'Winger',
      'Forward',
      'Striker'
    ],
    preferredFoot: [
      'Right-footed',
      'Left-footed',
      'Both'
    ]
  },

  Basketball: {
    label: '🏀 Basketball',
    positions: [
      'Point Guard',
      'Shooting Guard',
      'Small Forward',
      'Power Forward',
      'Center'
    ]
  },

  Volleyball: {
    label: '🏐 Volleyball',
    positions: [
      'Setter',
      'Outside Hitter',
      'Opposite Hitter',
      'Middle Blocker',
      'Libero',
      'Defensive Specialist'
    ]
  },

  Badminton: {
    label: '🏸 Badminton',
    categories: [
      'Singles',
      'Doubles',
      'Mixed Doubles'
    ],
    playingStyles: [
      'Attacking',
      'Defensive',
      'All-round'
    ],
    hands: [
      'Right-handed',
      'Left-handed'
    ]
  },

  'Table Tennis': {
    label: '🏓 Table Tennis',
    categories: [
      'Singles',
      'Doubles'
    ],
    playingStyles: [
      'Attacker',
      'Defender',
      'All-round'
    ],
    hands: [
      'Right-handed',
      'Left-handed'
    ]
  },

  Athletics: {
    label: '🏃 Athletics',
    events: [
      '100m',
      '200m',
      '400m',
      '800m',
      '1500m',
      'Long Distance',
      'Hurdles',
      'Relay',
      'Long Jump',
      'High Jump',
      'Triple Jump',
      'Shot Put',
      'Discus Throw',
      'Javelin Throw'
    ]
  },

  Chess: {
    label: '♟️ Chess',
    formats: [
      'Classical',
      'Rapid',
      'Blitz',
      'Bullet',
      'Open / General'
    ]
  }
};

/** Ordered list of all sport names for display */
export const SPORT_LIST = [
  'Football',
  'Cricket',
  'Basketball',
  'Volleyball',
  'Badminton',
  'Table Tennis',
  'Athletics',
  'Chess'
];

/**
 * Build a human-readable summary array for a player's sport profile.
 * @param {string} sport
 * @param {object} profile
 * @returns {string[]}
 */
export function formatSportProfile(sport, profile) {
  if (!profile) return [];
  const labels = [];
  if (profile.primary_role) labels.push(profile.primary_role);
  if (profile.position) labels.push(profile.position);
  if (profile.event_category) labels.push(profile.event_category);
  if (profile.batting_hand) labels.push(profile.batting_hand);
  if (profile.bowling_style) labels.push(profile.bowling_style);
  if (profile.playing_style) labels.push(profile.playing_style);
  if (profile.handedness) labels.push(profile.handedness);
  if (profile.preferred_foot) labels.push(profile.preferred_foot);
  return labels;
}

/**
 * Return an empty profile object for a given sport.
 * @param {string} sport
 * @returns {object}
 */
export function emptyProfile(sport) {
  const base = {
    primary_role: '',
    position: '',
    batting_hand: '',
    bowling_style: '',
    playing_style: '',
    handedness: '',
    preferred_foot: '',
    event_category: ''
  };
  return base;
}
