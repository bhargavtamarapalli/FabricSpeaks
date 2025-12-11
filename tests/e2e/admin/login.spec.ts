import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
  });

  test('should successfully login as admin and navigate to dashboard', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on login/account button
    await page.click('button:has-text("Login"), a:has-text("Login")');

    // Fill in admin credentials
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Verify we're on the admin dashboard
    expect(page.url()).toContain('/admin');

    // Verify dashboard elements are visible
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|overview/i })).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on login button
    await page.click('button:has-text("Login"), a:has-text("Login")');

    // Fill in invalid credentials
    await page.fill('input[name="username"], input[type="text"]', 'invaliduser');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Products page from dashboard', async ({ page }) => {
    // Login first
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Login"), a:has-text("Login")');
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Click on Products navigation link
    await page.click('a:has-text("Products"), button:has-text("Products")');

    // Verify we're on the products page
    await expect(page.locator('h1, h2').filter({ hasText: /products/i })).toBeVisible({ timeout: 5000 });
  });
});
