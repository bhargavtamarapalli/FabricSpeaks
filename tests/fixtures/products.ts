/**
 * Test Fixtures - Products
 * Reusable test data for product-related tests
 */

export const TEST_PRODUCTS = {
  inStock: {
    id: 'test-product-1',
    name: 'Test Silk Saree',
    slug: 'test-silk-saree',
    description: 'Test product for automated testing',
    price: '5000',
    stock_quantity: 10,
    status: 'active',
    brand: 'Test Brand',
    images: ['https://via.placeholder.com/400'],
  },
  
  normalStock: {
    id: 'test-product-2',
    name: 'Test Cotton Fabric',
    slug: 'test-cotton-fabric',
    description: 'Test product for automated testing',
    price: '500',
    stock_quantity: 50,
    status: 'active',
    brand: 'Test Brand',
    images: ['https://via.placeholder.com/400'],
  },
  
  outOfStock: {
    id: 'test-product-out-of-stock',
    name: 'Out of Stock Product',
    slug: 'out-of-stock-product',
    description: 'Test product with zero stock',
    price: '1000',
    stock_quantity: 0,
    status: 'active',
    brand: 'Test Brand',
    images: ['https://via.placeholder.com/400'],
  },
  
  limitedStock: {
    id: 'test-product-limited',
    name: 'Limited Stock Product',
    slug: 'limited-stock-product',
    description: 'Test product with limited stock',
    price: '2000',
    stock_quantity: 2,
    status: 'active',
    brand: 'Test Brand',
    images: ['https://via.placeholder.com/400'],
  },
} as const;

export const TEST_PRODUCT_IDS = {
  IN_STOCK: 'test-product-1',
  NORMAL_STOCK: 'test-product-2',
  OUT_OF_STOCK: 'test-product-out-of-stock',
  LIMITED_STOCK: 'test-product-limited',
} as const;
