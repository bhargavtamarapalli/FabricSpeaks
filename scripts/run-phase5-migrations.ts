/**
 * Phase 5 Database Migrations Runner
 * Runs all Phase 5 SQL migrations using the postgres client
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

// Load environment from server/env
import '../server/env.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Please set it in your .env file');
  process.exit(1);
}

async function runMigration(filePath: string, description: string) {
  console.log(`\n📄 Running migration: ${description}`);
  console.log(`   File: ${filePath}`);
  
  try {
    // Read the SQL file
    const sql = readFileSync(filePath, 'utf-8');
    
    // Create postgres client
    const db = postgres(DATABASE_URL, {
      max: 1,
      ssl: DATABASE_URL.includes('.supabase.co') ? { rejectUnauthorized: false } : false,
    });
    
    // Execute the migration
    await db.unsafe(sql);
    
    console.log(`✅ Migration completed successfully: ${description}`);
    
    // Close connection
    await db.end();
  } catch (error) {
    console.error(`❌ Migration failed: ${description}`);
    console.error(error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Phase 5 Database Migrations...\n');
  console.log(`📊 Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'localhost'}`);
  
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  
  const migrations = [
    {
      file: join(migrationsDir, '20251121_phase5_database_optimization.sql'),
      description: 'Database Optimization (Indexes & Connection Pooling)',
    },
    {
      file: join(migrationsDir, '20251121_phase5_fulltext_search.sql'),
      description: 'Full-Text Search Implementation',
    },
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    try {
      await runMigration(migration.file, migration.description);
      successCount++;
    } catch (error) {
      failCount++;
      console.error(`\n⚠️  Continuing with remaining migrations...\n`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${migrations.length}`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All Phase 5 migrations completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start Redis: npm run db:up');
    console.log('   2. Configure .env with Redis and Cloudinary credentials');
    console.log('   3. Start the application: npm run dev');
    console.log('   4. Test the new features!');
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error running migrations:');
  console.error(error);
  process.exit(1);
});
