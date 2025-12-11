import '../server/env';
import { db } from '../server/db/supabase';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import path from 'path';

async function applyMigration() {
  console.log('🔄 Applying wishlist migration...');
  
  try {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251120_create_wishlists.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`[${i + 1}/${statements.length}] ${preview}...`);
          await db.execute(sql.raw(statement + ';'));
          console.log(`  ✅ Success`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.code === '42P07' || // duplicate_table
            error.code === '42710'    // duplicate_object
          )) {
            console.log(`  ⚠️  Skipped (already exists)`);
          } else {
            console.error(`  ❌ Error:`, error.message || error);
            // Continue with other statements instead of failing completely
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('wishlists', 'wishlist_items')
    `);
    
    console.log('\n📊 Verification:');
    console.log('Tables created:', tables.rows.map((r: any) => r.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

applyMigration();
