
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars manually before importing anything else
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envPath });
} else {
  console.log('.env.local not found, trying .env...');
  dotenv.config();
}

async function migrate() {
  console.log("Starting migration...");
  
  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../server/db/supabase");
  const { sql } = await import("drizzle-orm");

  try {
    // Add phone column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN 
          ALTER TABLE profiles ADD COLUMN phone TEXT; 
          RAISE NOTICE 'Added phone column';
        END IF; 

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN 
          ALTER TABLE profiles ADD COLUMN avatar_url TEXT; 
          RAISE NOTICE 'Added avatar_url column';
        END IF;
      END $$;
    `);
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
