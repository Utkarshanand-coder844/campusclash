/**
 * Comprehensive End-to-End Feature Verification Suite
 * Tests all backend and frontend-facing API capabilities.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ ${description} - ${details}`);
    failed++;
  }
}

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function run() {
  console.log(`\n========================================`);
  console.log(`🚀 STARTING FULL E2E PLATFORM AUDIT (${BASE_URL})`);
  console.log(`========================================\n`);

  const timestamp = Date.now();
  const playerACollegeId = `PLYR_A_${timestamp}`;
  const playerBCollegeId = `PLYR_B_${timestamp}`;
  const adminCollegeId = `ADM_${timestamp}`;
  const ADMIN_CODE = process.env.ADMIN_SIGNUP_CODE || '1234';

  let tokenA = null;
  let userA = null;
  let tokenB = null;
  let userB = null;
  let tokenAdmin = null;
  let userAdmin = null;
  let createdTeam = null;
  let createdMatch = null;
  let createdAnnouncement = null;

  // ----------------------------------------
  // 1. PUBLIC ENDPOINTS
  // ----------------------------------------
  console.log('--- 1. Public Endpoints ---');
  {
    const r = await req('/api/health');
    assert('Health Check returns status online', r.status === 200 && r.data.status === 'online', JSON.stringify(r.data));

    const m = await req('/api/matches');
    assert('Get Matches (public)', m.status === 200 && Array.isArray(m.data.matches), `Status: ${m.status}`);

    const l = await req('/api/leaderboard');
    assert('Get Leaderboard (public)', l.status === 200 && Array.isArray(l.data.leaderboard || l.data.standings || l.data), `Status: ${l.status} data: ${JSON.stringify(l.data).slice(0,120)}`);

    const b = await req('/api/brackets');
    assert('Get Brackets (public)', b.status === 200, `Status: ${b.status}`);

    const a = await req('/api/announcements');
    assert('Get Announcements (public feed)', a.status === 200 && Array.isArray(a.data.announcements || a.data), `Status: ${a.status}`);

    const s = await req('/api/sitemap.xml');
    assert('Get Dynamic XML Sitemap for SEO', s.status === 200 && typeof s.data === 'string' && s.data.includes('xml'), `Status: ${s.status}`);
  }

  // ----------------------------------------
  // 2. AUTHENTICATION & SECURITY
  // ----------------------------------------
  console.log('\n--- 2. Authentication & Authorization ---');
  {
    // Signup Player A
    const signupA = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: playerACollegeId,
        name: 'Player One',
        department: 'Computer Science',
        campus: 'Main Campus',
        year: '2nd Year',
        email: `player1_${timestamp}@college.edu`,
        phone: '9876543210',
        role: 'player',
        password: 'password123',
        sports: ['Football', 'Badminton']
      })
    });
    assert('Player A Signup successful', signupA.status === 201 && signupA.data.success && !!signupA.data.token, JSON.stringify(signupA.data));
    tokenA = signupA.data?.token;
    userA = signupA.data?.user;

    // Reject duplicate signup
    const dupSignup = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: playerACollegeId,
        name: 'Player Imposter',
        department: 'CS',
        campus: 'Main Campus',
        year: '1st Year',
        email: `imposter_${timestamp}@college.edu`,
        phone: '1111111111',
        role: 'player',
        password: 'password123',
        sports: ['Football']
      })
    });
    assert('Reject duplicate College ID (409 Conflict)', dupSignup.status === 409, `Status: ${dupSignup.status}`);

    // Signup Player B
    const signupB = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: playerBCollegeId,
        name: 'Player Two',
        department: 'Electronics',
        campus: 'Main Campus',
        year: '3rd Year',
        email: `player2_${timestamp}@college.edu`,
        phone: '9876543211',
        role: 'player',
        password: 'password123',
        sports: ['Football', 'Cricket']
      })
    });
    assert('Player B Signup successful', signupB.status === 201 && signupB.data.success && !!signupB.data.token, JSON.stringify(signupB.data));
    tokenB = signupB.data?.token;
    userB = signupB.data?.user;

    // Reject Admin Signup with invalid code
    const invalidAdmin = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: `FAKE_ADM_${timestamp}`,
        name: 'Fake Admin',
        department: 'Admin',
        campus: 'Main Campus',
        year: 'Staff',
        email: `fake_${timestamp}@college.edu`,
        phone: '9876543212',
        role: 'admin',
        admin_code: 'WRONG_CODE_123',
        password: 'password123',
        sports: ['Football']
      })
    });
    assert('Reject Admin Signup without valid secret code (403)', invalidAdmin.status === 403, `Status: ${invalidAdmin.status}`);

    // Signup Admin with valid code
    const signupAdmin = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: adminCollegeId,
        name: 'Sports Director',
        department: 'Athletics Dept',
        campus: 'Main Campus',
        year: 'Faculty',
        email: `admin_${timestamp}@college.edu`,
        phone: '9876543213',
        role: 'admin',
        admin_code: ADMIN_CODE,
        password: 'password123',
        sports: ['Football']
      })
    });
    assert('Admin Signup with valid secret code', signupAdmin.status === 201 && signupAdmin.data.user?.role === 'admin', JSON.stringify(signupAdmin.data));
    tokenAdmin = signupAdmin.data?.token;
    userAdmin = signupAdmin.data?.user;

    // Login Player A
    const loginA = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college_id: playerACollegeId, password: 'password123' })
    });
    assert('Player Login with credentials', loginA.status === 200 && loginA.data.success, JSON.stringify(loginA.data));

    // Password reset request
    const pwReset = await req('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `player1_${timestamp}@college.edu` })
    });
    assert('Password reset request accepted', pwReset.status === 200 && pwReset.data.success, JSON.stringify(pwReset.data));

    // Test header variations on /api/auth/me
    const meStd = await req('/api/auth/me', { headers: { 'Authorization': `Bearer ${tokenA}` } });
    assert('Auth: Standard Authorization header', meStd.status === 200 && meStd.data.user?.college_id === playerACollegeId, `Status: ${meStd.status}`);

    const meProxy = await req('/api/auth/me', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Auth: x-authorization proxy fallback header', meProxy.status === 200 && meProxy.data.user?.college_id === playerACollegeId, `Status: ${meProxy.status}`);

    const meAccess = await req('/api/auth/me', { headers: { 'x-access-token': tokenA } });
    assert('Auth: x-access-token proxy fallback header', meAccess.status === 200 && meAccess.data.user?.college_id === playerACollegeId, `Status: ${meAccess.status}`);

    // Role-based access control
    const playerOnAdmin = await req('/api/auth/admin-only', { headers: { 'Authorization': `Bearer ${tokenA}` } });
    assert('requireAdmin blocks Player from admin endpoint (403 Forbidden)', playerOnAdmin.status === 403, `Status: ${playerOnAdmin.status}`);

    const adminOnAdmin = await req('/api/auth/admin-only', { headers: { 'Authorization': `Bearer ${tokenAdmin}` } });
    assert('requireAdmin allows Admin to access admin endpoint (200 OK)', adminOnAdmin.status === 200, `Status: ${adminOnAdmin.status}`);
  }

  // ----------------------------------------
  // 3. TEAM & ROSTER MANAGEMENT
  // ----------------------------------------
  console.log('\n--- 3. Teams & Roster Management ---');
  {
    // Initially player A has no team
    const initTeam = await req('/api/teams/mine', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Player initially has no team', initTeam.status === 200 && initTeam.data.team === null, JSON.stringify(initTeam.data));

    // Get registered players list
    const playerList = await req('/api/teams/players', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Get registered players directory', playerList.status === 200 && Array.isArray(playerList.data.players) && playerList.data.players.length >= 2, `Players: ${playerList.data.players?.length}`);

    // Create Team
    const createTeamRes = await req('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: `Cyber Strikers ${timestamp}`,
        sport: 'Football',
        members: [
          { member_user_id: userA.id, member_name: userA.name, position: 'Captain & Forward' }
        ]
      })
    });
    assert('Create tournament team', createTeamRes.status === 201 && createTeamRes.data.success && !!createTeamRes.data.team, JSON.stringify(createTeamRes.data));
    createdTeam = createTeamRes.data?.team;

    // Verify Player A now has a team in /api/teams/mine
    const verifyTeam = await req('/api/teams/mine', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Fetch user team (/api/teams/mine)', verifyTeam.status === 200 && verifyTeam.data.team?.id === createdTeam?.id, JSON.stringify(verifyTeam.data));

    // Send Team Invite from Team A to Player B
    if (createdTeam && userB) {
      const inviteRes = await req(`/api/teams/${createdTeam.id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({ invited_user_id: userB.id })
      });
      assert('Send team invite to player', inviteRes.status === 201 && inviteRes.data.success, JSON.stringify(inviteRes.data));

      // Player B checks invites
      const bInvites = await req('/api/teams/invites/mine', { headers: { 'x-authorization': `Bearer ${tokenB}` } });
      assert('Invited player receives invite in /api/teams/invites/mine', bInvites.status === 200 && Array.isArray(bInvites.data.invites) && bInvites.data.invites.some(i => i.team_id === createdTeam.id), JSON.stringify(bInvites.data));

      const pendingInvite = bInvites.data?.invites?.find(i => i.team_id === createdTeam.id && i.status === 'pending');
      if (pendingInvite) {
        // Player B accepts invite
        const acceptRes = await req(`/api/teams/invites/${pendingInvite.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-authorization': `Bearer ${tokenB}`
          },
          body: JSON.stringify({ status: 'accepted' })
        });
        assert('Player accepts team invitation', acceptRes.status === 200 && acceptRes.data.success, JSON.stringify(acceptRes.data));
      }
    }
  }

  // ----------------------------------------
  // 4. SPORTS & PROFILES
  // ----------------------------------------
  console.log('\n--- 4. Sports & Role Attributes ---');
  {
    // Update player registered sports
    const updateSports = await req('/api/player-sports/mine', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ sports: ['Football', 'Badminton', 'Chess'] })
    });
    assert('Update registered sports list', updateSports.status === 200 && updateSports.data.success, JSON.stringify(updateSports.data));

    // Batch update sport profiles
    const updateProfiles = await req('/api/player-sports/profiles/batch', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        profiles: {
          Football: { position: 'Forward', preferred_foot: 'Right-footed' },
          Badminton: { playing_style: 'Attacking' }
        }
      })
    });
    assert('Batch save sport role attributes', updateProfiles.status === 200 && updateProfiles.data.success, JSON.stringify(updateProfiles.data));

    // Assign Sport Admin role (Admin action)
    const assignAdmin = await req('/api/sports-admins/mine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ sport: 'Football' })
    });
    assert('Assign Sport Admin to specific sport', assignAdmin.status === 201 || assignAdmin.status === 200, JSON.stringify(assignAdmin.data));

    // Fetch public sports admins
    const getSportsAdmins = await req('/api/sports-admins', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Fetch sports administrators list', getSportsAdmins.status === 200 && Array.isArray(getSportsAdmins.data.admins || getSportsAdmins.data), `Status: ${getSportsAdmins.status}`);
  }

  // ----------------------------------------
  // 5. DIRECT MESSAGING (CHAT)
  // ----------------------------------------
  console.log('\n--- 5. Direct Messaging (Chat) ---');
  {
    // Fetch available players for chat
    const chatPlayers = await req('/api/chat/players', { headers: { 'x-authorization': `Bearer ${tokenA}` } });
    assert('Get chat player list', chatPlayers.status === 200 && Array.isArray(chatPlayers.data.players), `Count: ${chatPlayers.data.players?.length}`);

    // Player A sends message to Player B
    if (userB) {
      const sendMsg = await req(`/api/chat/${userB.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({ body: 'Hey teammate, ready for our match?' })
      });
      assert('Send direct message from Player A to Player B', sendMsg.status === 201 && sendMsg.data.success && !!sendMsg.data.message, JSON.stringify(sendMsg.data));

      // Player B reads messages
      const getMsgs = await req(`/api/chat/${userA.id}`, { headers: { 'x-authorization': `Bearer ${tokenB}` } });
      assert('Player B receives messages from Player A', getMsgs.status === 200 && Array.isArray(getMsgs.data.messages) && getMsgs.data.messages.length > 0, `Count: ${getMsgs.data.messages?.length}`);

      // Unread count
      const unread = await req('/api/chat/unread/count', { headers: { 'x-authorization': `Bearer ${tokenB}` } });
      assert('Get unread message count', unread.status === 200 && typeof unread.data.count === 'number', `Unread: ${unread.data.count}`);
    }
  }

  // ----------------------------------------
  // 6. NOTIFICATIONS
  // ----------------------------------------
  console.log('\n--- 6. Notifications ---');
  {
    const notifs = await req('/api/notifications', { headers: { 'x-authorization': `Bearer ${tokenB}` } });
    assert('Fetch user notifications', notifs.status === 200 && Array.isArray(notifs.data.notifications), `Count: ${notifs.data.notifications?.length}`);

    const markAll = await req('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'x-authorization': `Bearer ${tokenB}` }
    });
    assert('Mark all notifications as read', markAll.status === 200 && markAll.data.success, JSON.stringify(markAll.data));
  }

  // ----------------------------------------
  // 7. ADMIN CONTROLS (FIXTURES, SCORES, ANNOUNCEMENTS)
  // ----------------------------------------
  console.log('\n--- 7. Admin Controls & Live Matches ---');
  {
    // Create second team for match testing
    const createTeamB = await req('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        name: `Spartan Warriors ${timestamp}`,
        sport: 'Football',
        members: [
          { member_user_id: userB.id, member_name: userB.name, position: 'Midfielder' }
        ]
      })
    });
    const teamB = createTeamB.data?.team;

    if (createdTeam && teamB) {
      // Admin creates a match fixture
      const createMatch = await req('/api/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorization': `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify({
          name: `${createdTeam.name} vs ${teamB.name}`,
          sport: 'Football',
          team_a_id: createdTeam.id,
          team_b_id: teamB.id,
          match_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'upcoming'
        })
      });
      assert('Admin creates match fixture', createMatch.status === 201 && createMatch.data.success, JSON.stringify(createMatch.data));
      createdMatch = createMatch.data?.match;

      if (createdMatch) {
        // Admin updates status to live
        const liveStatus = await req(`/api/admin/matches/${createdMatch.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-authorization': `Bearer ${tokenAdmin}`
          },
          body: JSON.stringify({ status: 'live' })
        });
        assert('Admin updates match status to live', liveStatus.status === 200 && liveStatus.data.success, JSON.stringify(liveStatus.data));

        // Admin records score for team A
        const scoreRes = await req('/api/admin/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-authorization': `Bearer ${tokenAdmin}`
          },
          body: JSON.stringify({
            match_id: createdMatch.id,
            team_id: createdTeam.id,
            points: 2
          })
        });
        assert('Admin records live score points', scoreRes.status === 200 && scoreRes.data.success, JSON.stringify(scoreRes.data));
      }
    }

    // Set Registration Deadlines
    const deadline = await req('/api/admin/registration-deadlines', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        sport: 'Football',
        opens_at: new Date(Date.now() - 86400000).toISOString(),
        closes_at: new Date(Date.now() + 86400000 * 7).toISOString()
      })
    });
    assert('Admin sets sport registration window', deadline.status === 200 && deadline.data.success, JSON.stringify(deadline.data));

    // Post Public Announcement
    const postNotice = await req('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        title: `Tournament Opening Ceremony ${timestamp}`,
        message: 'All athletes must report to the Main Ground by 9:00 AM.',
        category: 'tournament',
        campus: 'all',
        is_pinned: true,
        attachments: []
      })
    });
    assert('Admin posts tournament announcement', postNotice.status === 201 && postNotice.data.success, JSON.stringify(postNotice.data));
    createdAnnouncement = postNotice.data?.announcement;

    // View audit log
    const audit = await req('/api/admin/audit-log?limit=5', {
      headers: { 'x-authorization': `Bearer ${tokenAdmin}` }
    });
    assert('Admin views system audit log', audit.status === 200 && Array.isArray(audit.data.entries || audit.data.audit || audit.data), `Status: ${audit.status} data: ${JSON.stringify(audit.data).slice(0,120)}`);
  }

  // ----------------------------------------
  // SUMMARY
  // ----------------------------------------
  console.log(`\n========================================`);
  console.log(`🏁 E2E VERIFICATION COMPLETE`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
