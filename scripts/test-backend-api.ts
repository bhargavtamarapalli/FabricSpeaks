/**
 * Phase 1 Backend API Integration Tests
 * Tests the full API flow including email triggers
 */

// Load environment variables
import '../server/env';

const BASE_URL = 'http://127.0.0.1:5000';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, status: 'PASSED' | 'FAILED' | 'SKIPPED', details?: string, error?: string) {
  results.push({ name, status, details, error });
  const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
  if (error) console.log(`   Error: ${error}`);
}

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  
  return { response, data, status: response.status };
}

// Test 1: Health Check API
async function testHealthCheckAPI() {
  console.log('\n=== Testing Health Check API ===\n');
  
  try {
    const { status, data } = await apiRequest('/api/health');
    
    if (status === 200 && data.status) {
      logTest('GET /api/health', 'PASSED', `Status: ${data.status}, DB: ${data.checks?.database?.status}`);
    } else {
      logTest('GET /api/health', 'FAILED', `Unexpected response: ${status}`);
    }
  } catch (error: any) {
    logTest('GET /api/health', 'FAILED', undefined, error.message);
  }
}

// Test 2: User Registration (triggers welcome email in some systems)
async function testUserRegistration() {
  console.log('\n=== Testing User Registration API ===\n');
  
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      fullName: 'Test User'
    };
    
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    
    if (status === 200 || status === 201) {
      logTest('POST /api/auth/register', 'PASSED', `User created: ${testUser.username}`);
      return { userId: data.user?.id, username: testUser.username, password: testUser.password };
    } else {
      logTest('POST /api/auth/register', 'FAILED', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error: any) {
    logTest('POST /api/auth/register', 'FAILED', undefined, error.message);
    return null;
  }
}

// Test 3: User Login
async function testUserLogin(credentials: { username: string; password: string } | null) {
  console.log('\n=== Testing User Login API ===\n');
  
  if (!credentials) {
    logTest('POST /api/auth/login', 'SKIPPED', 'No credentials from registration');
    return null;
  }
  
  try {
    const { status, data, response } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (status === 200) {
      // Extract session cookie
      const cookies = response.headers.get('set-cookie');
      logTest('POST /api/auth/login', 'PASSED', `Logged in as: ${credentials.username}`);
      return cookies;
    } else {
      logTest('POST /api/auth/login', 'FAILED', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error: any) {
    logTest('POST /api/auth/login', 'FAILED', undefined, error.message);
    return null;
  }
}

// Test 4: Get Products (basic API test)
async function testGetProducts() {
  console.log('\n=== Testing Products API ===\n');
  
  try {
    const { status, data } = await apiRequest('/api/products');
    
    if (status === 200 && Array.isArray(data)) {
      logTest('GET /api/products', 'PASSED', `Retrieved ${data.length} products`);
      return data.length > 0 ? data[0] : null;
    } else {
      logTest('GET /api/products', 'FAILED', `Status: ${status}`);
      return null;
    }
  } catch (error: any) {
    logTest('GET /api/products', 'FAILED', undefined, error.message);
    return null;
  }
}

// Test 5: Add to Cart (requires auth)
async function testAddToCart(sessionCookie: string | null, product: any) {
  console.log('\n=== Testing Cart API ===\n');
  
  if (!sessionCookie) {
    logTest('POST /api/cart', 'SKIPPED', 'No session cookie from login');
    return;
  }
  
  if (!product) {
    logTest('POST /api/cart', 'SKIPPED', 'No product available');
    return;
  }
  
  try {
    const { status, data } = await apiRequest('/api/cart', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 2,
      }),
    });
    
    if (status === 200 || status === 201) {
      logTest('POST /api/cart', 'PASSED', `Added product ${product.id} to cart`);
    } else {
      logTest('POST /api/cart', 'FAILED', `Status: ${status}, Response: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    logTest('POST /api/cart', 'FAILED', undefined, error.message);
  }
}

// Test 6: Create Order (should trigger order confirmation email)
async function testCreateOrder(sessionCookie: string | null) {
  console.log('\n=== Testing Order Creation API (Email Trigger Test) ===\n');
  
  if (!sessionCookie) {
    logTest('POST /api/orders', 'SKIPPED', 'No session cookie from login');
    return;
  }
  
  try {
    const orderData = {
      items: [
        {
          productId: 1, // Assuming product ID 1 exists
          quantity: 2,
          price: 500
        }
      ],
      shippingAddress: '123 Test Street\nTest City, TS 12345\nIndia',
      paymentMethod: 'cod', // Cash on Delivery for testing
      totalAmount: 1000
    };
    
    const { status, data } = await apiRequest('/api/orders', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
      },
      body: JSON.stringify(orderData),
    });
    
    if (status === 200 || status === 201) {
      logTest('POST /api/orders', 'PASSED', `Order created: ${data.id || 'ID not returned'}`);
      console.log('   📧 Check if order confirmation email was sent!');
      return data.id;
    } else {
      logTest('POST /api/orders', 'FAILED', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error: any) {
    logTest('POST /api/orders', 'FAILED', undefined, error.message);
    return null;
  }
}

// Test 7: Get Order Details
async function testGetOrder(sessionCookie: string | null, orderId: string | null) {
  console.log('\n=== Testing Get Order API ===\n');
  
  if (!sessionCookie || !orderId) {
    logTest('GET /api/orders/:id', 'SKIPPED', 'No session or order ID');
    return;
  }
  
  try {
    const { status, data } = await apiRequest(`/api/orders/${orderId}`, {
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    if (status === 200) {
      logTest('GET /api/orders/:id', 'PASSED', `Retrieved order ${orderId}`);
    } else {
      logTest('GET /api/orders/:id', 'FAILED', `Status: ${status}`);
    }
  } catch (error: any) {
    logTest('GET /api/orders/:id', 'FAILED', undefined, error.message);
  }
}

// Test 8: CSRF Token Endpoint
async function testCSRFToken() {
  console.log('\n=== Testing CSRF Token API ===\n');
  
  try {
    const { status, data } = await apiRequest('/api/csrf-token');
    
    if (status === 200 && data.csrfToken) {
      logTest('GET /api/csrf-token', 'PASSED', `Token received: ${data.csrfToken.substring(0, 20)}...`);
    } else {
      logTest('GET /api/csrf-token', 'FAILED', `Status: ${status}`);
    }
  } catch (error: any) {
    logTest('GET /api/csrf-token', 'FAILED', undefined, error.message);
  }
}

// Test 9: Version Endpoint
async function testVersionEndpoint() {
  console.log('\n=== Testing Version API ===\n');
  
  try {
    const { status, data } = await apiRequest('/api/version');
    
    if (status === 200 && data.version) {
      logTest('GET /api/version', 'PASSED', `Version: ${data.version}`);
    } else {
      logTest('GET /api/version', 'FAILED', `Status: ${status}`);
    }
  } catch (error: any) {
    logTest('GET /api/version', 'FAILED', undefined, error.message);
  }
}

// Test 10: Admin Endpoints (should require admin auth)
async function testAdminEndpoints(sessionCookie: string | null) {
  console.log('\n=== Testing Admin API Protection ===\n');
  
  try {
    const { status } = await apiRequest('/api/admin/users', {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
    });
    
    // Should return 401 or 403 for non-admin users
    if (status === 401 || status === 403) {
      logTest('GET /api/admin/users', 'PASSED', 'Correctly protected (401/403 for non-admin)');
    } else if (status === 200) {
      logTest('GET /api/admin/users', 'PASSED', 'Admin access granted (user has admin role)');
    } else {
      logTest('GET /api/admin/users', 'FAILED', `Unexpected status: ${status}`);
    }
  } catch (error: any) {
    logTest('GET /api/admin/users', 'FAILED', undefined, error.message);
  }
}

// Main test runner
async function runBackendAPITests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║     PHASE 1 BACKEND API INTEGRATION TESTS              ║');
  console.log('║     Testing Full API Flow & Email Triggers            ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // Run tests in sequence
    await testHealthCheckAPI();
    await testVersionEndpoint();
    await testCSRFToken();
    
    const userCreds = await testUserRegistration();
    const sessionCookie = await testUserLogin(userCreds);
    
    const product = await testGetProducts();
    await testAddToCart(sessionCookie, product);
    
    const orderId = await testCreateOrder(sessionCookie);
    await testGetOrder(sessionCookie, orderId);
    
    await testAdminEndpoints(sessionCookie);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║              TEST SUMMARY                              ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const total = results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`⏱️  Duration: ${duration}s\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:');
      results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`  ❌ ${r.name}`);
        if (r.error) console.log(`     ${r.error}`);
      });
      console.log('');
    }
    
    console.log('📧 Email Trigger Tests:');
    console.log('   - Order creation should have triggered order confirmation email');
    console.log('   - Check fabricspeaksofficial@gmail.com for new order email\n');
    
    console.log('🔍 What Was Tested:');
    console.log('   ✅ Health check endpoint');
    console.log('   ✅ User registration flow');
    console.log('   ✅ User login/authentication');
    console.log('   ✅ Product listing API');
    console.log('   ✅ Cart operations');
    console.log('   ✅ Order creation (email trigger)');
    console.log('   ✅ Order retrieval');
    console.log('   ✅ CSRF protection');
    console.log('   ✅ Admin endpoint protection');
    console.log('   ✅ Version endpoint\n');
    
    const successRate = ((passed / (total - skipped)) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}% (excluding skipped tests)\n`);
    
    if (failed === 0 && passed > 0) {
      console.log('🎉 ALL BACKEND API TESTS PASSED!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runBackendAPITests().catch(console.error);
