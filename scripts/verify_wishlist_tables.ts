import '../server/env';
import { db } from '../server/db/supabase';
import { sql } from 'drizzle-orm';

async function verifyTables() {
  console.log('🔍 Verifying wishlist tables...\n');
  
  try {
    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('wishlists', 'wishlist_items')
      ORDER BY table_name
    `);
    
    console.log('📊 Tables Found:');
    const tableResults = Array.isArray(tables) ? tables : (tables.rows || []);
    for (const row of tableResults as any[]) {
      console.log(`  ✅ ${row.table_name} (${row.column_count} columns)`);
    }
    
    // Check indexes
    const indexes = await db.execute(sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('wishlists', 'wishlist_items')
      ORDER BY tablename, indexname
    `);
    
    console.log('\n📑 Indexes Found:');
    const indexResults = Array.isArray(indexes) ? indexes : (indexes.rows || []);
    for (const row of indexResults as any[]) {
      console.log(`  ✅ ${row.tablename}.${row.indexname}`);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    process.exit(0);
  }
}

verifyTables();
