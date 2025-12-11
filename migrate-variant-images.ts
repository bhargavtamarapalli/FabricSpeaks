// Load environment variables using the existing env loader
import './server/env';

import { db } from './server/db/supabase';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running migration: Add images to product_variants...');
    
    await db.execute(sql`
      ALTER TABLE product_variants 
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN product_variants.images IS 'Array of image URLs specific to this variant (e.g., different colors)'
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
