import { test, expect } from '@playwright/test';

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Login"), a:has-text("Login")');
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Navigate to Orders page
    await page.click('a:has-text("Orders"), button:has-text("Orders")');
    await page.waitForLoadState('networkidle');
  });

  test('should display orders list', async ({ page }) => {
    // Verify orders page is loaded
    await expect(page.locator('h1, h2').filter({ hasText: /orders/i })).toBeVisible({ timeout: 5000 });

    // Check if table or list of orders is visible
    const ordersTable = page.locator('table, [role="table"]');
    await expect(ordersTable).toBeVisible({ timeout: 5000 });
  });

  test('should open order details', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tr, [role="row"]', { timeout: 10000 });

    // Click on first order (if exists)
    const firstOrder = page.locator('table tr, [role="row"]').nth(1);
    
    if (await firstOrder.isVisible()) {
      await firstOrder.click();

      // Verify order details are shown (modal or new page)
      await expect(page.locator('text=/order details|order #|status/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update order status to Shipped', async ({ page }) => {
    // Wait for orders to load
    await page.waitForSelector('table tr, [role="row"]', { timeout: 10000 });

    // Click on first order
    const firstOrder = page.locator('table tr, [role="row"]').nth(1);
    
    if (await firstOrder.isVisible()) {
      await firstOrder.click();

      // Find and click status dropdown/select
      const statusSelect = page.locator('select[name*="status"], button:has-text("Status")');
      
      if (await statusSelect.isVisible()) {
        await statusSelect.click();

        // Select "Shipped" status
        await page.click('option:has-text("Shipped"), [role="option"]:has-text("Shipped")');

        // If tracking number is required, fill it
        const trackingInput = page.locator('input[name*="tracking"]');
        if (await trackingInput.isVisible()) {
          await trackingInput.fill('TRACK123456789');
        }

        // Click update/save button
        await page.click('button:has-text("Update"), button:has-text("Save")');

        // Verify success message or status update
        await expect(page.locator('text=/success|updated|shipped/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Look for filter/status dropdown
    const filterSelect = page.locator('select[name*="status"], select[name*="filter"]');
    
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      await page.click('option:has-text("Pending"), [role="option"]:has-text("Pending")');

      // Wait for filtered results
      await page.waitForLoadState('networkidle');

      // Verify filtered results are shown
      await expect(page.locator('table, [role="table"]')).toBeVisible();
    }
  });
});
