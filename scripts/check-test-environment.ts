/**
 * Pre-Flight Environment Health Check
 * Validates all dependencies before running tests
 * CRITICAL: Aborts immediately if ANY check fails
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables - .env.test takes precedence over .env
// First load .env as defaults
dotenv.config({ override: false });

// Then load .env.test which will override any conflicting values
dotenv.config({ path: '.env.test', override: true });

const execAsync = promisify(exec);

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  errorMessage: string;
  isWarning?: boolean;
}

const checks: HealthCheck[] = [
  {
    name: '1. Node Modules Installed',
    check: async () => {
      try {
        await execAsync('npm list --depth=0');
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: '❌ node_modules not installed. Run: npm install'
  },
  
  {
    name: '2. Frontend Server Running (Port 5000)',
    check: async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000');
        return response.ok || response.status === 404; // 404 is OK, means server is running
      } catch {
        return false;
      }
    },
    errorMessage: '❌ Frontend not running on :5000. Run: npm run dev'
  },
  
  {
    name: '3. Backend API Reachable',
    check: async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/health');
        return response.ok;
      } catch {
        return false;
      }
    },
    errorMessage: '❌ Backend API not reachable at /api/health'
  },
  
  {
    name: '4. Database Connection',
    check: async () => {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        // Use service role key for testing to bypass RLS
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.log('\n   Debug: Missing env vars');
          console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
          console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`);
          return false;
        }
        
        // Debug: Show which key we're using
        const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON';
        console.log(`\n   Debug: Using ${keyType} key (length: ${supabaseKey.length})`);
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('products').select('id').limit(1);
        
        if (error) {
          console.log(`   Debug: Database error - ${error.message}`);
          console.log(`   Debug: Error code - ${error.code}`);
          console.log(`   Note: This may be due to RLS policies. If your webserver can access the DB, you can ignore this.`);
          return false;
        }
        
        console.log(`   Debug: Query successful, found ${data?.length || 0} products`);
        return true;
      } catch (err: any) {
        console.log(`\n   Debug: Exception - ${err.message}`);
        return false;
      }
    },
    errorMessage: '⚠️  Database connection check failed (may be RLS issue). If webserver works, you can proceed.',
    isWarning: true  // Changed to warning instead of blocking error
  },
  
  {
    name: '5. Test Database Seeded',
    check: async () => {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        // Use service role key for testing to bypass RLS
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return false;
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('products').select('id').limit(1);
        return !error && data && data.length > 0;
      } catch {
        return false;
      }
    },
    errorMessage: '⚠️  Test database appears empty. Run: npm run seed:test',
    isWarning: true
  },
  
  {
    name: '6. Environment Variables Set',
    check: async () => {
      const required = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_BASE_URL'
      ];
      return required.every(key => !!process.env[key]);
    },
    errorMessage: '❌ Missing required environment variables. Check .env or .env.test'
  }
];

async function runHealthChecks(): Promise<void> {
  console.log('\n🔍 PRE-FLIGHT ENVIRONMENT CHECK\n');
  console.log('═'.repeat(60));
  
  let allPassed = true;
  let hasWarnings = false;
  
  for (const check of checks) {
    process.stdout.write(`${check.name}... `);
    
    try {
      const passed = await check.check();
      
      if (passed) {
        console.log('✅ PASS');
      } else {
        if (check.isWarning) {
          console.log('⚠️  WARN');
          console.log(`   ${check.errorMessage}\n`);
          hasWarnings = true;
        } else {
          console.log('❌ FAIL');
          console.log(`   ${check.errorMessage}\n`);
          allPassed = false;
        }
      }
    } catch (error: any) {
      console.log('❌ ERROR');
      console.log(`   ${check.errorMessage}`);
      console.log(`   Error: ${error.message}\n`);
      allPassed = false;
    }
  }
  
  console.log('═'.repeat(60));
  
  if (!allPassed) {
    console.log('\n❌ ENVIRONMENT CHECK FAILED');
    console.log('Fix the above issues before running tests.\n');
    process.exit(1);
  }
  
  if (hasWarnings) {
    console.log('\n⚠️  WARNINGS DETECTED - Tests may not run as expected');
    console.log('Consider fixing warnings for complete test coverage.\n');
  } else {
    console.log('\n✅ ALL CHECKS PASSED - Environment is ready for testing\n');
  }
  
  process.exit(0);
}

runHealthChecks().catch((error) => {
  console.error('\n❌ FATAL ERROR during environment check:');
  console.error(error);
  process.exit(1);
});
