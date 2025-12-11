#!/usr/bin/env node

/**
 * Phase 4 Installation Script
 * Automates the installation and setup of Phase 4 features
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  log(`\n${colors.cyan}→ ${description}...${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
    log(`${colors.green}✅ ${description} - SUCCESS${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
    return false;
  }
}

function checkFile(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function createDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, colors.green);
  }
}

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (y/n): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  log('\n' + '='.repeat(70), colors.bright);
  log('  PHASE 4 INSTALLATION SCRIPT', colors.bright);
  log('  Production Blockers - Automated Setup', colors.bright);
  log('='.repeat(70) + '\n', colors.bright);

  // Step 1: Check prerequisites
  log('\n📋 Step 1: Checking Prerequisites', colors.yellow);
  
  const hasPackageJson = checkFile('package.json');
  const hasEnvFile = checkFile('.env');
  const hasDatabaseUrl = process.env.DATABASE_URL !== undefined;

  if (!hasPackageJson) {
    log('❌ package.json not found. Are you in the project root?', colors.red);
    process.exit(1);
  }

  if (!hasEnvFile) {
    log('⚠️  .env file not found. You may need to create one.', colors.yellow);
  }

  if (!hasDatabaseUrl && !hasEnvFile) {
    log('⚠️  DATABASE_URL not set. Migration may fail.', colors.yellow);
  }

  log('✅ Prerequisites check complete', colors.green);

  // Step 2: Install dependencies
  log('\n📦 Step 2: Installing Dependencies', colors.yellow);
  
  const shouldInstall = await promptUser('Install winston, redis, and rate-limit-redis?');
  
  if (shouldInstall) {
    const installSuccess = runCommand(
      'npm install winston redis rate-limit-redis',
      'Installing dependencies'
    );

    if (!installSuccess) {
      log('⚠️  Dependency installation failed. You may need to install manually.', colors.yellow);
    }
  } else {
    log('⏭️  Skipping dependency installation', colors.yellow);
  }

  // Step 3: Create directories
  log('\n📁 Step 3: Creating Directories', colors.yellow);
  
  createDirectory('logs');
  createDirectory('reports');
  createDirectory('server/config');
  createDirectory('server/services');
  createDirectory('tests/unit');

  // Step 4: Run database migration
  log('\n🗄️  Step 4: Database Migration', colors.yellow);
  
  const shouldMigrate = await promptUser('Run database migration?');
  
  if (shouldMigrate) {
    const migrationFile = 'supabase/migrations/20251121_add_transaction_support.sql';
    
    if (!checkFile(migrationFile)) {
      log(`❌ Migration file not found: ${migrationFile}`, colors.red);
    } else {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        log('❌ DATABASE_URL not set. Cannot run migration.', colors.red);
        log('Set DATABASE_URL in .env and run migration manually:', colors.yellow);
        log(`psql $DATABASE_URL -f ${migrationFile}`, colors.cyan);
      } else {
        const migrateSuccess = runCommand(
          `psql ${databaseUrl} -f ${migrationFile}`,
          'Running database migration'
        );

        if (!migrateSuccess) {
          log('⚠️  Migration failed. You may need to run it manually.', colors.yellow);
        }
      }
    }
  } else {
    log('⏭️  Skipping database migration', colors.yellow);
  }

  // Step 5: Update environment variables
  log('\n🔧 Step 5: Environment Variables', colors.yellow);
  
  const shouldUpdateEnv = await promptUser('Add recommended environment variables to .env?');
  
  if (shouldUpdateEnv) {
    const envPath = '.env';
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const newVars = `
# Phase 4 Configuration (added by installation script)
# Redis (optional - falls back to memory if not set)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug

# Session Secret (change this in production!)
SESSION_SECRET=change-this-in-production-${Math.random().toString(36).substring(7)}
`;

    if (!envContent.includes('Phase 4 Configuration')) {
      fs.appendFileSync(envPath, newVars);
      log('✅ Environment variables added to .env', colors.green);
      log('⚠️  Remember to change SESSION_SECRET in production!', colors.yellow);
    } else {
      log('ℹ️  Environment variables already exist in .env', colors.blue);
    }
  } else {
    log('⏭️  Skipping environment variable setup', colors.yellow);
  }

  // Step 6: Run tests
  log('\n🧪 Step 6: Running Tests', colors.yellow);
  
  const shouldTest = await promptUser('Run Phase 4 tests?');
  
  if (shouldTest) {
    const testSuccess = runCommand(
      'tsx scripts/run-phase4-tests.ts',
      'Running Phase 4 tests'
    );

    if (!testSuccess) {
      log('⚠️  Some tests failed. Check the output above.', colors.yellow);
    }
  } else {
    log('⏭️  Skipping tests', colors.yellow);
  }

  // Summary
  log('\n' + '='.repeat(70), colors.bright);
  log('  INSTALLATION COMPLETE!', colors.bright);
  log('='.repeat(70) + '\n', colors.bright);

  log('📚 Next Steps:', colors.cyan);
  log('1. Review the implementation summary: docs/PHASE4_IMPLEMENTATION_SUMMARY.md', colors.reset);
  log('2. Check the quick start guide: docs/PHASE4_QUICK_START.md', colors.reset);
  log('3. Integrate middleware into server/index.ts', colors.reset);
  log('4. Update route handlers to use new services', colors.reset);
  log('5. Run manual tests', colors.reset);
  log('6. Deploy to staging', colors.reset);

  log('\n📄 Documentation:', colors.cyan);
  log('- Implementation Summary: docs/PHASE4_IMPLEMENTATION_SUMMARY.md', colors.reset);
  log('- Quick Start Guide: docs/PHASE4_QUICK_START.md', colors.reset);
  log('- Testing Guide: docs/PHASE4_TESTING_GUIDE.md', colors.reset);
  log('- Completion Summary: docs/PHASE4_COMPLETE.md', colors.reset);

  log('\n🎉 Phase 4 installation complete!', colors.green);
  log('Happy coding! 🚀\n', colors.green);
}

main().catch(error => {
  log(`\n❌ Installation failed: ${error.message}`, colors.red);
  process.exit(1);
});
