/**
 * Wishlist API Integration Test
 * 
 * Tests the complete wishlist API flow:
 * 1. Create wishlist
 * 2. Add items
 * 3. List items
 * 4. Remove items
 * 5. Delete wishlist
 */

import '../server/env';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWishlistAPI() {
  console.log('🧪 Testing Wishlist API...\n');

  try {
    // Step 1: Sign in (you'll need to create a test user first)
    console.log('1️⃣  Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (authError) {
      console.log('⚠️  No test user found. Please create one first.');
      console.log('   You can sign up through the app or run:');
      console.log('   supabase auth signup --email test@example.com --password testpassword123');
      return;
    }

    const token = authData.session?.access_token;
    console.log('✅ Signed in successfully\n');

    // Step 2: Create wishlist
    console.log('2️⃣  Creating wishlist...');
    const createResponse = await fetch('http://localhost:5000/api/wishlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Wishlist',
        is_default: true,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create wishlist: ${await createResponse.text()}`);
    }

    const wishlist = await createResponse.json();
    console.log(`✅ Created wishlist: ${wishlist.id}\n`);

    // Step 3: Get product to add
    console.log('3️⃣  Fetching a product...');
    const productsResponse = await fetch('http://localhost:5000/api/products?limit=1');
    const productsData = await productsResponse.json();
    
    if (!productsData.items || productsData.items.length === 0) {
      console.log('⚠️  No products found. Please seed some products first.');
      return;
    }

    const product = productsData.items[0];
    console.log(`✅ Found product: ${product.name}\n`);

    // Step 4: Add item to wishlist
    console.log('4️⃣  Adding item to wishlist...');
    const addItemResponse = await fetch(`http://localhost:5000/api/wishlists/${wishlist.id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        notes: 'Test item',
      }),
    });

    if (!addItemResponse.ok) {
      throw new Error(`Failed to add item: ${await addItemResponse.text()}`);
    }

    const item = await addItemResponse.json();
    console.log(`✅ Added item: ${item.id}\n`);

    // Step 5: Get wishlist with items
    console.log('5️⃣  Fetching wishlist with items...');
    const getWishlistResponse = await fetch(`http://localhost:5000/api/wishlists/${wishlist.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!getWishlistResponse.ok) {
      throw new Error(`Failed to get wishlist: ${await getWishlistResponse.text()}`);
    }

    const wishlistWithItems = await getWishlistResponse.json();
    console.log(`✅ Wishlist has ${wishlistWithItems.items.length} item(s)\n`);

    // Step 6: Remove item
    console.log('6️⃣  Removing item from wishlist...');
    const removeItemResponse = await fetch(
      `http://localhost:5000/api/wishlists/${wishlist.id}/items/${item.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!removeItemResponse.ok) {
      throw new Error(`Failed to remove item: ${await removeItemResponse.text()}`);
    }

    console.log('✅ Item removed\n');

    // Step 7: Delete wishlist
    console.log('7️⃣  Deleting wishlist...');
    const deleteResponse = await fetch(`http://localhost:5000/api/wishlists/${wishlist.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete wishlist: ${await deleteResponse.text()}`);
    }

    console.log('✅ Wishlist deleted\n');

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testWishlistAPI();
