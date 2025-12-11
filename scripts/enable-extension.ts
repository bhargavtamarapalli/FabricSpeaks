import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    console.log('Enabling pg_trgm extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    console.log('✅ Extension enabled');
  } catch (error) {
    console.error('❌ Failed to enable extension:', error);
  } finally {
    await sql.end();
  }
}

run();
