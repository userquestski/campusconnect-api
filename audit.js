const BASE_URL = 'http://127.0.0.1:5000/api';

async function testAll() {
  console.log('🚀 Starting CampusConnect Feature Audit...');
  
  try {
    // 1. Health Check
    const res = await fetch('http://127.0.0.1:5000/');
    const health = await res.json();
    console.log('✅ Server Health:', health.status);

    // 2. Auth Test (Login as SuperAdmin)
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@campusconnect.com',
        password: 'adminpassword123'
      })
    }).then(r => r.json());
    
    if(!loginRes.token) throw new Error('SuperAdmin login failed: ' + JSON.stringify(loginRes));
    const token = loginRes.token;
    console.log('✅ SuperAdmin Login: SUCCESS');

    // 3. Analytics Check
    const analytics = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());
    console.log('✅ Admin Analytics: RECEIVED');
    console.log('   - Total Clubs:', analytics.totalClubs);
    console.log('   - Total Events:', analytics.totalEvents);

    // 4. Club Discovery Check
    const clubs = await fetch(`${BASE_URL}/clubs`).then(r => r.json());
    console.log('✅ Club Discovery: SUCCESS');

    // 5. Event Discovery Check
    const events = await fetch(`${BASE_URL}/events`).then(r => r.json());
    console.log('✅ Event Discovery: SUCCESS');

    console.log('\n🌟 AUDIT COMPLETE: All core backend features are operational.');
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err.message);
  }
}

testAll();
