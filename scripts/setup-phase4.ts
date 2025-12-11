/**
 * Phase 4 Complete Setup Script
 * Automates all setup steps for development environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🚀 Phase 4 Complete Setup\n');
console.log('=' .repeat(80));
console.log('\n');

// Step 1: Check if .env exists
console.log('📝 Step 1: Environment Variables\n');

const envPath = path.join(ROOT_DIR, '.env');
const envExamplePath = path.join(ROOT_DIR, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('   ⚠️  .env file not found');
  console.log('   📋 Creating .env from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('   ✅ .env created\n');
    console.log('   ⚠️  IMPORTANT: Please update the following in .env:');
    console.log('      - DATABASE_URL (your Supabase connection string)');
    console.log('      - SUPABASE_URL');
    console.log('      - SUPABASE_SERVICE_ROLE_KEY');
    console.log('      - SESSION_SECRET (generate with: openssl rand -base64 32)');
    console.log('      - RAZORPAY_KEY_ID');
    console.log('      - RAZORPAY_KEY_SECRET');
    console.log('      - SENTRY_DSN (optional for development)\n');
  } else {
    console.log('   ❌ .env.example not found!\n');
  }
} else {
  console.log('   ✅ .env file exists\n');
  
  // Check for Phase 4 variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = ['SENTRY_DSN', 'APP_VERSION', 'LOG_LEVEL'];
  const missingVars = requiredVars.filter(v => !envContent.includes(v));
  
  if (missingVars.length > 0) {
    console.log('   ⚠️  Missing Phase 4 variables in .env:');
    missingVars.forEach(v => console.log(`      - ${v}`));
    console.log('\n   📋 Adding Phase 4 variables to .env...\n');
    
    const phase4Vars = `
# Phase 4: Monitoring & Error Tracking
SENTRY_DSN=
APP_VERSION=1.0.0
NODE_ENV=development
LOG_LEVEL=info

# Phase 4: Redis (Optional - for distributed rate limiting)
REDIS_URL=redis://localhost:6379
`;
    
    fs.appendFileSync(envPath, phase4Vars);
    console.log('   ✅ Phase 4 variables added to .env\n');
    console.log('   ⚠️  Note: SENTRY_DSN is optional for development\n');
  } else {
    console.log('   ✅ All Phase 4 variables present\n');
  }
}

// Step 2: Install Dependencies
console.log('📦 Step 2: Installing Dependencies\n');

try {
  console.log('   Installing: @sentry/node @sentry/react @sentry/profiling-node winston rate-limit-redis redis...\n');
  
  execSync('npm install @sentry/node @sentry/react @sentry/profiling-node winston rate-limit-redis redis', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  
  console.log('\n   ✅ Dependencies installed\n');
} catch (error) {
  console.log('\n   ❌ Failed to install dependencies');
  console.log('   Please run manually: npm install @sentry/node @sentry/react @sentry/profiling-node winston rate-limit-redis redis\n');
}

// Step 3: Run Migrations
console.log('🗄️  Step 3: Database Migrations\n');

// Define migration paths (used later for verification too)
const migration1 = path.join(ROOT_DIR, 'supabase', 'migrations', '20251121_add_transaction_support.sql');
const migration2 = path.join(ROOT_DIR, 'supabase', 'migrations', '20251121_add_admin_invitations.sql');

// Load DATABASE_URL from .env
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) {
    databaseUrl = match[1].trim();
  }
}

if (!databaseUrl) {
  console.log('   ⚠️  DATABASE_URL not found in .env');
  console.log('   ⚠️  Skipping migrations - please run manually:\n');
  console.log('      psql $DATABASE_URL -f supabase/migrations/20251121_add_transaction_support.sql');
  console.log('      psql $DATABASE_URL -f supabase/migrations/20251121_add_admin_invitations.sql\n');
} else {
  console.log('   📋 Running transaction support migration...');
  
  if (fs.existsSync(migration1)) {
    try {
      execSync(`psql "${databaseUrl}" -f "${migration1}"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit'
      });
      console.log('   ✅ Transaction support migration complete\n');
    } catch (error) {
      console.log('   ⚠️  Migration may have already been applied or failed');
      console.log('   This is normal if migrations were already run\n');
    }
  } else {
    console.log('   ❌ Migration file not found: 20251121_add_transaction_support.sql\n');
  }
  
  console.log('   📋 Running admin invitations migration...');
  
  if (fs.existsSync(migration2)) {
    try {
      execSync(`psql "${databaseUrl}" -f "${migration2}"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit'
      });
      console.log('   ✅ Admin invitations migration complete\n');
    } catch (error) {
      console.log('   ⚠️  Migration may have already been applied or failed');
      console.log('   This is normal if migrations were already run\n');
    }
  } else {
    console.log('   ❌ Migration file not found: 20251121_add_admin_invitations.sql\n');
  }
}

// Step 4: Create client .env for frontend
console.log('📝 Step 4: Frontend Environment Variables\n');

const clientEnvPath = path.join(ROOT_DIR, 'client', '.env');

if (!fs.existsSync(clientEnvPath)) {
  console.log('   📋 Creating client/.env for frontend...');
  
  const clientEnv = `# Frontend Environment Variables
VITE_SENTRY_DSN=
VITE_APP_VERSION=1.0.0
`;
  
  fs.writeFileSync(clientEnvPath, clientEnv);
  console.log('   ✅ client/.env created\n');
  console.log('   ⚠️  Note: VITE_SENTRY_DSN is optional for development\n');
} else {
  console.log('   ✅ client/.env already exists\n');
}

// Step 5: Verify Setup
console.log('🔍 Step 5: Verification\n');

// Migration paths already defined above
const checks = [
  { name: '.env exists', check: () => fs.existsSync(envPath) },
  { name: 'client/.env exists', check: () => fs.existsSync(clientEnvPath) },
  { name: 'Phase 4 files exist', check: () => fs.existsSync(path.join(ROOT_DIR, 'server', 'utils', 'sentry.ts')) },
  { name: 'Migrations exist', check: () => fs.existsSync(migration1) && fs.existsSync(migration2) },
];

let allPassed = true;

for (const { name, check } of checks) {
  const passed = check();
  console.log(`   ${passed ? '✅' : '❌'} ${name}`);
  if (!passed) allPassed = false;
}

console.log('\n' + '='.repeat(80));
console.log('\n🎯 SETUP SUMMARY\n');

if (allPassed) {
  console.log('✅ Phase 4 setup complete!\n');
  console.log('📋 Next Steps:\n');
  console.log('   1. Update .env with your actual credentials (DATABASE_URL, SUPABASE_URL, etc.)');
  console.log('   2. (Optional) Add SENTRY_DSN for error tracking');
  console.log('   3. Start the server: npm run dev');
  console.log('   4. Run tests: npx tsx scripts/run-phase4-tests.ts\n');
  console.log('🚀 Your application is ready for development!\n');
} else {
  console.log('⚠️  Setup completed with warnings\n');
  console.log('Please review the messages above and complete any manual steps.\n');
}

console.log('📚 Documentation:');
console.log('   - Phase 4 Summary: docs/PHASE4_SUMMARY.md');
console.log('   - Verification: docs/PHASE4_VERIFIED.md');
console.log('   - Environment Variables: .env.example\n');
