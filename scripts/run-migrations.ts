/**
 * Run Phase 4 Migrations
 * Applies migrations without resetting the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

console.log('🗄️  Running Phase 4 Migrations\n');
console.log(`Database: ${DATABASE_URL}\n`);

async function runMigration(filePath: string, name: string) {
  console.log(`📋 Running: ${name}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ Migration file not found: ${filePath}\n`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`   ✅ ${name} completed successfully\n`);
    return true;
  } catch (error: any) {
    // Check if error is because migration already applied
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`   ⚠️  ${name} already applied (skipping)\n`);
      return true;
    }
    console.log(`   ❌ ${name} failed: ${error.message}\n`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  const migrations = [
    {
      file: path.join(ROOT_DIR, 'supabase', 'migrations', '20251121_add_transaction_support.sql'),
      name: 'Transaction Support'
    },
    {
      file: path.join(ROOT_DIR, 'supabase', 'migrations', '20251121_add_admin_invitations.sql'),
      name: 'Admin Invitations'
    }
  ];

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.name);
    if (!success) allSuccess = false;
  }

  console.log('='.repeat(60));
  if (allSuccess) {
    console.log('✅ All migrations completed successfully!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some migrations failed or were skipped\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Migration runner failed:', error);
  process.exit(1);
});
