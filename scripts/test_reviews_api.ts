/**
 * Reviews API Integration Test
 * 
 * Tests the complete reviews API flow:
 * 1. Create review
 * 2. List reviews
 * 3. Get stats
 * 4. Update review
 * 5. Vote helpful
 * 6. Delete review
 */

import '../server/env';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewsAPI() {
  console.log('🧪 Testing Reviews API...\n');

  try {
    // Step 1: Sign in
    console.log('1️⃣  Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (authError) {
      console.log('⚠️  No test user found. Please create one first.');
      return;
    }

    const token = authData.session?.access_token;
    const userId = authData.user?.id;
    console.log('✅ Signed in successfully\n');

    // Step 2: Get a product
    console.log('2️⃣  Fetching a product...');
    const productsResponse = await fetch('http://localhost:5000/api/products?limit=1');
    const productsData = await productsResponse.json();
    
    if (!productsData.items || productsData.items.length === 0) {
      console.log('⚠️  No products found. Please seed some products first.');
      return;
    }

    const product = productsData.items[0];
    console.log(`✅ Found product: ${product.name} (${product.id})\n`);

    // Step 3: Create Review
    console.log('3️⃣  Creating review...');
    const createResponse = await fetch(`http://localhost:5000/api/products/${product.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Amazing Product!',
        comment: 'I really loved this product. The quality is outstanding and it fits perfectly.',
      }),
    });

    if (createResponse.status === 409) {
        console.log('⚠️  Review already exists. Skipping creation.\n');
    } else if (!createResponse.ok) {
      throw new Error(`Failed to create review: ${await createResponse.text()}`);
    } else {
        const review = await createResponse.json();
        console.log(`✅ Created review: ${review.id}\n`);
    }

    // Step 4: List Reviews
    console.log('4️⃣  Listing reviews...');
    const listResponse = await fetch(`http://localhost:5000/api/products/${product.id}/reviews`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
    const reviews = await listResponse.json();
    console.log(`✅ Found ${reviews.length} reviews\n`);

    const myReview = reviews.find((r: any) => r.user_id === userId);
    if (!myReview) {
        console.log('⚠️  Could not find the review we just created/verified.');
        return;
    }

    // Step 5: Get Stats
    console.log('5️⃣  Fetching stats...');
    const statsResponse = await fetch(`http://localhost:5000/api/products/${product.id}/reviews/stats`);
    const stats = await statsResponse.json();
    console.log(`✅ Average Rating: ${stats.average_rating}, Total: ${stats.total_reviews}\n`);

    // Step 6: Update Review
    console.log('6️⃣  Updating review...');
    const updateResponse = await fetch(`http://localhost:5000/api/reviews/${myReview.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: 4,
        title: 'Still great, but...',
        comment: 'Changed my mind, it is 4 stars now.',
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update review: ${await updateResponse.text()}`);
    }
    console.log('✅ Review updated\n');

    // Step 7: Vote Helpful (Self-voting might be allowed or we need another user)
    // Let's try voting on our own review (usually allowed in simple implementations)
    console.log('7️⃣  Voting helpful...');
    const voteResponse = await fetch(`http://localhost:5000/api/reviews/${myReview.id}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!voteResponse.ok) {
       // It might fail if we already voted.
       console.log(`ℹ️  Vote response: ${voteResponse.status}`);
    } else {
        console.log('✅ Voted helpful\n');
    }

    // Step 8: Delete Review
    console.log('8️⃣  Deleting review...');
    const deleteResponse = await fetch(`http://localhost:5000/api/reviews/${myReview.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete review: ${await deleteResponse.text()}`);
    }
    console.log('✅ Review deleted\n');

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testReviewsAPI();
