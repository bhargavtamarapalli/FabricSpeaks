/**
 * Test Database Setup Script
 * Wipes and seeds test database with known test data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestDatabase() {
  console.log('\n🗄️  SETTING UP TEST DATABASE\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Clean up existing test data
    console.log('1. Cleaning up existing test data...');
    
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('wishlist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   ✅ Test data cleaned\n');
    
    // 2. Seed test products (if not already present)
    console.log('2. Seeding test products...');
    
    const testProducts = [
      {
        id: 'test-product-1',
        name: 'Test Silk Saree',
        slug: 'test-silk-saree',
        description: 'Test product for automated testing',
        price: '5000',
        stock_quantity: 10,
        status: 'active',
        category_id: null,
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
      },
      {
        id: 'test-product-2',
        name: 'Test Cotton Fabric',
        slug: 'test-cotton-fabric',
        description: 'Test product for automated testing',
        price: '500',
        stock_quantity: 50,
        status: 'active',
        category_id: null,
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
      },
      {
        id: 'test-product-out-of-stock',
        name: 'Out of Stock Product',
        slug: 'out-of-stock-product',
        description: 'Test product with zero stock',
        price: '1000',
        stock_quantity: 0,
        status: 'active',
        category_id: null,
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
      },
      {
        id: 'test-product-limited',
        name: 'Limited Stock Product',
        slug: 'limited-stock-product',
        description: 'Test product with limited stock',
        price: '2000',
        stock_quantity: 2,
        status: 'active',
        category_id: null,
        brand: 'Test Brand',
        images: ['https://via.placeholder.com/400'],
      },
    ];
    
    for (const product of testProducts) {
      const { error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'id' });
      
      if (error) {
        console.error(`   ❌ Failed to seed product: ${product.name}`, error);
      }
    }
    
    console.log(`   ✅ Seeded ${testProducts.length} test products\n`);
    
    console.log('═'.repeat(60));
    console.log('\n✅ TEST DATABASE SETUP COMPLETE\n');
    
  } catch (error: any) {
    console.error('\n❌ FAILED TO SETUP TEST DATABASE');
    console.error(error);
    process.exit(1);
  }
}

setupTestDatabase();
