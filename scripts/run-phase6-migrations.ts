import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import '../server/env.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  const migrationFile = join(process.cwd(), 'supabase/migrations/20251121_add_payment_provider_id.sql');
  console.log(`Running migration: ${migrationFile}`);
  
  const sql = readFileSync(migrationFile, 'utf-8');
  const db = postgres(DATABASE_URL!, { 
    max: 1,
    ssl: DATABASE_URL!.includes('.supabase.co') ? { rejectUnauthorized: false } : false
  });
  
  try {
    await db.unsafe(sql);
    console.log('✅ Migration applied successfully');
  } catch (e) {
    console.error('❌ Migration failed', e);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
