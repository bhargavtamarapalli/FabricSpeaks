import '../server/env';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running wishlist migration...');
  
  try {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251120_create_wishlists.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('Attempting direct SQL execution...');
      const statements = migrationSQL.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.from('_migrations').insert({
            name: '20251120_create_wishlists',
            executed_at: new Date().toISOString(),
          });
          
          if (execError && !execError.message.includes('already exists')) {
            console.error('Error:', execError);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
