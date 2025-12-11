# User Management System - Test Implementation Guide
**Project:** Fabric Speaks E-commerce Platform  
**Version:** 1.0  
**Date:** 2025-11-27  
**Purpose:** Guide for implementing automation tests based on requirements and test cases

---

## Table of Contents
1. [Test Suite Structure](#test-suite-structure)
2. [Setup and Configuration](#setup-and-configuration)
3. [Test Utilities and Helpers](#test-utilities-and-helpers)
4. [Unit Test Implementation](#unit-test-implementation)
5. [Integration Test Implementation](#integration-test-implementation)
6. [E2E Test Implementation](#e2e-test-implementation)
7. [Performance Test Implementation](#performance-test-implementation)
8. [Security Test Implementation](#security-test-implementation)
9. [CI/CD Integration](#cicd-integration)

---

## 1. Test Suite Structure

### Recommended Directory Structure
```
tests/
├── unit/
│   ├── guest/
│   │   ├── guestSession.test.ts
│   │   ├── guestCart.test.ts
│   │   └── guestWishlist.test.ts
│   ├── validation/
│   │   ├── emailValidation.test.ts
│   │   └── passwordValidation.test.ts
│   ├── auth/
│   │   ├── tokenManagement.test.ts
│   │   └── permissions.test.ts
│   └── utils/
│       └── cartMerge.test.ts
│
├── integration/
│   ├── auth/
│   │   ├── registration.test.ts
│   │   ├── login.test.ts
│   │   ├── emailVerification.test.ts
│   │   └── passwordReset.test.ts
│   ├── profile/
│   │   └── profileManagement.test.ts
│   ├── address/
│   │   └── addressManagement.test.ts
│   ├── cart/
│   │   └── cartMigration.test.ts
│   └── rbac/
│       └── authorization.test.ts
│
├── e2e/
│   ├── guest/
│   │   └── guestJourney.spec.ts
│   ├── auth/
│   │   ├── registration.spec.ts
│   │   ├── login.spec.ts
│   │   └── passwordReset.spec.ts
│   ├── profile/
│   │   └── profileManagement.spec.ts
│   ├── address/
│   │   └── addressManagement.spec.ts
│   └── admin/
│       └── adminAccess.spec.ts
│
├── performance/
│   ├── load/
│   │   ├── concurrentLogins.k6.js
│   │   ├── guestSessions.k6.js
│   │   └── cartOperations.k6.js
│   └── stress/
│       └── authStress.k6.js
│
├── security/
│   ├── auth/
│   │   ├── bruteForce.test.ts
│   │   ├── sqlInjection.test.ts
│   │   └── xss.test.ts
│   └── rbac/
│       ├── privilegeEscalation.test.ts
│       └── idor.test.ts
│
├── fixtures/
│   ├── users.ts
│   ├── addresses.ts
│   └── products.ts
│
└── helpers/
    ├── testSetup.ts
    ├── testTeardown.ts
    ├── authHelper.ts
    ├── dbHelper.ts
    └── emailHelper.ts
```

---

## 2. Setup and Configuration

### 2.1 Install Dependencies

```bash
# Testing frameworks
npm install --save-dev vitest @vitest/ui
npm install --save-dev @playwright/test
npm install --save-dev supertest @types/supertest

# Mocking and utilities
npm install --save-dev @faker-js/faker
npm install --save-dev msw
npm install --save-dev dotenv-cli

# Performance testing
npm install --save-dev k6

# Code coverage
npm install --save-dev @vitest/coverage-v8
```

### 2.2 Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/helpers/testSetup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@server': path.resolve(__dirname, './server'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

### 2.3 Playwright Configuration

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 2.4 Test Environment Variables

**File:** `.env.test`

```bash
# Database
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/fabric_speaks_test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_KEY=test_service_key

# Auth
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_REFRESH_SECRET=test_refresh_secret_key

# Email (use test service)
EMAIL_SERVICE=test
EMAIL_FROM=test@fabricspeaks.com

# Redis
REDIS_URL=redis://localhost:6379/1

# App
NODE_ENV=test
PORT=5001
```

---

## 3. Test Utilities and Helpers

### 3.1 Test Setup

**File:** `tests/helpers/testSetup.ts`

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from './dbHelper';
import { startTestServer, stopTestServer } from './serverHelper';

// Global setup
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
  
  // Start test server
  await startTestServer();
  
  console.log('Test environment initialized');
});

// Global teardown
afterAll(async () => {
  // Stop test server
  await stopTestServer();
  
  // Cleanup test database
  await cleanupTestDatabase();
  
  console.log('Test environment cleaned up');
});

// Reset database before each test
beforeEach(async () => {
  await cleanupTestDatabase();
  await setupTestDatabase();
});

// Cleanup after each test
afterEach(async () => {
  // Clear any test data
});
```

### 3.2 Database Helper

**File:** `tests/helpers/dbHelper.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function setupTestDatabase() {
  // Run migrations
  // Seed test data if needed
}

export async function cleanupTestDatabase() {
  // Delete all test data
  await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('user_addresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.auth.admin.listUsers().then(({ data }) => {
    data.users.forEach(user => {
      supabase.auth.admin.deleteUser(user.id);
    });
  });
}

export async function createTestUser(data: {
  email: string;
  password: string;
  role?: string;
  emailVerified?: boolean;
}) {
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: data.emailVerified ?? true,
    user_metadata: {
      role: data.role || 'customer',
    },
  });

  if (error) throw error;
  return user;
}

export async function createTestAddress(userId: string, data: any) {
  const { data: address, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return address;
}
```

### 3.3 Auth Helper

**File:** `tests/helpers/authHelper.ts`

```typescript
import request from 'supertest';
import { app } from '@server/index';

export async function registerUser(userData: {
  email: string;
  password: string;
  name?: string;
}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return response;
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);

  return response;
}

export async function getAuthToken(email: string, password: string) {
  const response = await loginUser({ email, password });
  return response.body.accessToken;
}

export function createAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

### 3.4 Test Data Fixtures

**File:** `tests/fixtures/users.ts`

```typescript
import { faker } from '@faker-js/faker';

export const validUser = {
  email: 'test@example.com',
  password: 'Password123',
  name: 'Test User',
};

export const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPass123',
  name: 'Admin User',
  role: 'admin',
};

export function generateRandomUser() {
  return {
    email: faker.internet.email(),
    password: 'Password123',
    name: faker.person.fullName(),
  };
}

export function generateRandomAddress() {
  return {
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    address_line1: faker.location.streetAddress(),
    address_line2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    postal_code: faker.location.zipCode(),
    country: 'USA',
  };
}
```

---

## 4. Unit Test Implementation

### 4.1 Guest Session Tests

**File:** `tests/unit/guest/guestSession.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { generateGuestId, storeGuestId, getGuestId } from '@/lib/guestSession';

describe('Guest Session Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateGuestId', () => {
    it('should generate valid UUID v4', () => {
      // TC-UNIT-GU-001
      const guestId = generateGuestId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(guestId).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      // TC-UNIT-GU-001
      const id1 = generateGuestId();
      const id2 = generateGuestId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('storeGuestId', () => {
    it('should store guest ID in localStorage', () => {
      // TC-UNIT-GU-002
      const mockGuestId = '123e4567-e89b-12d3-a456-426614174000';
      
      storeGuestId(mockGuestId);
      
      expect(localStorage.getItem('guest_id')).toBe(mockGuestId);
    });

    it('should retrieve stored guest ID', () => {
      // TC-UNIT-GU-002
      const mockGuestId = '123e4567-e89b-12d3-a456-426614174000';
      
      storeGuestId(mockGuestId);
      const retrieved = getGuestId();
      
      expect(retrieved).toBe(mockGuestId);
    });
  });
});
```

### 4.2 Guest Cart Tests

**File:** `tests/unit/guest/guestCart.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToGuestCart,
  removeFromGuestCart,
  updateGuestCartItem,
  calculateCartTotal,
  clearGuestCart,
} from '@/lib/guestCart';

describe('Guest Cart Management', () => {
  beforeEach(() => {
    localStorage.clear();
    clearGuestCart();
  });

  describe('addToGuestCart', () => {
    it('should add item to cart', () => {
      // TC-UNIT-GU-003
      const item = {
        product_id: 'prod-001',
        variant_id: 'var-001',
        quantity: 2,
        price: 1000,
      };

      addToGuestCart(item);
      const cart = JSON.parse(localStorage.getItem('guest_cart') || '{}');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('should increment quantity for duplicate items', () => {
      // TC-UNIT-GU-003
      const item = {
        product_id: 'prod-001',
        variant_id: 'var-001',
        quantity: 2,
        price: 1000,
      };

      addToGuestCart(item);
      addToGuestCart(item);
      
      const cart = JSON.parse(localStorage.getItem('guest_cart') || '{}');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(4);
    });

    it('should throw error when exceeding max items', () => {
      // TC-UNIT-GU-006
      // Add 50 items
      for (let i = 0; i < 50; i++) {
        addToGuestCart({
          product_id: `prod-${i}`,
          variant_id: `var-${i}`,
          quantity: 1,
          price: 100,
        });
      }

      // Try to add 51st item
      expect(() => {
        addToGuestCart({
          product_id: 'prod-51',
          variant_id: 'var-51',
          quantity: 1,
          price: 100,
        });
      }).toThrow('Maximum 50 items allowed');
    });
  });

  describe('removeFromGuestCart', () => {
    it('should remove item from cart', () => {
      // TC-UNIT-GU-004
      addToGuestCart({
        product_id: 'prod-001',
        variant_id: 'var-001',
        quantity: 2,
        price: 1000,
      });
      addToGuestCart({
        product_id: 'prod-002',
        variant_id: 'var-002',
        quantity: 1,
        price: 500,
      });

      removeFromGuestCart('prod-001', 'var-001');
      
      const cart = JSON.parse(localStorage.getItem('guest_cart') || '{}');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product_id).toBe('prod-002');
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate total correctly', () => {
      // TC-UNIT-GU-005
      const cart = {
        items: [
          { quantity: 2, price: 1000 },
          { quantity: 3, price: 500 },
          { quantity: 1, price: 2000 },
        ],
      };

      const total = calculateCartTotal(cart);

      expect(total).toBe(5500); // (2*1000) + (3*500) + (1*2000)
    });
  });
});
```

### 4.3 Email Validation Tests

**File:** `tests/unit/validation/emailValidation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/validation';

describe('Email Validation', () => {
  describe('valid emails', () => {
    it('should accept valid email formats', () => {
      // TC-UNIT-VAL-001
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@sub.example.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });
  });

  describe('invalid emails', () => {
    it('should reject invalid email formats', () => {
      // TC-UNIT-VAL-002
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });
});
```

### 4.4 Password Validation Tests

**File:** `tests/unit/validation/passwordValidation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/lib/validation';

describe('Password Validation', () => {
  it('should accept valid passwords', () => {
    // TC-UNIT-VAL-003
    const validPasswords = [
      'Password1',
      'MyP@ssw0rd',
      'Str0ngPass!',
      'Test1234',
    ];

    validPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject password that is too short', () => {
    // TC-UNIT-VAL-004
    const result = validatePassword('Pass1');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    // TC-UNIT-VAL-005
    const result = validatePassword('password1');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('uppercase');
  });

  it('should reject password without lowercase', () => {
    // TC-UNIT-VAL-006
    const result = validatePassword('PASSWORD1');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('should reject password without number', () => {
    // TC-UNIT-VAL-007
    const result = validatePassword('Password');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('number');
  });
});
```

---

## 5. Integration Test Implementation

### 5.1 Registration Tests

**File:** `tests/integration/auth/registration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import { cleanupTestDatabase } from '../../helpers/dbHelper';

describe('User Registration API', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  it('should register new user successfully', async () => {
    // TC-INT-REG-001
    const userData = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('newuser@example.com');
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    // TC-INT-REG-002
    const userData = {
      email: 'existing@example.com',
      password: 'Password123',
    };

    // Register first time
    await request(app).post('/api/auth/register').send(userData);

    // Try to register again
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Email already exists');
    expect(response.body.code).toBe('AUTH-002');
  });

  it('should reject invalid email', async () => {
    // TC-INT-REG-003
    const userData = {
      email: 'invalid-email',
      password: 'Password123',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid email');
  });

  it('should reject weak password', async () => {
    // TC-INT-REG-004
    const userData = {
      email: 'user@example.com',
      password: 'weak',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Password');
    expect(response.body.code).toBe('AUTH-006');
  });
});
```

### 5.2 Login Tests

**File:** `tests/integration/auth/login.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser, cleanupTestDatabase } from '../../helpers/dbHelper';

describe('User Login API', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  it('should login successfully with valid credentials', async () => {
    // TC-INT-LOGIN-001
    await createTestUser({
      email: 'user@example.com',
      password: 'Password123',
      emailVerified: true,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe('user@example.com');
  });

  it('should reject invalid credentials', async () => {
    // TC-INT-LOGIN-002
    await createTestUser({
      email: 'user@example.com',
      password: 'Password123',
      emailVerified: true,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
    expect(response.body.code).toBe('AUTH-001');
  });

  it('should reject unverified email', async () => {
    // TC-INT-LOGIN-003
    await createTestUser({
      email: 'unverified@example.com',
      password: 'Password123',
      emailVerified: false,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unverified@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Email not verified');
    expect(response.body.code).toBe('AUTH-003');
  });
});
```

---

## 6. E2E Test Implementation

### 6.1 Guest Journey Test

**File:** `tests/e2e/guest/guestJourney.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Guest User Journey', () => {
  test('should complete guest browsing flow', async ({ page, context }) => {
    // TC-E2E-GUEST-001
    
    // Clear storage to simulate new guest
    await context.clearCookies();
    await page.goto('/');

    // Verify guest session created
    const guestId = await page.evaluate(() => localStorage.getItem('guest_id'));
    expect(guestId).toBeTruthy();

    // Browse products
    await page.click('text=Shop Now');
    await expect(page).toHaveURL(/\/products/);

    // Add item to cart
    await page.click('.product-card:first-child');
    await page.click('button:has-text("Add to Cart")');
    
    // Verify cart updated
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1');

    // View cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Verify cart persists on refresh
    await page.reload();
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Attempt checkout
    await page.click('button:has-text("Checkout")');
    
    // Verify prompted to login/register
    await expect(page.locator('text=Please login or register to checkout')).toBeVisible();
  });
});
```

### 6.2 Registration Flow Test

**File:** `tests/e2e/auth/registration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete registration successfully', async ({ page }) => {
    // TC-E2E-REG-001
    
    await page.goto('/');
    
    // Navigate to registration
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/\/register/);

    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'Password123');
    await page.fill('[name="name"]', 'New User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirected to home (logged in)
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('New User');

    // Verify verification message
    await expect(page.locator('text=Please verify your email')).toBeVisible();
  });

  test('should migrate guest cart on registration', async ({ page, context }) => {
    // TC-E2E-REG-002
    
    // Clear storage
    await context.clearCookies();
    await page.goto('/');

    // Add items to cart as guest
    await page.goto('/products');
    await page.click('.product-card:nth-child(1)');
    await page.click('button:has-text("Add to Cart")');
    await page.goto('/products');
    await page.click('.product-card:nth-child(2)');
    await page.click('button:has-text("Add to Cart")');

    // Verify guest cart
    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Register
    await page.goto('/register');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'Password123');
    await page.click('button[type="submit"]');

    // Verify cart migrated
    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Verify localStorage cleared
    const guestCart = await page.evaluate(() => localStorage.getItem('guest_cart'));
    expect(guestCart).toBeNull();
  });
});
```

---

## 7. Performance Test Implementation

### 7.1 Concurrent Logins Test

**File:** `tests/performance/load/concurrentLogins.k6.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// TC-PERF-001

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 1000 },  // Ramp up to 1000 users
    { duration: '2m', target: 1000 },  // Stay at 1000 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% of requests < 2s
    errors: ['rate<0.001'],             // Error rate < 0.1%
  },
};

export default function () {
  const payload = JSON.stringify({
    email: `user${__VU}@example.com`,
    password: 'Password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post('http://localhost:5000/api/auth/login', payload, params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  }) || errorRate.add(1);

  sleep(1);
}
```

---

## 8. Security Test Implementation

### 8.1 Brute Force Protection Test

**File:** `tests/security/auth/bruteForce.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser, cleanupTestDatabase } from '../../helpers/dbHelper';

describe('Brute Force Protection', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  it('should lock account after 5 failed attempts', async () => {
    // TC-SEC-AUTH-001
    await createTestUser({
      email: 'user@example.com',
      password: 'Password123',
      emailVerified: true,
    });

    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword',
        });
    }

    // 6th attempt should be locked
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123', // Correct password
      });

    expect(response.status).toBe(423); // Locked
    expect(response.body.error).toBe('Account locked');
  });
});
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 9.2 NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:performance": "k6 run tests/performance/load/*.k6.js",
    "test:security": "vitest run tests/security",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 10. Best Practices

### 10.1 Test Organization
- ✅ One test file per feature/module
- ✅ Group related tests with `describe` blocks
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)

### 10.2 Test Data
- ✅ Use fixtures for reusable test data
- ✅ Use faker for random data generation
- ✅ Clean up test data after each test
- ✅ Avoid hard-coded values

### 10.3 Assertions
- ✅ One assertion per test (when possible)
- ✅ Use specific matchers
- ✅ Test both positive and negative cases
- ✅ Verify error messages and codes

### 10.4 Performance
- ✅ Run tests in parallel when possible
- ✅ Use test.concurrent for independent tests
- ✅ Mock external services
- ✅ Optimize database queries

---

**End of Test Implementation Guide**
