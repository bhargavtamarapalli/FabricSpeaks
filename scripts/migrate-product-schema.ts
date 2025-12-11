/**
 * Migration Script: Migrate product schema from old to new format
 * 
 * Old columns: is_on_sale, images, returns_policy, shipping_info
 * New columns: color_images, sale_start_at, sale_end_at
 * 
 * This script:
 * 1. Migrates images array to color_images object format
 * 2. Adds sale_start_at and sale_end_at columns
 * 3. Drops old unused columns
 */

// Load environment variables first
import '../server/env';
import { db } from '../server/db/supabase';
import { sql } from 'drizzle-orm';

async function migrateProductSchema() {
  console.log('Starting product schema migration...');

  try {
    // Step 1: Add new columns if they don't exist
    console.log('Step 1: Adding new columns...');
    await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS sale_start_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sale_end_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}'::jsonb;
    `);

    // Step 2: Migrate images data to color_images format
    console.log('Step 2: Migrating images to color_images...');
    await db.execute(sql`
      UPDATE products
      SET color_images = 
        CASE 
          WHEN images IS NOT NULL AND jsonb_array_length(images) > 0 THEN
            jsonb_build_object('default', images)
          ELSE
            '{}'::jsonb
        END
      WHERE color_images = '{}'::jsonb OR color_images IS NULL;
    `);

    // Step 3: Drop old columns
    console.log('Step 3: Dropping old columns...');
    await db.execute(sql`
      ALTER TABLE products 
      DROP COLUMN IF EXISTS is_on_sale,
      DROP COLUMN IF EXISTS images,
      DROP COLUMN IF EXISTS returns_policy,
      DROP COLUMN IF EXISTS shipping_info;
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateProductSchema()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
