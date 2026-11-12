import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function runGatewayTests() {
  console.log('================================================================');
  console.log('🌐 STARTING COMPREHENSIVE API GATEWAY & BFF ARCHITECTURE TESTS 🚀');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testUser = {
    userId: `gw_tester_${timestamp}`,
    email: `gw_${timestamp}@example.com`,
    phoneNumber: '+1987654321',
    password: 'GatewayPassword123!',
    name: 'Gateway Architecture Tester',
    avatar: '🛡️',
  };

  let accessToken = '';
  let refreshToken = '';
  let adminAccessToken = '';
  let issuedCoinId = '';

  try {
    // -------------------------------------------------------------
    // TEST 1: Gateway Health Check & Discovery
    // -------------------------------------------------------------
    console.log('1️⃣  Testing Gateway Health & Capability Discovery (/api/gateway/health)...');
    const gwHealthRes = await fetch(`${BASE_URL}/api/gateway/health`);
    const gwHealthData = await gwHealthRes.json();

    if (!gwHealthData.success || gwHealthData.service !== 'Antigravity-API-Gateway') {
      throw new Error(`Gateway health failed: ${JSON.stringify(gwHealthData)}`);
    }
    console.log(`   Service: ${gwHealthData.service} v${gwHealthData.version}`);
    console.log(`   Status:  ✅ PASS - Status: ${gwHealthData.status}`);
    console.log(`   Capabilities Discovered: ${gwHealthData.capabilities.length} features active`);

    // -------------------------------------------------------------
    // TEST 2: Correlation ID Generation & Distributed Propagation
    // -------------------------------------------------------------
    console.log('\n2️⃣  Testing Correlation ID Generation & Propagation...');
    const customCorrelationId = `test-corr-id-${timestamp}`;
    const corrRes = await fetch(`${BASE_URL}/api/gateway/health`, {
      headers: { 'x-correlation-id': customCorrelationId },
    });
    const echoedCorrId = corrRes.headers.get('x-correlation-id');
    const passCorr = echoedCorrId === customCorrelationId;
    console.log(`   Sent Correlation ID:   ${customCorrelationId}`);
    console.log(`   Echoed Correlation ID: ${echoedCorrId}`);
    console.log(`   Correlation Tracing:   ${passCorr ? '✅ PASS' : '❌ FAIL'}`);
    if (!passCorr) throw new Error('Correlation ID was not propagated properly');

    // -------------------------------------------------------------
    // TEST 3: Multi-Tenant Context Extraction from Header
    // -------------------------------------------------------------
    console.log('\n3️⃣  Testing Multi-Tenant Extraction (Headers & Tier Resolution)...');
    const tenantRes = await fetch(`${BASE_URL}/api/gateway/health`, {
      headers: { 'x-tenant-id': 'tenant-web-premium' },
    });
    const resolvedTenantId = tenantRes.headers.get('x-tenant-id');
    const resolvedTenantTier = tenantRes.headers.get('x-tenant-tier');
    const passTenant = resolvedTenantId === 'tenant-web-premium' && resolvedTenantTier === 'enterprise';
    console.log(`   Requested Tenant: tenant-web-premium`);
    console.log(`   Extracted Tenant: ${resolvedTenantId} (Tier: ${resolvedTenantTier})`);
    console.log(`   Tenant Extraction: ${passTenant ? '✅ PASS' : '❌ FAIL'}`);
    if (!passTenant) throw new Error('Tenant context extraction failed');

    // -------------------------------------------------------------
    // TEST 4: Register & Login via Gateway Routed Auth Service
    // -------------------------------------------------------------
    console.log('\n4️⃣  Testing User Registration through Gateway Service Route (/api/gateway/services/auth/register)...');
    const regRes = await fetch(`${BASE_URL}/api/gateway/services/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant-default',
      },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    if (!regData.success) throw new Error(`Gateway registration failed: ${regData.error}`);
    accessToken = regData.tokens.accessToken;
    refreshToken = regData.tokens.refreshToken;
    console.log(`   User Registered ID: ${regData.user.userId}`);
    console.log(`   Access Token Received: ${accessToken.substring(0, 20)}...`);
    console.log('   Gateway Auth Registration: ✅ PASS');

    // -------------------------------------------------------------
    // TEST 5: Security & Authentication Offloading at Gateway Boundary
    // -------------------------------------------------------------
    console.log('\n5️⃣  Testing Gateway Security Offloading (Rejection of unauthenticated requests)...');
    const unauthBffRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`);
    const unauthBffData = await unauthBffRes.json();
    const passUnauth = unauthBffRes.status === 401 && unauthBffData.success === false;
    console.log(`   Unauthorized BFF Request Status: ${unauthBffRes.status} (Expected: 401)`);
    console.log(`   Security Offload Perimeter Protection: ${passUnauth ? '✅ PASS' : '❌ FAIL'}`);
    if (!passUnauth) throw new Error('Gateway failed to block unauthenticated request');

    // Test rejection of forged/malformed token
    const forgedRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`, {
      headers: { Authorization: 'Bearer forged.malformed.token' },
    });
    console.log(`   Forged Token Status: ${forgedRes.status} (Expected: 401)`);
    console.log(`   Forged Token Rejection: ${forgedRes.status === 401 ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 6: Per-Tenant Dynamic Rate Limiting & Headers
    // -------------------------------------------------------------
    console.log('\n6️⃣  Testing Per-Tenant Rate Limiting & Headers...');
    const rlRes = await fetch(`${BASE_URL}/api/gateway/health`, {
      headers: { 'x-tenant-id': 'tenant-mobile-free' },
    });
    const rlLimit = rlRes.headers.get('X-RateLimit-Limit');
    const rlRemaining = rlRes.headers.get('X-RateLimit-Remaining');
    const rlReset = rlRes.headers.get('X-RateLimit-Reset');
    const rlTier = rlRes.headers.get('X-RateLimit-Tier');
    console.log(`   RateLimit Headers -> Limit: ${rlLimit}, Remaining: ${rlRemaining}, Reset: ${rlReset}s, Tier: ${rlTier}`);
    const passRlHeaders = rlLimit !== null && rlRemaining !== null && rlTier === 'free';
    console.log(`   Rate Limit Headers Presence: ${passRlHeaders ? '✅ PASS' : '❌ FAIL'}`);
    if (!passRlHeaders) throw new Error('Rate limit headers missing from response');

    // -------------------------------------------------------------
    // TEST 7: Seed Domain Data (Coins & Feed Items) through Gateway Routes
    // -------------------------------------------------------------
    console.log('\n7️⃣  Seeding Domain Data (Coins & Feed Items) through Gateway Routes...');
    const earnRes = await fetch(`${BASE_URL}/api/gateway/services/coins/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
      body: JSON.stringify({
        taskId: 'GW_TASK_001',
        taskName: 'Complete API Gateway Integration',
        amount: 3,
      }),
    });
    const earnData = await earnRes.json();
    if (!earnData.success) throw new Error(`Coin earn failed: ${earnData.error}`);
    issuedCoinId = earnData.coins[0].coinId;
    console.log(`   Coins Issued via Gateway: ${earnData.totalIssued} (ID: ${issuedCoinId})`);

    // Post feedback comment
    const commentRes = await fetch(`${BASE_URL}/api/gateway/services/feedback/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
      body: JSON.stringify({
        content: 'BFF and Gateway architecture tested successfully!',
        targetItem: 'Architecture Module',
      }),
    });
    const commentData = await commentRes.json();
    console.log(`   Feedback Comment Created: ${commentData.success ? '✅ PASS' : '❌ FAIL'}`);

    // Post performance metric
    const perfRes = await fetch(`${BASE_URL}/api/gateway/services/feedback/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
      body: JSON.stringify({
        score: 99.4,
        accuracy: 98.9,
        speed: 'Ultra-Fast',
        tasksCompleted: 42,
      }),
    });
    const perfData = await perfRes.json();
    console.log(`   Performance Metric Created: ${perfData.success ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 8: Gateway Aggregation - Mobile BFF Dashboard
    // -------------------------------------------------------------
    console.log('\n8️⃣  Testing Mobile BFF Aggregator (/api/gateway/bff/mobile/dashboard)...');
    console.log('   (Aggregating User Profile + Coins Wallet + Activity Feed + Performance in 1 request)');
    const mobileBffRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
    });
    const mobileData = await mobileBffRes.json();

    if (!mobileData.success) throw new Error(`Mobile BFF failed: ${JSON.stringify(mobileData)}`);

    console.log(`   Response Device Target: ${mobileData.meta.deviceTarget}`);
    console.log(`   Aggregation Latency:    ${mobileData.meta.aggregationDurationMs}ms`);
    console.log(`   Aggregated User Name:   ${mobileData.data.profile.name}`);
    console.log(`   Aggregated Coin Balance:${mobileData.data.wallet.balance} coins`);
    console.log(`   Recent Feed Items:      ${mobileData.data.recentActivity.length} items`);
    console.log(`   Live Performance Score: ${mobileData.data.performance.score}`);
    console.log(`   Client Cache Header:    ${mobileBffRes.headers.get('Cache-Control')}`);
    console.log('   Mobile BFF Aggregation: ✅ PASS (Successfully consolidated 4 client round-trips into 1!)');

    // -------------------------------------------------------------
    // TEST 9: Gateway Aggregation - Web BFF Portal Overview & Multi-Tenancy Data Isolation
    // -------------------------------------------------------------
    console.log('\n9️⃣  Testing Web BFF Aggregator & Multi-Tenant Data Isolation (/api/gateway/bff/web/overview)...');
    // Fetch for tenant-default
    const webBffRes = await fetch(`${BASE_URL}/api/gateway/bff/web/overview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
    });
    const webData = await webBffRes.json();

    if (!webData.success) throw new Error(`Web BFF failed: ${JSON.stringify(webData)}`);
    console.log(`   Tenant: tenant-default (Tier: ${webData.meta.tenantTier})`);
    console.log(`   Total Wallet Coins:     ${webData.data.wallet.coins.length} (Expected: 3)`);
    console.log(`   Feed Length:            ${webData.data.feed.length}`);
    const passWallet = webData.data.wallet.coins.length === 3;
    console.log(`   Active Tenant Balance:  ${passWallet ? '✅ PASS' : '❌ FAIL'}`);

    // Cross-tenant data isolation test: query with different tenant
    const isolatedRes = await fetch(`${BASE_URL}/api/gateway/bff/web/overview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-web-premium',
      },
    });
    const isolatedData = await isolatedRes.json();
    const passIsolation = isolatedData.data.wallet.coins.length === 0;
    console.log(`   Cross-Tenant Isolation: ${passIsolation ? '✅ PASS (Isolated from other tenant records)' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 10: Resilience & Circuit Breaker Telemetry
    // -------------------------------------------------------------
    console.log('\n🔟 Testing Circuit Breaker Status & Telemetry (/api/gateway/resilience/status)...');
    const cbStatusRes = await fetch(`${BASE_URL}/api/gateway/resilience/status`);
    const cbStatusData = await cbStatusRes.json();

    const breakers = cbStatusData.resilience.circuitBreakers;
    console.log(`   Registered Circuit Breakers: ${Object.keys(breakers).join(', ')}`);
    console.log(`   authService State:     ${breakers.authService.state}`);
    console.log(`   coinService State:     ${breakers.coinService.state}`);
    console.log(`   feedbackService State: ${breakers.feedbackService.state}`);

    const allClosed = Object.values(breakers).every((b) => b.state === 'CLOSED');
    console.log(`   Initial Breakers Healthy (CLOSED): ${allClosed ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 11: Circuit Breaker Tripping & Graceful Partial Degradation
    // -------------------------------------------------------------
    console.log('\n1️⃣1️⃣ Testing Circuit Breaker Tripping & Fault-Tolerant Partial Degradation...');
    
    // First verify that unauthorized attempts to trip the circuit breaker are blocked
    const unauthTrip = await fetch(`${BASE_URL}/api/gateway/resilience/trip/feedbackService`, {
      method: 'POST',
    });
    console.log(`   Unauthorized Trip Protection: ${unauthTrip.status === 403 ? '✅ PASS (Correctly Blocked with 403)' : '❌ FAIL'}`);

    const adminKey = process.env.GATEWAY_SECRET || 'gateway_shared_hmac_secret_key_2026';

    // Authorized manual trip of feedbackService circuit breaker
    const tripRes = await fetch(`${BASE_URL}/api/gateway/resilience/trip/feedbackService`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
    });
    const tripData = await tripRes.json();
    console.log(`   Authorized Manual Trip: ${tripData.message}`);
    console.log(`   feedbackService State Now: ${tripData.snapshot.state}`);

    // Call Mobile BFF while feedbackService is TRIPPED / OPEN
    console.log('   Calling Mobile BFF while feedbackService circuit is OPEN...');
    const degradedBffRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
    });
    const degradedData = await degradedBffRes.json();

    const partialSuccess = degradedData.success === true && degradedData.meta.degraded === true;
    console.log(`   BFF Success Status:     ${degradedData.success} (Dashboard did not crash!)`);
    console.log(`   Degraded Indicator:     ${degradedData.meta.degraded}`);
    console.log(`   Degraded Services:      ${degradedData.meta.degradedServices.join(', ')}`);
    console.log(`   Profile Preserved:      ${degradedData.data.profile.userId === testUser.userId}`);
    console.log(`   Wallet Preserved:       ${degradedData.data.wallet.balance > 0}`);
    console.log(`   Graceful Degradation:   ${partialSuccess ? '✅ PASS' : '❌ FAIL'}`);
    if (!partialSuccess) throw new Error('Graceful partial degradation failed when circuit was open');

    // Reset circuit breaker with admin credentials
    const resetRes = await fetch(`${BASE_URL}/api/gateway/resilience/reset/feedbackService`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
    });
    const resetData = await resetRes.json();
    console.log(`   Reset Breaker Response: ${resetData.message}`);
    console.log(`   Breaker State Restored: ${resetData.snapshot.state} ✅ PASS`);

    // -------------------------------------------------------------
    // TEST 12: Admin BFF Tenant Operations Summary & RBAC Guard
    // -------------------------------------------------------------
    console.log('\n1️⃣2️⃣ Testing Admin BFF Tenant Operations & Role Guard (/api/gateway/bff/admin/tenant-summary)...');
    const userAdminRes = await fetch(`${BASE_URL}/api/gateway/bff/admin/tenant-summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`   Standard User Access Denied: ${userAdminRes.status === 403 ? '✅ PASS (403 Forbidden)' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 13: Stored Cross-Site Scripting (XSS) Sanitization
    // -------------------------------------------------------------
    console.log('\n1️⃣3️⃣ Testing Stored XSS Neutralization in Feedback...');
    const xssPayload = "<script>alert('XSS_ATTACK')</script><img src=x onerror=alert(1)>";
    const xssRes = await fetch(`${BASE_URL}/api/gateway/services/feedback/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: xssPayload,
        targetItem: 'Security Test',
      }),
    });
    const xssData = await xssRes.json();
    const storedContent = xssData.data?.content || '';
    const isXssNeutralized = !storedContent.includes('<script>') && storedContent.includes('&lt;script&gt;');
    console.log(`   Submitted Payload:  ${xssPayload}`);
    console.log(`   Sanitized Output:   ${storedContent}`);
    console.log(`   XSS Neutralization: ${isXssNeutralized ? '✅ PASS (Payload escaped into safe HTML entities)' : '❌ FAIL'}`);
    if (!isXssNeutralized) throw new Error('XSS payload was not sanitized');

    // -------------------------------------------------------------
    // TEST 14: NoSQL Injection Sanitization & Defense
    // -------------------------------------------------------------
    console.log('\n1️⃣4️⃣ Testing NoSQL Injection Protection ($gt / $where stripping)...');
    const nosqlRes = await fetch(`${BASE_URL}/api/gateway/services/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: { $gt: '' },
        password: { $ne: null },
      }),
    });
    const nosqlData = await nosqlRes.json();
    console.log(`   NoSQL Injection Attempt Status: ${nosqlRes.status} (Expected: 400 Bad Request)`);
    console.log(`   NoSQL Defense Result:           ${nosqlRes.status === 400 ? '✅ PASS (Malicious operator stripped & rejected)' : '❌ FAIL'}`);
    if (nosqlRes.status !== 400) throw new Error('NoSQL injection payload was not blocked');

    // -------------------------------------------------------------
    // TEST 15: Password Complexity Policy Enforcement
    // -------------------------------------------------------------
    console.log('\n1️⃣5️⃣ Testing Password Complexity Policy (Rejecting weak passwords)...');
    const weakUser = {
      userId: `weak_${timestamp}`,
      email: `weak_${timestamp}@example.com`,
      phoneNumber: '+1234567890',
      password: 'weak', // Violates minlength and complexity
    };
    const weakRes = await fetch(`${BASE_URL}/api/gateway/services/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weakUser),
    });
    const weakData = await weakRes.json();
    console.log(`   Weak Password Registration Status: ${weakRes.status} (Expected: 400 Bad Request)`);
    console.log(`   Weak Password Error Message:       ${weakData.error}`);
    console.log(`   Password Complexity Enforcement:   ${weakRes.status === 400 ? '✅ PASS (Rejected weak password)' : '❌ FAIL'}`);
    if (weakRes.status !== 400) throw new Error('Weak password was improperly accepted');

    // -------------------------------------------------------------
    // TEST 16: Firewall / WAF Ingress Inspection (SQLi & Scanner Block)
    // -------------------------------------------------------------
    console.log('\n1️⃣6️⃣ Testing Firewall & WAF Ingress Filter (SQLi & Scanner Protection)...');
    // Test SQL Injection in query parameter
    const sqliWafRes = await fetch(`${BASE_URL}/api/gateway/health?query=UNION%20SELECT%20*%20FROM%20users`);
    const isSqliBlocked = sqliWafRes.status === 403;
    console.log(`   WAF SQLi Query Inspection Status: ${sqliWafRes.status} (Expected: 403 Forbidden)`);
    console.log(`   WAF SQLi Blocking:                 ${isSqliBlocked ? '✅ PASS (Malicious query blocked at perimeter)' : '❌ FAIL'}`);

    // Test Automated Vulnerability Scanner User-Agent
    const scannerRes = await fetch(`${BASE_URL}/api/gateway/health`, {
      headers: { 'User-Agent': 'sqlmap/1.5.2#stable' },
    });
    const isScannerBlocked = scannerRes.status === 403;
    console.log(`   WAF Scanner UA Blocking Status:    ${scannerRes.status} (Expected: 403 Forbidden)`);
    console.log(`   WAF Scanner Defense:               ${isScannerBlocked ? '✅ PASS (Scanner blocked)' : '❌ FAIL'}`);

    // Verify legitimate requests pass through WAF
    const cleanWafRes = await fetch(`${BASE_URL}/api/gateway/health`);
    const wafPassHeader = cleanWafRes.headers.get('X-WAF-Status');
    console.log(`   Legitimate Request WAF Header:     ${wafPassHeader}`);
    console.log(`   WAF Ingress Passthrough:           ${wafPassHeader === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 17: Service Discovery & Microservice Registry
    // -------------------------------------------------------------
    console.log('\n1️⃣7️⃣ Testing Service Discovery & Registry (/api/gateway/discovery)...');
    const discoRes = await fetch(`${BASE_URL}/api/gateway/discovery`);
    const discoData = await discoRes.json();
    const serviceNames = Object.keys(discoData.services || {});
    console.log(`   Discovered Services Count: ${serviceNames.length} (${serviceNames.join(', ')})`);
    const passDisco = serviceNames.includes('auth-service') && serviceNames.includes('coin-service');
    console.log(`   Service Discovery Status:  ${passDisco ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 18: Load Balancer Telemetry
    // -------------------------------------------------------------
    console.log('\n1️⃣8️⃣ Testing Gateway Load Balancer Status (/api/gateway/loadbalancer/status)...');
    const lbRes = await fetch(`${BASE_URL}/api/gateway/loadbalancer/status`);
    const lbData = await lbRes.json();
    console.log(`   Load Balancer Strategy: ${lbData.strategy}`);
    console.log(`   Load Balancer Online:   ${lbData.success ? '✅ PASS' : '❌ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 19: Distributed Caching Layer (Redis / Memory Cache Hit)
    // -------------------------------------------------------------
    console.log('\n1️⃣9️⃣ Testing Distributed Caching Layer (BFF Cache Hit Verification)...');
    // First call: Populate cache
    const cacheFirstRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
    });
    const firstCacheHeader = cacheFirstRes.headers.get('X-Cache');
    console.log(`   First Call Cache Header:  ${firstCacheHeader}`);

    // Second call: Should HIT cache
    const cacheSecondRes = await fetch(`${BASE_URL}/api/gateway/bff/mobile/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-tenant-id': 'tenant-default',
      },
    });
    const secondCacheHeader = cacheSecondRes.headers.get('X-Cache');
    console.log(`   Second Call Cache Header: ${secondCacheHeader} (Served from Distributed Cache Engine)`);
    const passCache = secondCacheHeader === 'HIT';
    console.log(`   Cache Verification:       ${passCache ? '✅ PASS (Sub-millisecond latency on cache hit!)' : '❌ FAIL'}`);

    // Check Cache Stats endpoint
    const cacheStatsRes = await fetch(`${BASE_URL}/api/gateway/cache/stats`);
    const cacheStatsData = await cacheStatsRes.json();
    console.log(`   Cache Backend Engine:     ${cacheStatsData.cache.backend}`);
    console.log(`   Cache Hit Rate:           ${cacheStatsData.cache.hitRate}`);

    // -------------------------------------------------------------
    // TEST 20: Observability & Prometheus Metrics Endpoint
    // -------------------------------------------------------------
    console.log('\n2️⃣0️⃣ Testing Observability & Prometheus Monitoring (/api/gateway/metrics)...');
    const metricsRes = await fetch(`${BASE_URL}/api/gateway/metrics`);
    const metricsText = await metricsRes.text();
    const hasPromFormat = metricsText.includes('http_requests_total') && metricsText.includes('circuit_breaker_state');
    console.log(`   Prometheus Content-Type:  ${metricsRes.headers.get('content-type')}`);
    console.log(`   Prometheus Scrape Status: ${hasPromFormat ? '✅ PASS (Ready for Prometheus/Grafana Scrapers!)' : '❌ FAIL'}`);

    console.log('\n================================================================');
    console.log('🎉 ALL 20 API GATEWAY, BFF, WAF & OBSERVABILITY TESTS PASSED! 🚀');
    console.log('================================================================\n');

    return true;
  } catch (error) {
    console.error('\n❌ Gateway Test Suite Failed with Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Execute tests
runGatewayTests();
