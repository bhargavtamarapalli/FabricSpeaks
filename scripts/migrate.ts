#!/usr/bin/env node
/**
 * Database Migration Manager
 * 
 * Usage:
 *   npm run migrate:generate -- "add_user_preferences"
 *   npm run migrate:up
 *   npm run migrate:down
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = DATABASE_URL.includes('.supabase.co');

// Configure SSL based on environment
const sslConfig = (() => {
  if (!isSupabase) return false;
  if (isProduction) return true;
  return { rejectUnauthorized: false }; // Dev only
})();

const sql = postgres(DATABASE_URL, {
  max: 1,
  ssl: sslConfig
});

const db = drizzle(sql);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../migrations')
    });
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
