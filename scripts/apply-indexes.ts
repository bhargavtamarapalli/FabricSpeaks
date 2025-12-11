/**
 * Database Migration Runner for Indexes
 * 
 * Applies database indexes and constraints.
 * 
 * Usage:
 *   npm run db:indexes
 * 
 * @module scripts/apply-indexes
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'fabricspeaks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// ============================================================================
// Migration Runner
// ============================================================================

async function runMigration(pool: Pool, sqlFile: string): Promise<void> {
  try {
    console.log(`\n📂 Reading migration: ${path.basename(sqlFile)}`);
    
    const sql = await fs.readFile(sqlFile, 'utf-8');
    
    // Remove comments and split by semicolons
    const statements = sql
      .split('\n')
     .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements`);
    
    const client = await pool.connect();
    
    try {
      console.log('🔄 Executing migration...');
      
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          await client.query(statement);
          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`  ✓ Processed ${successCount}/${statements.length} statements...`);
          }
        } catch (error: any) {
          // Skip if already exists
          if (error.code === '42P07' || error.code === '42710' || error.code === '23505') {
            skipCount++;
            continue;
          }
          
          console.error(`  ❌ Error:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n✅ Migration complete:`);
      console.log(`   Success: ${successCount} statements`);
      if (skipCount > 0) console.log(`   Skipped: ${skipCount} (already exist)`);
      if (errorCount > 0) console.log(`   Errors:  ${errorCount}`);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🗄️  Database Index Migration\n');
  
  const pool = new Pool(config);
  
  try {
    console.log('🔌 Testing connection...');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Connected\n');
    
    const indexFile = path.join(__dirname, '..', 'server', 'db', 'indexes.sql');
    await runMigration(pool, indexFile);
    
    console.log('\n🎉 Indexes applied successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
