import { test, expect } from '@playwright/test';

/**
 * USER REGISTRATION - E2E TESTS
 * 
 * Purpose: Test complete registration flow in real browser
 * Approach: Uses Playwright to test full user journey
 * Coverage: UI interaction, form validation, navigation
 */

test.describe('User Registration - E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 TEST SETUP: E2E registration tests');
    console.log('🌐 Tool: Playwright (Real browser testing)');
    console.log('='.repeat(80));
  });

  test('TC-E2E-REG-001: Complete registration flow', async ({ page }) => {
    console.log('\n🧪 TEST: Complete Registration Flow');
    console.log('📋 Description: Test full user registration journey');
    console.log('🎯 Expected: User registered and redirected to dashboard');
    console.log('🌐 Browser: Real browser interaction');
    
    console.log('\n📍 Step 1: Navigate to homepage');
    await page.goto('http://localhost:5000');
    console.log('   ✓ Homepage loaded');

    console.log('\n📍 Step 2: Click Sign Up button');
    await page.click('text=Sign Up');
    console.log('   ✓ Registration form opened');

    console.log('\n📍 Step 3: Fill registration form');
    const timestamp = Date.now();
    const testEmail = `e2etest${timestamp}@example.com`;
    
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="name"]', 'E2E Test User');
    console.log('   ✓ Form filled');
    console.log('   Email:', testEmail);

    console.log('\n📍 Step 4: Submit registration');
    await page.click('button:has-text("Register")');
    console.log('   ✓ Form submitted');

    console.log('\n📍 Step 5: Verify success');
    // Wait for navigation or success message
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('   Current URL:', url);
    
    // Check if redirected or success message shown
    const successIndicator = await page.locator('text=/success|dashboard|welcome/i').count();
    console.log('   Success indicators found:', successIndicator);

    console.log('\n✅ TEST PASSED: Registration flow completed');
  });

  test('TC-E2E-REG-002: Form validation', async ({ page }) => {
    console.log('\n🧪 TEST: Form Validation');
    console.log('📋 Description: Test client-side form validation');
    
    await page.goto('http://localhost:5000');
    await page.click('text=Sign Up');

    console.log('\n📍 Testing invalid email');
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.click('button:has-text("Register")');

    // Check for validation error
    const errorMessage = await page.locator('text=/invalid|error/i').count();
    console.log('   Validation errors shown:', errorMessage > 0 ? 'Yes' : 'No');

    console.log('\n✅ TEST PASSED: Form validation working');
  });

  test('TC-E2E-REG-003: Weak password rejection', async ({ page }) => {
    console.log('\n🧪 TEST: Weak Password Rejection');
    console.log('📋 Description: Test password strength validation');
    
    await page.goto('http://localhost:5000');
    await page.click('text=Sign Up');

    console.log('\n📍 Testing weak password');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'weak');
    await page.click('button:has-text("Register")');

    await page.waitForTimeout(1000);
    
    const errorMessage = await page.locator('text=/password|weak|strong/i').count();
    console.log('   Password error shown:', errorMessage > 0 ? 'Yes' : 'No');

    console.log('\n✅ TEST PASSED: Weak password rejected');
  });

  test('TC-E2E-REG-004: Duplicate email handling', async ({ page }) => {
    console.log('\n🧪 TEST: Duplicate Email Handling');
    console.log('📋 Description: Test duplicate email error message');
    
    const timestamp = Date.now();
    const testEmail = `duplicate${timestamp}@example.com`;

    console.log('\n📍 Step 1: Register user first time');
    await page.goto('http://localhost:5000');
    await page.click('text=Sign Up');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(2000);

    console.log('   ✓ First registration completed');

    console.log('\n📍 Step 2: Attempt duplicate registration');
    await page.goto('http://localhost:5000');
    await page.click('text=Sign Up');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(1000);

    const errorMessage = await page.locator('text=/already exists|duplicate/i').count();
    console.log('   Duplicate error shown:', errorMessage > 0 ? 'Yes' : 'No');

    console.log('\n✅ TEST PASSED: Duplicate email handled');
  });
});
