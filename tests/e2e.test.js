import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E VERIFICATION SUITE');
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

  // 1. Health Check
  console.log('\n--- 1. Testing Health & Super Admin Config ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Server is online');
  assert(healthData.superAdmin === 'Sayhan', 'Super Admin is configured as Sayhan');
  assert(healthData.notificationEmail === 'yellowreignacademy@gmail.com', 'Admin email is yellowreignacademy@gmail.com');

  // 2. Super Admin Login
  console.log('\n--- 2. Testing Sayhan Super Admin Authentication ---');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'yellowreignacademy@gmail.com',
      password: 'Sayhan@2026'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, 'Sayhan successfully authenticated');
  assert(adminLoginData.user.role === 'ADMIN', 'Sayhan has ADMIN role');
  assert(adminLoginData.user.phone === '9544498843', 'Sayhan phone number is 9544498843');
  const adminToken = adminLoginData.token;

  // 3. Register New User & Email Notification Check
  console.log('\n--- 3. Testing User Registration & Admin Email Dispatch ---');
  const testEmail = `author_${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Zane Gallagher',
      email: testEmail,
      phone: '+91 9876543210',
      password: 'AuthorSecret123!'
    })
  });
  const registerData = await registerRes.json();
  assert(registerRes.status === 201, 'New author registration succeeded');
  assert(registerData.user.role === 'USER', 'Author is standard USER role');
  const authorToken = registerData.token;
  const authorId = registerData.user.id;

  // Verify email log entry for registration
  const emailLogsRes = await fetch(`${BASE_URL}/api/admin/email-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const emailLogs = await emailLogsRes.json();
  const regAlert = emailLogs.find(l => l.type === 'REGISTRATION' && l.recipient === 'yellowreignacademy@gmail.com');
  assert(regAlert !== undefined, 'Registration email alert successfully recorded for yellowreignacademy@gmail.com');
  assert(regAlert.subject.includes('Zane Gallagher'), 'Registration email subject contains registered user name');

  // 4. Regular User Cannot Access Admin Features
  console.log('\n--- 4. Testing Role-Based Security Restrictions ---');
  const unauthorizedRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${authorToken}` }
  });
  assert(unauthorizedRes.status === 403, 'Regular user receives 403 Forbidden on admin stats');

  // 5. Magazine Submission to User Private Vault
  console.log('\n--- 5. Testing Magazine Submission & Admin Submission Alert ---');
  const form = new FormData();
  form.append('title', 'Quantum Aesthetics & Digital Horizons');
  form.append('description', 'An avant-garde exploration of quantum typography and digital form.');
  form.append('categoryId', 'cat-tech');
  form.append('status', 'PENDING_REVIEW');

  // Dummy cover blob
  const dummyCoverBlob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="#000" width="300" height="400"/><text fill="#eab308" x="50" y="200">Quantum Cover</text></svg>'], { type: 'image/svg+xml' });
  form.append('coverImage', dummyCoverBlob, 'cover.svg');

  // Dummy page blobs
  const dummyPage1 = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="#111" width="300" height="400"/><text fill="#fff" x="50" y="200">Page 1</text></svg>'], { type: 'image/svg+xml' });
  const dummyPage2 = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="#111" width="300" height="400"/><text fill="#fff" x="50" y="200">Page 2</text></svg>'], { type: 'image/svg+xml' });
  form.append('pages', dummyPage1, 'page_1.svg');
  form.append('pages', dummyPage2, 'page_2.svg');

  const submitRes = await fetch(`${BASE_URL}/api/magazines/user/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authorToken}` },
    body: form
  });
  const submitData = await submitRes.json();
  if (submitRes.status !== 200) {
    console.error('Submit Failed with status:', submitRes.status, 'body:', submitData);
  }
  assert(submitRes.status === 200, 'Magazine submitted for review successfully');
  assert(submitData.status === 'PENDING_REVIEW', 'Magazine status is PENDING_REVIEW');
  const newMagazineId = submitData.magazineId;

  // Verify submission email log
  const updatedEmailLogs = await (await fetch(`${BASE_URL}/api/admin/email-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  })).json();
  const subAlert = updatedEmailLogs.find(l => l.type === 'SUBMISSION' && l.recipient === 'yellowreignacademy@gmail.com');
  assert(subAlert !== undefined, 'Submission email alert successfully recorded for yellowreignacademy@gmail.com');
  assert(subAlert.subject.includes('Quantum Aesthetics'), 'Submission email subject contains magazine title');

  // 6. Verify Content Privacy: Unapproved Magazine is INVISIBLE Publicly
  console.log('\n--- 6. Verifying Strict Privacy (Unpublished Content Inaccessible) ---');
  const publicListRes = await fetch(`${BASE_URL}/api/magazines/public`);
  const publicList = await publicListRes.json();
  const foundInPublic = publicList.magazines.find(m => m.id === newMagazineId);
  assert(foundInPublic === undefined, 'Pending magazine is NOT in public library listing');

  const privateFileRes = await fetch(`${BASE_URL}/api/files/magazine/${newMagazineId}/cover`);
  assert(privateFileRes.status === 403, 'Public visitor receives 403 Forbidden when attempting to access pending cover');

  // Author CAN access their own file
  const authorFileRes = await fetch(`${BASE_URL}/api/files/magazine/${newMagazineId}/cover?token=${authorToken}`);
  assert(authorFileRes.status === 200, 'Author can securely access their own private pending cover');

  // 7. Sayhan Reviews, Approves, and Publishes
  console.log('\n--- 7. Super Admin Sayhan Reviews & Publishes to Public Library ---');
  const reviewDetailRes = await fetch(`${BASE_URL}/api/admin/submissions/${newMagazineId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const reviewDetail = await reviewDetailRes.json();
  assert(reviewDetail.magazine.title === 'Quantum Aesthetics & Digital Horizons', 'Sayhan inspected correct submission');
  assert(reviewDetail.pages.length === 2, 'Sayhan inspected both pages');

  // Approve first
  const approveRes = await fetch(`${BASE_URL}/api/admin/submissions/${newMagazineId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ action: 'APPROVE', feedback: 'Masterpiece format. Approved by Sayhan.' })
  });
  assert(approveRes.status === 200, 'Submission approved by Sayhan');

  // Now Publish (Only Sayhan can publish)
  const publishRes = await fetch(`${BASE_URL}/api/admin/submissions/${newMagazineId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ action: 'PUBLISH' })
  });
  const publishData = await publishRes.json();
  assert(publishRes.status === 200, 'Magazine published to public library by Sayhan');
  assert(publishData.status === 'PUBLISHED', 'Status updated to PUBLISHED');
  assert(publishData.qrCode.startsWith('data:image/png;base64,'), 'Unique QR Code successfully generated');

  // 8. Public Library Access Verification
  console.log('\n--- 8. Verifying Public Reading Without Login & QR Accessibility ---');
  const updatedPublicRes = await fetch(`${BASE_URL}/api/magazines/public`);
  const updatedPublicData = await updatedPublicRes.json();
  const publishedMag = updatedPublicData.magazines.find(m => m.id === newMagazineId);
  assert(publishedMag !== undefined, 'Published magazine is now visible in the Public Library');
  assert(publishedMag.page_count === 2, 'Correct page count is visible publicly');

  // Read single published magazine publicly without any auth token
  const publicReaderRes = await fetch(`${BASE_URL}/api/magazines/public/${newMagazineId}`);
  const publicReaderData = await publicReaderRes.json();
  assert(publicReaderRes.status === 200, 'Public reader can open magazine without login');
  assert(publicReaderData.pages.length === 2, 'Public reader retrieves all pages in order');

  // Public cover and pages now accessible without auth
  const publicCoverRes = await fetch(`${BASE_URL}/api/files/magazine/${newMagazineId}/cover`);
  assert(publicCoverRes.status === 200, 'Public cover is now accessible to all readers without login');

  // 9. View Counter Increment
  const viewRes = await fetch(`${BASE_URL}/api/magazines/public/${newMagazineId}/view`, { method: 'POST' });
  assert(viewRes.status === 200, 'View counter incremented');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} E2E TESTS PASSED WITH 100% SUCCESS!`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
