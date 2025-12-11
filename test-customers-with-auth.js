/**
 * Complete API Testing with Authentication
 * Tests customer endpoints exactly as frontend calls them
 */

const BASE_URL = 'http://localhost:5000';

// You'll need to get a real auth token from your browser
// 1. Open browser DevTools (F12)
// 2. Go to Application/Storage → Cookies
// 3. Copy the 'token' value
const AUTH_TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

console.log('🧪 Testing Customer APIs with Authentication\n');
console.log('=' .repeat(60));

async function testWithAuth(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${AUTH_TOKEN}`,
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('\n📋 Test 1: GET /api/admin/customers (List)');
  console.log('-'.repeat(60));
  const list = await testWithAuth('GET', '/api/admin/customers?page=1&limit=10');
  console.log(`Status: ${list.status}`);
  console.log(`Success: ${list.ok}`);
  if (list.ok) {
    console.log(`Customers: ${list.data.data?.length || 0}`);
    console.log(`Total: ${list.data.meta?.total || 0}`);
    console.log(`Sample customer:`, list.data.data?.[0] ? {
      user_id: list.data.data[0].user_id,
      username: list.data.data[0].username,
      total_orders: list.data.data[0].total_orders,
      total_spent: list.data.data[0].total_spent
    } : 'No customers');
  } else {
    console.log(`Error:`, list.data);
  }

  const firstCustomerId = list.data?.data?.[0]?.user_id;

  console.log('\n👤 Test 2: GET /api/admin/customers/:id (Details)');
  console.log('-'.repeat(60));
  if (firstCustomerId) {
    const details = await testWithAuth('GET', `/api/admin/customers/${firstCustomerId}`);
    console.log(`Status: ${details.status}`);
    console.log(`Success: ${details.ok}`);
    if (details.ok) {
      console.log(`Customer:`, {
        username: details.data.username,
        email: details.data.email,
        total_orders: details.data.total_orders,
        total_spent: details.data.total_spent,
        addresses: details.data.addresses?.length || 0
      });
    } else {
      console.log(`Error:`, details.data);
    }
  } else {
    console.log('⚠️  Skipped - no customer ID available');
  }

  console.log('\n🔍 Test 3: GET /api/admin/customers?search=... (Search)');
  console.log('-'.repeat(60));
  const search = await testWithAuth('GET', '/api/admin/customers?search=test');
  console.log(`Status: ${search.status}`);
  console.log(`Success: ${search.ok}`);
  if (search.ok) {
    console.log(`Results: ${search.data.data?.length || 0}`);
  } else {
    console.log(`Error:`, search.data);
  }

  console.log('\n👑 Test 4: GET /api/admin/customers/vip (VIP Customers)');
  console.log('-'.repeat(60));
  const vip = await testWithAuth('GET', '/api/admin/customers/vip');
  console.log(`Status: ${vip.status}`);
  console.log(`Success: ${vip.ok}`);
  if (vip.ok) {
    console.log(`VIP Count: ${vip.data?.length || 0}`);
    if (vip.data?.[0]) {
      console.log(`Sample VIP:`, {
        username: vip.data[0].username,
        totalSpent: vip.data[0].totalSpent,
        orderCount: vip.data[0].orderCount
      });
    }
  } else {
    console.log(`Error:`, vip.data);
  }

  console.log('\n🛒 Test 5: GET /api/admin/customers/abandoned-carts');
  console.log('-'.repeat(60));
  const carts = await testWithAuth('GET', '/api/admin/customers/abandoned-carts');
  console.log(`Status: ${carts.status}`);
  console.log(`Success: ${carts.ok}`);
  if (carts.ok) {
    console.log(`Abandoned Carts: ${carts.data?.length || 0}`);
  } else {
    console.log(`Error:`, carts.data);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const tests = [list, details, search, vip, carts].filter(t => t);
  const passed = tests.filter(t => t.ok).length;
  const failed = tests.filter(t => !t.ok).length;
  
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All API tests passed!');
    console.log('✅ Ready for browser testing');
  } else {
    console.log('\n⚠️  Some tests failed - check errors above');
  }
}

// Instructions
console.log('\n⚠️  IMPORTANT: Update AUTH_TOKEN before running!');
console.log('\nHow to get your auth token:');
console.log('1. Open browser and login to admin panel');
console.log('2. Press F12 (DevTools)');
console.log('3. Go to Application → Cookies');
console.log('4. Copy the "token" value');
console.log('5. Replace AUTH_TOKEN in this file');
console.log('6. Run: node test-customers-with-auth.js\n');

if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ Please update AUTH_TOKEN first!\n');
} else {
  runTests();
}
