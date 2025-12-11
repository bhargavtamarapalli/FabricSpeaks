/**
 * Load Test: Checkout Flow
 * Tests 1000 concurrent users with <500ms p95 latency
 * 
 * Run with: k6 run tests/load/checkout.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const checkoutDuration = new Trend('checkout_duration');
const paymentDuration = new Trend('payment_duration');

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 100 },   // Ramp up to 100 users
        { duration: '1m', target: 500 },    // Ramp up to 500 users
        { duration: '2m', target: 1000 },   // Ramp up to 1000 users
        { duration: '3m', target: 1000 },   // Stay at 1000 users
        { duration: '30s', target: 0 },     // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<500'],  // 95% of requests must complete below 500ms
        'http_req_failed': ['rate<0.01'],    // Error rate must be below 1%
        'errors': ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
const testProducts = [
    'prod_1',
    'prod_2',
    'prod_3',
    'prod_4',
    'prod_5',
];

/**
 * Setup: Create test user
 */
export function setup() {
    const email = `loadtest_${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
        email,
        password,
        fullName: 'Load Test User',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (registerRes.status !== 201) {
        console.error('Failed to create test user:', registerRes.body);
        return null;
    }

    return { email, password };
}

/**
 * Main test scenario
 */
export default function (data) {
    if (!data) {
        console.error('Setup failed, skipping test');
        return;
    }

    const { email, password } = data;

    // 1. Login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email,
        password,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
        'login successful': (r) => r.status === 200,
    });

    if (!loginSuccess) {
        errorRate.add(1);
        return;
    }

    errorRate.add(0);
    const sessionCookie = loginRes.cookies['connect.sid'];

    // 2. Browse products
    const productsRes = http.get(`${BASE_URL}/api/products`, {
        cookies: { 'connect.sid': sessionCookie },
    });

    check(productsRes, {
        'products loaded': (r) => r.status === 200,
    });

    sleep(1); // Simulate user browsing

    // 3. Add items to cart
    const productId = testProducts[Math.floor(Math.random() * testProducts.length)];

    const addToCartRes = http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({
        product_id: productId,
        quantity: Math.floor(Math.random() * 3) + 1,
    }), {
        headers: { 'Content-Type': 'application/json' },
        cookies: { 'connect.sid': sessionCookie },
    });

    check(addToCartRes, {
        'item added to cart': (r) => r.status === 201,
    });

    sleep(2); // Simulate user thinking

    // 4. View cart
    const cartRes = http.get(`${BASE_URL}/api/cart`, {
        cookies: { 'connect.sid': sessionCookie },
    });

    check(cartRes, {
        'cart loaded': (r) => r.status === 200,
    });

    sleep(1);

    // 5. Checkout (critical path)
    const checkoutStart = Date.now();

    const checkoutRes = http.post(`${BASE_URL}/api/orders/checkout`, JSON.stringify({
        addressId: 'test-address-id',
        paymentMethod: 'razorpay',
    }), {
        headers: { 'Content-Type': 'application/json' },
        cookies: { 'connect.sid': sessionCookie },
    });

    const checkoutTime = Date.now() - checkoutStart;
    checkoutDuration.add(checkoutTime);

    const checkoutSuccess = check(checkoutRes, {
        'checkout successful': (r) => r.status === 200 || r.status === 201,
        'checkout fast enough': () => checkoutTime < 500,
    });

    if (!checkoutSuccess) {
        errorRate.add(1);
        return;
    }

    errorRate.add(0);

    // 6. Simulate payment verification (if checkout succeeded)
    if (checkoutRes.status === 200 || checkoutRes.status === 201) {
        sleep(1); // Simulate payment gateway delay

        const paymentStart = Date.now();

        const verifyRes = http.post(`${BASE_URL}/api/orders/verify`, JSON.stringify({
            razorpay_order_id: 'test_order_id',
            razorpay_payment_id: `test_payment_${Date.now()}_${Math.random()}`,
            razorpay_signature: 'test_signature',
        }), {
            headers: { 'Content-Type': 'application/json' },
            cookies: { 'connect.sid': sessionCookie },
        });

        const paymentTime = Date.now() - paymentStart;
        paymentDuration.add(paymentTime);

        check(verifyRes, {
            'payment verified': (r) => r.status === 200,
            'payment fast enough': () => paymentTime < 500,
        });
    }

    sleep(1); // Simulate user viewing confirmation
}

/**
 * Teardown: Cleanup
 */
export function teardown(data) {
    if (!data) return;

    console.log('Load test completed');
    console.log(`Test user: ${data.email}`);
}

/**
 * Handle summary
 */
export function handleSummary(data) {
    const p95 = data.metrics.http_req_duration.values['p(95)'];
    const errorRate = data.metrics.errors ? data.metrics.errors.values.rate : 0;

    console.log('\n=== Load Test Results ===');
    console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
    console.log(`P95 Latency: ${p95.toFixed(2)}ms`);
    console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`Passed: ${p95 < 500 && errorRate < 0.01 ? 'YES ✅' : 'NO ❌'}`);

    return {
        'stdout': JSON.stringify(data, null, 2),
        'summary.json': JSON.stringify({
            timestamp: new Date().toISOString(),
            p95_latency: p95,
            error_rate: errorRate,
            total_requests: data.metrics.http_reqs.values.count,
            passed: p95 < 500 && errorRate < 0.01,
        }, null, 2),
    };
}
