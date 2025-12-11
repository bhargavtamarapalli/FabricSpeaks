/**
 * Customers Module API Test Script
 * 
 * Tests all customer endpoints with positive and negative cases
 * Run with: node test-customers-api.js
 */

const BASE_URL = 'http://localhost:5000';

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper: Make API call
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                // Note: Add auth token here if needed
                // 'Authorization': 'Bearer YOUR_TOKEN'
            }
        });

        const data = await response.json();
        return { status: response.status, data, ok: response.ok };
    } catch (error) {
        return { status: 0, error: error.message, ok: false };
    }
}

// Helper: Log test result
function logTest(name, passed, details = '') {
    const result = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${result}: ${name}`);
    if (details) console.log(`   ${details}`);

    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
}

// ==================== POSITIVE TESTS ====================

async function testGetCustomers() {
    console.log('\n📋 Testing GET /api/admin/customers');

    // Test 1: Get customers without filters
    const res1 = await apiCall('/api/admin/customers');
    logTest(
        'Get all customers',
        res1.ok && res1.data.data && Array.isArray(res1.data.data),
        `Status: ${res1.status}, Count: ${res1.data.data?.length || 0}`
    );

    // Test 2: Get customers with pagination
    const res2 = await apiCall('/api/admin/customers?page=1&limit=5');
    logTest(
        'Get customers with pagination',
        res2.ok && res2.data.meta && res2.data.meta.page === 1 && res2.data.meta.limit === 5,
        `Page: ${res2.data.meta?.page}, Limit: ${res2.data.meta?.limit}`
    );

    // Test 3: Search customers
    const res3 = await apiCall('/api/admin/customers?search=test');
    logTest(
        'Search customers',
        res3.ok && Array.isArray(res3.data.data),
        `Results: ${res3.data.data?.length || 0}`
    );

    // Test 4: Verify customer stats are included
    if (res1.data.data && res1.data.data.length > 0) {
        const customer = res1.data.data[0];
        const hasStats =
            customer.hasOwnProperty('total_orders') &&
            customer.hasOwnProperty('total_spent') &&
            customer.hasOwnProperty('last_order_date');

        logTest(
            'Customer stats included',
            hasStats,
            `Fields: total_orders=${customer.total_orders}, total_spent=${customer.total_spent}`
        );
    }

    return res1.data.data?.[0]; // Return first customer for detail tests
}

async function testGetCustomerDetails(customerId) {
    console.log('\n👤 Testing GET /api/admin/customers/:id');

    if (!customerId) {
        console.log('⚠️  Skipping customer details tests - no customer ID available');
        return;
    }

    // Test 5: Get customer details
    const res = await apiCall(`/api/admin/customers/${customerId}`);
    logTest(
        'Get customer details',
        res.ok && res.data.user_id === customerId,
        `Customer: ${res.data.username || 'N/A'}`
    );

    // Test 6: Verify detailed stats
    const hasDetailedStats =
        res.data.hasOwnProperty('total_orders') &&
        res.data.hasOwnProperty('total_spent') &&
        res.data.hasOwnProperty('addresses');

    logTest(
        'Detailed stats included',
        hasDetailedStats,
        `Orders: ${res.data.total_orders}, Spent: ${res.data.total_spent}, Addresses: ${res.data.addresses?.length || 0}`
    );

    // Test 7: Verify field naming (snake_case)
    const hasCorrectNaming =
        res.data.hasOwnProperty('user_id') &&
        res.data.hasOwnProperty('total_orders') &&
        res.data.hasOwnProperty('total_spent');

    logTest(
        'Correct field naming (snake_case)',
        hasCorrectNaming,
        'Fields: user_id, total_orders, total_spent'
    );
}

async function testUpdateCustomerStatus(customerId) {
    console.log('\n🔄 Testing PATCH /api/admin/customers/:id/status');

    if (!customerId) {
        console.log('⚠️  Skipping status update tests - no customer ID available');
        return;
    }

    // Test 8: Update customer status to inactive
    const res = await apiCall(`/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'inactive' })
    });

    logTest(
        'Update customer status',
        res.ok,
        `Status: ${res.status}, Response: ${JSON.stringify(res.data).substring(0, 50)}...`
    );
}

async function testVIPCustomers() {
    console.log('\n👑 Testing GET /api/admin/customers/vip');

    // Test 9: Get VIP customers
    const res = await apiCall('/api/admin/customers/vip');
    logTest(
        'Get VIP customers',
        res.ok && Array.isArray(res.data),
        `VIP Count: ${res.data.length || 0}`
    );

    // Test 10: Verify VIP stats
    if (res.data && res.data.length > 0) {
        const vip = res.data[0];
        const hasVIPStats =
            vip.hasOwnProperty('totalSpent') &&
            vip.hasOwnProperty('orderCount') &&
            Number(vip.totalSpent) >= 50000; // VIP threshold

        logTest(
            'VIP stats correct',
            hasVIPStats,
            `Total Spent: ${vip.totalSpent}, Orders: ${vip.orderCount}`
        );
    }
}

// ==================== NEGATIVE TESTS ====================

async function testErrorCases() {
    console.log('\n❌ Testing Error Cases');

    // Test 11: Invalid customer ID
    const res1 = await apiCall('/api/admin/customers/invalid-uuid-123');
    logTest(
        'Invalid customer ID returns error',
        !res1.ok && (res1.status === 404 || res1.status === 500),
        `Status: ${res1.status}`
    );

    // Test 12: Non-existent customer
    const res2 = await apiCall('/api/admin/customers/00000000-0000-0000-0000-000000000000');
    logTest(
        'Non-existent customer returns 404',
        res2.status === 404,
        `Status: ${res2.status}, Message: ${res2.data.error || 'N/A'}`
    );

    // Test 13: Invalid status value
    const res3 = await apiCall('/api/admin/customers/some-id/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' })
    });
    logTest(
        'Invalid status value returns 400',
        res3.status === 400,
        `Status: ${res3.status}, Error: ${res3.data.error || 'N/A'}`
    );

    // Test 14: Missing status field
    const res4 = await apiCall('/api/admin/customers/some-id/status', {
        method: 'PATCH',
        body: JSON.stringify({})
    });
    logTest(
        'Missing status field returns 400',
        res4.status === 400,
        `Status: ${res4.status}`
    );

    // Test 15: Invalid pagination params
    const res5 = await apiCall('/api/admin/customers?page=-1&limit=0');
    logTest(
        'Invalid pagination handled gracefully',
        res5.ok || res5.status === 400,
        `Status: ${res5.status}`
    );
}

// ==================== EDGE CASES ====================

async function testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases');

    // Test 16: Empty search query
    const res1 = await apiCall('/api/admin/customers?search=');
    logTest(
        'Empty search query handled',
        res1.ok,
        `Status: ${res1.status}, Results: ${res1.data.data?.length || 0}`
    );

    // Test 17: Very large page number
    const res2 = await apiCall('/api/admin/customers?page=999999');
    logTest(
        'Large page number handled',
        res2.ok && res2.data.data.length === 0,
        `Status: ${res2.status}, Results: ${res2.data.data?.length || 0}`
    );

    // Test 18: Special characters in search
    const res3 = await apiCall('/api/admin/customers?search=' + encodeURIComponent("test@email.com"));
    logTest(
        'Special characters in search handled',
        res3.ok,
        `Status: ${res3.status}`
    );

    // Test 19: Very large limit
    const res4 = await apiCall('/api/admin/customers?limit=1000');
    logTest(
        'Large limit handled',
        res4.ok,
        `Status: ${res4.status}, Results: ${res4.data.data?.length || 0}`
    );
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
    console.log('🧪 Starting Customers Module API Tests\n');
    console.log('='.repeat(60));

    try {
        // Positive tests
        const firstCustomer = await testGetCustomers();
        await testGetCustomerDetails(firstCustomer?.user_id);
        await testUpdateCustomerStatus(firstCustomer?.user_id);
        await testVIPCustomers();

        // Negative tests
        await testErrorCases();

        // Edge cases
        await testEdgeCases();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${results.passed + results.failed}`);
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.tests
                .filter(t => !t.passed)
                .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
runAllTests();
