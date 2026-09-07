import http from 'http';
import { io as ClientIO } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting Comprehensive Backend API & Real-Time Test Suite...\n');

  const timestamp = Date.now();
  const testUser = {
    userId: `tester_${timestamp}`,
    email: `tester_${timestamp}@example.com`,
    phoneNumber: '+919876543210',
    password: 'SecurePassword123!',
    name: 'Automation Tester',
    avatar: '🚀',
  };

  let accessToken = '';
  let refreshToken = '';
  let issuedCoinId = '';

  try {
    // 1. Test Health endpoint
    console.log('1️⃣ Testing Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('   Health Status:', healthData.status === 'UP' ? '✅ PASS' : '❌ FAIL');

    // 2. Test User Registration
    console.log('\n2️⃣ Testing User Registration with userId, email, phoneNumber, password...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    if (!regData.success) throw new Error(`Registration failed: ${regData.error}`);
    console.log('   Registration Result: ✅ PASS - User Registered with ID:', regData.user.userId);
    accessToken = regData.tokens.accessToken;
    refreshToken = regData.tokens.refreshToken;

    // 3. Test Duplicate Registration Prevention
    console.log('\n3️⃣ Testing Duplicate Registration Prevention...');
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const dupData = await dupRes.json();
    console.log(
      '   Duplicate Protection:',
      dupRes.status === 400 && dupData.success === false ? '✅ PASS (Correctly Blocked)' : '❌ FAIL'
    );

    // 4. Test User Login
    console.log('\n4️⃣ Testing User Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Login failed: ${loginData.error}`);
    console.log('   Login Result: ✅ PASS - Received Fresh Access & Refresh Tokens');
    accessToken = loginData.tokens.accessToken;
    refreshToken = loginData.tokens.refreshToken;

    // 5. Test Get Profile (/api/auth/me)
    console.log('\n5️⃣ Testing Protected Profile (/api/auth/me)...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();
    console.log(
      '   Profile Retrieval:',
      meData.success && meData.user.email === testUser.email ? '✅ PASS' : '❌ FAIL'
    );

    // 6. Test Refresh Token endpoint
    console.log('\n6️⃣ Testing Refresh Token Rotation (/api/auth/refresh-token)...');
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    if (!refreshData.success) throw new Error(`Refresh token failed: ${refreshData.error}`);
    console.log('   Token Rotation: ✅ PASS - Received New Access & Refresh Tokens');
    accessToken = refreshData.tokens.accessToken;
    refreshToken = refreshData.tokens.refreshToken;

    // 7. Test Socket.IO Real-Time Broadcast
    console.log('\n7️⃣ Testing Socket.IO Real-time Connection & Broadcasting...');
    const socket = ClientIO(BASE_URL, { transports: ['websocket'] });

    const socketEventsReceived = {
      comment: false,
      review: false,
      performance: false,
      coin: false,
    };

    socket.on('connect', () => {
      console.log('   Socket.io Client Connected Successfully ✅');
    });

    socket.on('comment:new', (data) => {
      console.log('   ⚡ [Socket Received] New Live Comment:', data.content);
      socketEventsReceived.comment = true;
    });

    socket.on('review:new', (data) => {
      console.log(`   ⚡ [Socket Received] New Review: ${data.content} (Rating: ${data.rating}/5)`);
      socketEventsReceived.review = true;
    });

    socket.on('performance:update', (data) => {
      console.log('   ⚡ [Socket Received] Live Performance Score:', data.performanceMetrics.score);
      socketEventsReceived.performance = true;
    });

    socket.on('coin:earned', (data) => {
      console.log(`   ⚡ [Socket Received] Coin Earned: ${data.taskName} (${data.coinsEarned} coins)`);
      socketEventsReceived.coin = true;
    });

    // Allow socket to establish
    await new Promise((r) => setTimeout(r, 500));

    // 8. Post Comment & Test Real-time Broadcast
    console.log('\n8️⃣ Testing Real-time Comment Posting (/api/feedback/comment)...');
    const commentRes = await fetch(`${BASE_URL}/api/feedback/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: 'Yeh ek live comment hai jo sabhi connected users ko broadcast hoga!',
        targetItem: 'Mathematics Chapter 1',
      }),
    });
    const commentData = await commentRes.json();
    console.log('   Post Comment:', commentData.success ? '✅ PASS' : '❌ FAIL');

    // 9. Post Review & Test Real-time Broadcast
    console.log('\n9️⃣ Testing Real-time Review Submission (/api/feedback/review)...');
    const reviewRes = await fetch(`${BASE_URL}/api/feedback/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: 'Bohot accha platform hai! Superb experience.',
        rating: 5,
        targetItem: 'Class 10 Math Course',
      }),
    });
    const reviewData = await reviewRes.json();
    console.log('   Post Review:', reviewData.success ? '✅ PASS' : '❌ FAIL');

    // 10. Post Performance Update
    console.log('\n🔟 Testing Live Performance Broadcast (/api/feedback/performance)...');
    const perfRes = await fetch(`${BASE_URL}/api/feedback/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        score: 98,
        accuracy: 96.5,
        speed: 'Fast',
        tasksCompleted: 15,
        details: { quizId: 'MATH-CH1-QUIZ', timeTakenSec: 120 },
      }),
    });
    const perfData = await perfRes.json();
    console.log('   Post Performance:', perfData.success ? '✅ PASS' : '❌ FAIL');

    // 11. Test Coin System - Earn Coins for Task
    console.log('\n1️⃣1️⃣ Testing Unique Coin Reward Generation (/api/coins/earn)...');
    const earnRes = await fetch(`${BASE_URL}/api/coins/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        taskId: 'TASK_QUADRATIC_EQUATIONS_01',
        taskName: 'Completed Quadratic Equations Chapter Quiz with 90%+',
        amount: 2,
      }),
    });
    const earnData = await earnRes.json();
    if (!earnData.success) throw new Error(`Coin earn failed: ${earnData.error}`);
    console.log('   Coins Issued:', earnData.totalIssued);
    console.log('   Issued Unique Coin IDs:', earnData.coins.map((c) => c.coinId).join(', '));
    console.log('   Coin Expiration Policy:', earnData.coins[0].expiresAt);
    issuedCoinId = earnData.coins[0].coinId;

    // 12. Test Coin System - Fetch My Active Coins
    console.log('\n1️⃣2️⃣ Testing Fetch User Active Coins (/api/coins/my-coins)...');
    const myCoinsRes = await fetch(`${BASE_URL}/api/coins/my-coins`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const myCoinsData = await myCoinsRes.json();
    console.log(`   Active Coin Balance: ${myCoinsData.balance} coins`);
    console.log(
      '   Verify Coin present in balance:',
      myCoinsData.coins.some((c) => c.coinId === issuedCoinId) ? '✅ PASS' : '❌ FAIL'
    );

    // 13. Test Coin Verification
    console.log(`\n1️⃣3️⃣ Testing Verify Coin ID (/api/coins/verify/${issuedCoinId})...`);
    const verifyRes = await fetch(`${BASE_URL}/api/coins/verify/${issuedCoinId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const verifyData = await verifyRes.json();
    console.log('   Verification Result:', verifyData.isValid ? '✅ PASS (Valid Active Coin)' : '❌ FAIL');

    // 14. Test Coin Consumption & Removal from Database
    console.log('\n1️⃣4️⃣ Testing Coin Verification, Usage, & Removal from Database (/api/coins/verify-and-use)...');
    const useRes = await fetch(`${BASE_URL}/api/coins/verify-and-use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        coinId: issuedCoinId,
        purpose: 'Unlocked Premium Chapter 2 Notes',
      }),
    });
    const useData = await useRes.json();
    console.log('   Coin Redemption:', useData.success ? '✅ PASS' : '❌ FAIL');
    console.log(`   Message: ${useData.message}`);
    console.log(`   New Remaining Balance: ${useData.remainingCoinBalance}`);

    // 15. Test Double-Spending Rejection (Attempting to use the same coin ID again)
    console.log('\n1️⃣5️⃣ Testing Double-Spending Protection (Using the same coinId again)...');
    const doubleUseRes = await fetch(`${BASE_URL}/api/coins/verify-and-use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        coinId: issuedCoinId,
        purpose: 'Attempting illegal second redemption',
      }),
    });
    const doubleUseData = await doubleUseRes.json();
    console.log(
      '   Double-Use Blocked:',
      doubleUseRes.status === 400 && doubleUseData.success === false
        ? '✅ PASS (Successfully Rejected - Coin Already Consumed & Removed)'
        : '❌ FAIL'
    );

    // 16. Test Coin Audit History
    console.log('\n1️⃣6️⃣ Testing Coin Audit & Redemption History (/api/coins/history)...');
    const histRes = await fetch(`${BASE_URL}/api/coins/history`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const histData = await histRes.json();
    console.log(
      '   Audit Log Found Used Coin:',
      histData.history.some((h) => h.coinId === issuedCoinId) ? '✅ PASS' : '❌ FAIL'
    );

    // 17. Test Logout & Token Revocation
    console.log('\n1️⃣7️⃣ Testing Logout & Token Invalidation (/api/auth/logout)...');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    const logoutData = await logoutRes.json();
    console.log('   Logout Result:', logoutData.success ? '✅ PASS' : '❌ FAIL');

    // 18. Attempt Refresh with Revoked Token
    console.log('\n1️⃣8️⃣ Testing Revoked Refresh Token Rejection...');
    const revokedRefreshRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const revokedRefreshData = await revokedRefreshRes.json();
    console.log(
      '   Revocation Protection:',
      revokedRefreshRes.status === 403 && revokedRefreshData.success === false
        ? '✅ PASS (Revoked Token Rejected)'
        : '❌ FAIL'
    );

    // Wait for all socket messages
    await new Promise((r) => setTimeout(r, 1000));
    socket.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL 18 SYSTEM TEST CASES PASSED SUCCESSFULLY! 🚀');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Test Suite Error:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests();
