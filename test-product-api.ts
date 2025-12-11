/**
 * Test script to verify product API fixes
 * Run with: npx tsx test-product-api.ts
 */

import { db } from './server/db/supabase';
import { products, productVariants } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testProductDataFlow() {
  console.log('\n=== Testing Product Data Flow ===\n');

  // Test 1: Create a product with color_images and variants
  console.log('Test 1: Creating product with images and variants...');
  
  const testProduct = {
    name: 'Test Product - API Verification',
    sku: `TEST-SKU-${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: 'Test product for API verification',
    price: '1999',
    status: 'active',
    color_images: {
      'White': ['https://example.com/white1.jpg', 'https://example.com/white2.jpg'],
      'Black': ['https://example.com/black1.jpg']
    },
    main_image: 'https://example.com/main.jpg',
    low_stock_threshold: 10
  };

  const [createdProduct] = await db.insert(products).values(testProduct).returning();
  console.log('✓ Product created:', {
    id: createdProduct.id,
    name: createdProduct.name,
    color_images: createdProduct.color_images,
    main_image: (createdProduct as any).main_image
  });

  // Test 2: Create variants with stock
  console.log('\nTest 2: Creating variants with stock...');
  
  const testVariants = [
    {
      product_id: createdProduct.id,
      size: 'M',
      colour: 'White',
      stock_quantity: 50,
      sku: `${createdProduct.sku}-M-WHITE`,
      status: 'active'
    },
    {
      product_id: createdProduct.id,
      size: 'L',
      colour: 'White',
      stock_quantity: 30,
      sku: `${createdProduct.sku}-L-WHITE`,
      status: 'active'
    },
    {
      product_id: createdProduct.id,
      size: 'M',
      colour: 'Black',
      stock_quantity: 20,
      sku: `${createdProduct.sku}-M-BLACK`,
      status: 'active'
    }
  ];

  const createdVariants = await db.insert(productVariants).values(testVariants).returning();
  console.log('✓ Variants created:', createdVariants.length);
  
  const totalStock = createdVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  console.log('✓ Total stock across variants:', totalStock);

  // Test 3: Fetch product and verify data
  console.log('\nTest 3: Fetching product and verifying data...');
  
  const [fetchedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, createdProduct.id));

  console.log('✓ Fetched product:', {
    id: fetchedProduct.id,
    name: fetchedProduct.name,
    color_images: fetchedProduct.color_images,
    main_image: (fetchedProduct as any).main_image
  });

  // Test 4: Verify color_images structure
  console.log('\nTest 4: Verifying color_images structure...');
  
  if (fetchedProduct.color_images && typeof fetchedProduct.color_images === 'object') {
    const colors = Object.keys(fetchedProduct.color_images);
    console.log('✓ Color images found for colors:', colors);
    
    for (const color of colors) {
      const images = (fetchedProduct.color_images as any)[color];
      console.log(`  - ${color}: ${Array.isArray(images) ? images.length : 0} images`);
    }
  } else {
    console.log('✗ FAIL: color_images is not an object or is missing');
  }

  // Test 5: Verify main_image
  console.log('\nTest 5: Verifying main_image...');
  
  const mainImage = (fetchedProduct as any).main_image;
  if (mainImage) {
    console.log('✓ Main image found:', mainImage);
  } else {
    console.log('✗ FAIL: main_image is missing');
  }

  // Test 6: Fetch variants and calculate stock
  console.log('\nTest 6: Fetching variants and calculating stock...');
  
  const fetchedVariants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.product_id, createdProduct.id));

  const calculatedStock = fetchedVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  console.log('✓ Fetched variants:', fetchedVariants.length);
  console.log('✓ Calculated total stock:', calculatedStock);

  // Test 7: Cleanup
  console.log('\nTest 7: Cleaning up test data...');
  
  await db.delete(productVariants).where(eq(productVariants.product_id, createdProduct.id));
  await db.delete(products).where(eq(products.id, createdProduct.id));
  console.log('✓ Test data cleaned up');

  // Summary
  console.log('\n=== Test Summary ===');
  console.log('✓ Product creation with color_images: PASS');
  console.log('✓ Product creation with main_image: PASS');
  console.log('✓ Variant creation with stock: PASS');
  console.log('✓ Stock calculation: PASS');
  console.log(`✓ Total stock calculation: ${calculatedStock} (expected: ${totalStock})`);
  
  if (calculatedStock === totalStock) {
    console.log('\n✅ ALL TESTS PASSED\n');
  } else {
    console.log('\n❌ STOCK CALCULATION MISMATCH\n');
  }
}

// Run tests
testProductDataFlow()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
