const BASE_URL = 'http://localhost:5000';

async function runAuthTests() {
  console.log('====================================================');
  console.log('🛡️ RUNNING COMPREHENSIVE AUTHENTICATION & SECURITY TESTS');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Sayhan Super Admin Login (Valid Credentials)
  console.log('\n--- 1. Testing Sayhan Dedicated Admin Login ---');
  const adminRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'yellowreignacademy@gmail.com',
      password: 'Sayhan@2026'
    })
  });
  const adminData = await adminRes.json();
  assert(adminRes.status === 200, 'Sayhan successfully authenticated on dedicated admin portal');
  assert(adminData.user.role === 'ADMIN', 'Sayhan has verified ADMIN role');
  assert(adminData.redirectTo === 'admin_dashboard', 'Redirects Sayhan directly to admin_dashboard');
  const adminToken = adminData.token;

  // 2. Incorrect Admin Password
  console.log('\n--- 2. Testing Incorrect Admin Password ---');
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'yellowreignacademy@gmail.com',
      password: 'WrongPassword123!'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  assert(wrongPassRes.status === 401, 'Incorrect password correctly rejected with 401');
  assert(wrongPassData.error.includes('Invalid administrator credentials'), 'Returns explicit error message');

  // 3. Normal User Registration
  console.log('\n--- 3. Testing Normal User Registration ---');
  const uniqueEmail = `author_${Date.now()}@domain.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Elena Rostova',
      email: uniqueEmail,
      phone: '+91 9123456780',
      password: 'SecureAuthorPass!45'
    })
  });
  const regData = await registerRes.json();
  assert(registerRes.status === 201, 'Author registered successfully');
  assert(regData.user.role === 'USER', 'Author strictly assigned role USER (no privilege escalation)');
  assert(regData.redirectTo === 'user_dashboard', 'Redirects new author to user_dashboard');
  const userToken = regData.token;

  // 4. Normal User Login
  console.log('\n--- 4. Testing Normal User Login ---');
  const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'SecureAuthorPass!45'
    })
  });
  const userLoginData = await userLoginRes.json();
  assert(userLoginRes.status === 200, 'User logged in successfully with own credentials');
  assert(userLoginData.user.role === 'USER', 'Role is USER');
  assert(userLoginData.redirectTo === 'user_dashboard', 'Normal user redirected to personal user_dashboard');

  // 5. Normal User Attempting Admin Portal Login (Must be DENIED)
  console.log('\n--- 5. Testing Normal User Attempting Admin Portal Login ---');
  const breachAttemptRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'SecureAuthorPass!45'
    })
  });
  const breachData = await breachAttemptRes.json();
  assert(breachAttemptRes.status === 403, 'Normal user blocked from Admin Login with 403 Forbidden');
  assert(breachData.error.includes('Access Denied: This account is not registered with Super Admin authority'), 'Explicit denial message returned');

  // 6. Normal User Attempting Direct Admin API Access
  console.log('\n--- 6. Testing Normal User Attempting Admin API Access ---');
  const adminApiAttempt = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const adminApiAttemptData = await adminApiAttempt.json();
  assert(adminApiAttempt.status === 403, 'Normal user token blocked from /api/admin/stats with 403 Forbidden');
  assert(adminApiAttemptData.error.includes('Only Super Admin Sayhan has authorization'), 'Admin route protected');

  // 7. Sayhan Admin Dashboard Access
  console.log('\n--- 7. Testing Sayhan Admin Dashboard Access ---');
  const sayhanAccess = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const sayhanStats = await sayhanAccess.json();
  assert(sayhanAccess.status === 200, 'Sayhan successfully accesses admin stats API');
  assert(sayhanStats.users !== undefined, 'Stats payload received');

  // 8. Fix JSON Parsing Error: Unhandled API Route Returns Clean JSON
  console.log('\n--- 8. Testing API 404 Returns Valid JSON (Not HTML) ---');
  const notFoundRes = await fetch(`${BASE_URL}/api/unknown-endpoint`);
  const notFoundData = await notFoundRes.json();
  assert(notFoundRes.status === 404, 'Unknown API route returns 404');
  assert(notFoundData.error !== undefined, 'Returned pure JSON error, preventing SyntaxError in clients');

  // 9. Session Security
  console.log('\n--- 9. Testing Session & Token Validation ---');
  const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
  assert(unauthRes.status === 401, 'Accessing /api/auth/me without token returns 401');

  const invalidTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: 'Bearer fake_corrupt_jwt_token' }
  });
  assert(invalidTokenRes.status === 401, 'Corrupted token returns 401');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} AUTHENTICATION & SECURITY TESTS PASSED!`);
  console.log('====================================================\n');
}

runAuthTests().catch(err => {
  console.error('\n❌ AUTH TEST FAILED:', err);
  process.exit(1);
});

