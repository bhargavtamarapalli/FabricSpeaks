import { test, expect } from '@playwright/test';

test.describe('Guest User Journey', () => {
  test('TC-E2E-GUEST-001: Complete guest browsing flow', async ({ page, context }) => {
    // Clear storage to simulate new guest
    await context.clearCookies();
    await page.goto('/');

    // Verify guest session created
    const guestId = await page.evaluate(() => localStorage.getItem('guest_id'));
    expect(guestId).toBeTruthy();
    expect(guestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Browse products
    await page.click('text=Shop Now');
    await expect(page).toHaveURL(/\/products|\/clothing/);

    // Add item to cart
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();
    
    // Wait for product page to load
    await page.waitForLoadState('networkidle');
    
    // Add to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await addToCartButton.click();
    
    // Verify cart updated
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');

    // View cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL(/\/cart/);
    
    // Verify cart has items
    const cartItems = page.locator('.cart-item');
    await expect(cartItems).toHaveCount(1);

    // Verify cart persists on page refresh
    await page.reload();
    await expect(cartItems).toHaveCount(1);

    // Attempt checkout
    const checkoutButton = page.locator('button:has-text("Checkout")');
    await checkoutButton.click();
    
    // Verify prompted to login/register
    await expect(page).toHaveURL(/\/login|\/register/);
  });

  test('should allow guest to browse products', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to products
    await page.goto('/products');
    
    // Verify products are displayed
    const products = page.locator('.product-card');
    await expect(products.first()).toBeVisible();
  });

  test('should allow guest to view product details', async ({ page }) => {
    await page.goto('/products');
    
    // Click on first product
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();
    
    // Verify product details page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('should persist guest cart across page navigation', async ({ page }) => {
    await page.goto('/');
    
    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');
    
    // Navigate away
    await page.goto('/');
    
    // Navigate back to cart
    await page.goto('/cart');
    
    // Verify item still in cart
    const cartItems = page.locator('.cart-item');
    await expect(cartItems).toHaveCount(1);
  });
});
