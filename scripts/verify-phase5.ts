/**
 * Phase 5 Verification Script
 * Verifies that all Phase 5 components are correctly implemented and functioning
 */

import 'dotenv/config'; // Load env vars FIRST
import { getCacheService, initializeCache } from '../server/services/cache';
import { getSearchService } from '../server/services/search';
import { encodeCursor, decodeCursor } from '../server/services/pagination';
import { db } from '../server/db/supabase';
import { sql } from 'drizzle-orm';

async function verifyPhase5() {
  console.log('🔍 Starting Phase 5 Verification...\n');
  let allPassed = true;

  // 1. Verify Redis Cache
  console.log('📦 Checking Redis Cache...');
  try {
    // Initialize connection
    const cache = await initializeCache();
    // Wait for connection - retry a few times
    for (let i = 0; i < 5; i++) {
      if (cache.isReady()) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (cache.isReady()) {
      console.log('   ✅ Redis connected successfully');
      
      // Test set/get
      await cache.set('verify-test', { status: 'ok' }, 60);
      const val = await cache.get<{ status: string }>('verify-test');
      
      if (val?.status === 'ok') {
        console.log('   ✅ Cache SET/GET working');
      } else {
        console.error('   ❌ Cache SET/GET failed');
        allPassed = false;
      }
    } else {
      console.error('   ❌ Redis not connected (timeout)');
      allPassed = false;
    }
  } catch (error) {
    console.error('   ❌ Redis check failed:', error);
    allPassed = false;
  }

  // 2. Verify Database & Indexes
  console.log('\n🗄️  Checking Database & Indexes...');
  try {
    // Check if indexes exist
    const result = await db.execute(sql`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'products' AND indexname = 'idx_products_search_vector'
    `);
    
    // Handle different result formats
    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    
    if (rows.length > 0) {
      console.log('   ✅ Full-text search index found');
    } else {
      console.error('   ❌ Full-text search index missing');
      console.log('      Result:', result); // Debug output
      allPassed = false;
    }
    
    // Check connection pooling config (indirectly via successful query)
    console.log('   ✅ Database connection working');
  } catch (error) {
    console.error('   ❌ Database check failed:', error);
    allPassed = false;
  }

  // 3. Verify Search Service
  console.log('\n🔎 Checking Search Service...');
  try {
    const searchService = getSearchService();
    // Perform a dummy search (should not throw)
    const results = await searchService.searchProducts({
      query: 'test',
      limit: 1,
      searchType: 'combined'
    });
    console.log(`   ✅ Search executed successfully (found ${results.length} results)`);
  } catch (error) {
    console.error('   ❌ Search service failed:', error);
    allPassed = false;
  }

  // 4. Verify Pagination Service
  console.log('\n📄 Checking Pagination Service...');
  try {
    const cursorData = { id: '123', date: '2025-01-01' };
    const encoded = encodeCursor(cursorData);
    const decoded = decodeCursor(encoded);
    
    if (decoded.id === cursorData.id && decoded.date === cursorData.date) {
      console.log('   ✅ Cursor encoding/decoding working');
    } else {
      console.error('   ❌ Cursor logic failed');
      allPassed = false;
    }
  } catch (error) {
    console.error('   ❌ Pagination check failed:', error);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PHASE 5 VERIFICATION SUCCESSFUL!');
    console.log('   All systems are go for launch.');
    process.exit(0);
  } else {
    console.error('⚠️  PHASE 5 VERIFICATION FAILED');
    console.error('   Please check the errors above.');
    process.exit(1);
  }
}

verifyPhase5().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
