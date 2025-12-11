// Load environment variables using the existing env loader
import './server/env';

import { db } from './server/db/supabase';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running migration: Add color_images to products table...');
    
    await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}'::jsonb
    `);
    
    await db.execute(sql`
      COMMENT ON COLUMN products.color_images IS 'Map of Color -> Image URLs (e.g., {"Red": ["img1.jpg"], "Blue": ["img2.jpg"]})'
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
