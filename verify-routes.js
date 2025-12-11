/**
 * Quick Route Verification Script
 * Tests if customer endpoints are accessible
 */

console.log('🔍 Verifying Customer API Routes...\n');

const BASE_URL = 'http://localhost:5000';

async function testRoute(method, endpoint, description) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const status = response.status;
        const statusText = response.statusText;

        // 401 = Unauthorized (route exists but needs auth) ✅
        // 404 = Not Found (route doesn't exist) ❌
        // 200 = Success ✅

        if (status === 401) {
            console.log(`✅ ${method} ${endpoint}`);
            console.log(`   Status: ${status} (Route exists, auth required)`);
            console.log(`   ${description}\n`);
            return true;
        } else if (status === 404) {
            console.log(`❌ ${method} ${endpoint}`);
            console.log(`   Status: ${status} (Route NOT found!)`);
            console.log(`   ${description}\n`);
            return false;
        } else if (status === 200) {
            console.log(`✅ ${method} ${endpoint}`);
            console.log(`   Status: ${status} (Route accessible)`);
            console.log(`   ${description}\n`);
            return true;
        } else {
            console.log(`⚠️  ${method} ${endpoint}`);
            console.log(`   Status: ${status} ${statusText}`);
            console.log(`   ${description}\n`);
            return true; // Route exists but has other issue
        }
    } catch (error) {
        console.log(`❌ ${method} ${endpoint}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   ${description}\n`);
        return false;
    }
}

async function verifyRoutes() {
    console.log('Testing Customer Module Routes:');
    console.log('='.repeat(60) + '\n');

    const results = [];

    // Test all customer routes
    results.push(await testRoute(
        'GET',
        '/api/admin/customers',
        'List all customers with pagination'
    ));

    results.push(await testRoute(
        'GET',
        '/api/admin/customers/vip',
        'Get VIP customers (>₹50k spent)'
    ));

    results.push(await testRoute(
        'GET',
        '/api/admin/customers/abandoned-carts',
        'Get abandoned shopping carts'
    ));

    results.push(await testRoute(
        'GET',
        '/api/admin/customers/test-id-123',
        'Get single customer details'
    ));

    results.push(await testRoute(
        'PATCH',
        '/api/admin/customers/test-id-123/status',
        'Update customer status'
    ));

    // Summary
    console.log('='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY\n');

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log(`Total Routes Tested: ${results.length}`);
    console.log(`✅ Connected: ${passed}`);
    console.log(`❌ Not Found: ${failed}`);

    if (failed === 0) {
        console.log('\n🎉 All routes are properly connected!');
        console.log('✅ Ready for browser testing');
    } else {
        console.log('\n⚠️  Some routes are not connected properly');
        console.log('❌ Fix routes before browser testing');
    }

    console.log('='.repeat(60));
}

verifyRoutes();
