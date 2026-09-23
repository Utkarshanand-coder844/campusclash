import './server/config/env.js';
import { PlayerSportProfileModel } from './server/models/playerSportProfileModel.js';
import { UserModel } from './server/models/userModel.js';
import { CommunityModel } from './server/models/communityModel.js';
import { validateSportProfile } from './server/config/sportRoles.js';

async function runTests() {
  console.log('🧪 Starting Player Role System Validation...\n');
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Create a test user
  const user = await UserModel.create({
    college_id: 'CS2026TEST',
    name: 'Rahul Sharma',
    department: 'CSE',
    campus: 'North Campus',
    year: '3rd Year',
    email: 'rahul.test@campus.edu',
    phone: '9876543210',
    password_hash: 'dummyhash',
    role: 'player'
  });
  assert('Created test user', user && user.id);

  // 2. Validate role validation function
  const validCricket = validateSportProfile('Cricket', {
    primary_role: 'Batting All-rounder',
    batting_hand: 'Right-hand Batter',
    bowling_style: 'Right-arm Medium Fast'
  });
  assert('Valid Cricket profile accepted', validCricket === null);

  const invalidCricket = validateSportProfile('Cricket', {
    primary_role: 'Super Goal Striker'
  });
  assert('Invalid Cricket role rejected', invalidCricket !== null);

  // 3. Upsert Cricket Profile for Rahul
  const cricketProfile = await PlayerSportProfileModel.upsertProfile({
    userId: user.id,
    sport: 'Cricket',
    primary_role: 'Batting All-rounder',
    batting_hand: 'Right-hand Batter',
    bowling_style: 'Right-arm Medium Fast'
  });
  assert('Cricket profile saved', cricketProfile && cricketProfile.sport === 'Cricket');
  assert('Cricket primary_role is Batting All-rounder', cricketProfile.primary_role === 'Batting All-rounder');

  // 4. Upsert Football Profile for same user
  const footballProfile = await PlayerSportProfileModel.upsertProfile({
    userId: user.id,
    sport: 'Football',
    position: 'Central Midfielder',
    preferred_foot: 'Right-footed'
  });
  assert('Football profile saved', footballProfile && footballProfile.sport === 'Football');
  assert('Football position is Central Midfielder', footballProfile.position === 'Central Midfielder');

  // 5. Verify both profiles coexist without overwriting
  const allProfiles = await PlayerSportProfileModel.getForUser(user.id);
  assert('Both profiles exist for user', allProfiles.length === 2);
  const cricketSaved = allProfiles.find(p => p.sport === 'Cricket');
  const footballSaved = allProfiles.find(p => p.sport === 'Football');
  assert('Cricket profile retained intact', cricketSaved && cricketSaved.primary_role === 'Batting All-rounder');
  assert('Football profile retained intact', footballSaved && footballSaved.position === 'Central Midfielder');

  // 6. getForUserAndSport
  const singleCricket = await PlayerSportProfileModel.getForUserAndSport(user.id, 'Cricket');
  assert('getForUserAndSport returns correct profile', singleCricket && singleCricket.bowling_style === 'Right-arm Medium Fast');

  // 7. getAllPlayersWithProfiles
  const playersWithProfiles = await PlayerSportProfileModel.getAllPlayersWithProfiles();
  const rahulEnriched = playersWithProfiles.find(p => p.id === user.id);
  assert('getAllPlayersWithProfiles enriches player', rahulEnriched && rahulEnriched.sport_profiles);
  assert('Enriched player has Cricket profile', rahulEnriched.sport_profiles.Cricket?.primary_role === 'Batting All-rounder');
  assert('Enriched player has Football profile', rahulEnriched.sport_profiles.Football?.position === 'Central Midfielder');

  // 8. searchByRole
  const cricketAllRounders = await PlayerSportProfileModel.searchByRole({
    sport: 'Cricket',
    role: 'All-rounder'
  });
  assert('searchByRole finds Cricket batting all-rounder', cricketAllRounders.some(p => p.id === user.id));

  const footballMidfielders = await PlayerSportProfileModel.searchByRole({
    sport: 'Football',
    position: 'Midfielder'
  });
  assert('searchByRole finds Football central midfielder', footballMidfielders.some(p => p.id === user.id));

  const bowlers = await PlayerSportProfileModel.searchByRole({
    sport: 'Cricket',
    role: 'Bowler'
  });
  assert('searchByRole does not match incorrect role', !bowlers.some(p => p.id === user.id && p.primary_role === 'Bowler'));

  // 9. Community Text Search (Discovery search)
  const searchResults = await CommunityModel.search({ q: 'Batting All-rounder' });
  const matchedPlayer = searchResults.players.find(p => p.id === user.id);
  assert('CommunityModel.search finds player by role keyword', matchedPlayer !== undefined);
  assert('Role match snippet included in search result', matchedPlayer && matchedPlayer.sport_role_match.includes('Cricket'));

  // 10. Controller integration: Signup with sportProfiles
  const { signup } = await import('./server/controllers/authController.js');
  let signupResponse = null;
  const mockReq = {
    body: {
      college_id: 'CS2026SIGNUP',
      name: 'Ananya Verma',
      department: 'ECE',
      campus: 'South Campus',
      year: '2nd Year',
      email: 'ananya.signup@campus.edu',
      phone: '9123456780',
      password: 'password123',
      role: 'player',
      sports: ['Badminton', 'Table Tennis'],
      sportProfiles: {
        Badminton: {
          event_category: 'Doubles',
          playing_style: 'Attacking',
          handedness: 'Right-handed'
        },
        'Table Tennis': {
          event_category: 'Singles',
          playing_style: 'Attacker',
          handedness: 'Right-handed'
        }
      }
    }
  };
  const mockRes = {
    status(code) { this.statusCode = code; return this; },
    json(data) { signupResponse = data; return this; }
  };
  await signup(mockReq, mockRes);
  assert('Signup controller succeeds with sport profiles', signupResponse && signupResponse.success === true);
  const ananyaUser = signupResponse?.user;
  const ananyaProfiles = await PlayerSportProfileModel.getForUser(ananyaUser?.id);
  assert('Signup saved Badminton profile', ananyaProfiles.some(p => p.sport === 'Badminton' && p.playing_style === 'Attacking'));
  assert('Signup saved Table Tennis profile', ananyaProfiles.some(p => p.sport === 'Table Tennis' && p.playing_style === 'Attacker'));

  // 11. Controller integration: teamController.getRegisteredPlayers returns enriched sport_profiles
  const { getRegisteredPlayers } = await import('./server/controllers/teamController.js');
  let teamPlayersResponse = null;
  await getRegisteredPlayers({}, { json(data) { teamPlayersResponse = data; return this; }, status() { return this; } });
  assert('teamController.getRegisteredPlayers succeeds', teamPlayersResponse && teamPlayersResponse.success === true);
  const teamAnanya = teamPlayersResponse?.players.find(p => p.id === ananyaUser?.id);
  assert('Team builder has Ananya with Badminton profile', teamAnanya?.sport_profiles?.Badminton?.event_category === 'Doubles');

  // 12. Controller integration: adminController.getPlayersByRole
  const { getPlayersByRole } = await import('./server/controllers/adminController.js');
  let adminByRoleResponse = null;
  const adminReq = { query: { sport: 'Badminton', role: '', position: '' } };
  await getPlayersByRole(adminReq, { json(data) { adminByRoleResponse = data; return this; }, status() { return this; } });
  assert('adminController.getPlayersByRole succeeds', adminByRoleResponse && adminByRoleResponse.success === true);
  assert('Admin filter finds Badminton player', adminByRoleResponse?.players.some(p => p.id === ananyaUser?.id));

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

