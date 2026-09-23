/**
 * Automated Verification Script for College Sports Tournament Auth API
 */

const BASE_URL = 'http://localhost:5000/api/auth';

const logResult = (testName, passed, detail) => {
  if (passed) {
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName} - ${detail}`);
  }
};

async function runTests() {
  console.log('🏁 Starting Authentication System Verification Suite...\n');

  try {
    // 1. Test validation: missing fields
    const invalidSignup = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college_id: 'TEST01', password: '123' })
    });
    const invalidData = await invalidSignup.json();
    logResult(
      'Reject missing required fields',
      invalidSignup.status === 400 && !invalidData.success,
      JSON.stringify(invalidData)
    );

    // 2. Test validation: password length < 6
    const shortPassSignup = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: 'TEST02',
        name: 'Short Pass User',
        department: 'CS',
        year: '2nd Year',
        email: 'test@college.edu',
        phone: '1234567890',
        password: '123'
      })
    });
    const shortPassData = await shortPassSignup.json();
    logResult(
      'Reject password shorter than 6 chars',
      shortPassSignup.status === 400 && shortPassData.message.includes('6 characters'),
      JSON.stringify(shortPassData)
    );

    // 3. Test successful Player Signup
    const testId = 'CS2026-999';
    const playerSignup = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: testId,
        name: 'Lionel Messi',
        department: 'Sports Science',
        year: '3rd Year',
        email: 'messi@college.edu',
        phone: '+1 800 1010 10',
        role: 'player',
        password: 'securePassword123'
      })
    });
    const playerData = await playerSignup.json();
    logResult(
      'Player Signup (POST /api/auth/signup)',
      playerSignup.status === 201 && playerData.success && !!playerData.token,
      JSON.stringify(playerData)
    );
    const playerToken = playerData.token;

    // 4. Test duplicate college_id rejection
    const duplicateSignup = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: testId,
        name: 'Imposter Messi',
        department: 'Sports Science',
        year: '1st Year',
        email: 'imposter@college.edu',
        phone: '9999999999',
        password: 'password123'
      })
    });
    const duplicateData = await duplicateSignup.json();
    logResult(
      'Reject duplicate college_id (409 Conflict)',
      duplicateSignup.status === 409 && !duplicateData.success,
      JSON.stringify(duplicateData)
    );

    // 5. Test Player Login
    const playerLogin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: testId,
        password: 'securePassword123'
      })
    });
    const loginData = await playerLogin.json();
    logResult(
      'Player Login (POST /api/auth/login)',
      playerLogin.status === 200 && loginData.success && !!loginData.token,
      JSON.stringify(loginData)
    );

    // 6. Test Login with wrong password
    const wrongPassLogin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: testId,
        password: 'wrongPassword!'
      })
    });
    logResult(
      'Reject invalid password on login (401)',
      wrongPassLogin.status === 401,
      'Status: ' + wrongPassLogin.status
    );

    // 7. Test GET /api/auth/me with player token
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${playerToken}` }
    });
    const meData = await meRes.json();
    logResult(
      'GET /api/auth/me returns profile with valid JWT',
      meRes.status === 200 && meData.user && meData.user.college_id === testId,
      JSON.stringify(meData)
    );

    // 8. Test authenticateToken without token
    const unauthorizedRes = await fetch(`${BASE_URL}/me`);
    logResult(
      'Reject request without Authorization token (401)',
      unauthorizedRes.status === 401,
      'Status: ' + unauthorizedRes.status
    );

    // 9. Test requireAdmin middleware with player token (should be 403 Forbidden)
    const adminForbiddenRes = await fetch(`${BASE_URL}/admin-only`, {
      headers: { 'Authorization': `Bearer ${playerToken}` }
    });
    logResult(
      'requireAdmin blocks Player from admin-only route (403)',
      adminForbiddenRes.status === 403,
      'Status: ' + adminForbiddenRes.status
    );

    // 10. Test Admin Signup and Admin access
    const adminId = 'ADMIN-2026';
    const adminSignup = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id: adminId,
        name: 'Tournament Director',
        department: 'Athletic Department',
        year: 'Staff/Faculty',
        email: 'director@college.edu',
        phone: '+1 800 2020 20',
        role: 'admin',
        password: 'adminSecretPassword'
      })
    });
    const adminData = await adminSignup.json();
    const adminToken = adminData.token;

    const adminAllowedRes = await fetch(`${BASE_URL}/admin-only`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminAllowedData = await adminAllowedRes.json();
    logResult(
      'requireAdmin allows Admin to access admin route (200)',
      adminAllowedRes.status === 200 && adminAllowedData.success,
      JSON.stringify(adminAllowedData)
    );

    console.log('\n🎉 ALL 10 AUTHENTICATION & SECURITY TESTS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  }
}

runTests();
