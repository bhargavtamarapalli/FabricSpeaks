/**
 * Phase 7 Verification Script
 * Verifies SEO (Sitemap) and Performance (Compression) features
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';

async function verifyPhase7() {
  console.log('🔍 Starting Phase 7 Verification...\n');
  let allPassed = true;

  // 1. Verify Dependencies
  console.log('📦 Checking Dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const required = ['react-helmet-async', 'xmlbuilder2', 'compression'];
    const missing = required.filter(dep => !deps[dep]);

    if (missing.length === 0) {
      console.log('   ✅ All dependencies installed');
    } else {
      console.error(`   ❌ Missing dependencies: ${missing.join(', ')}`);
      allPassed = false;
    }
  } catch (error) {
    console.error('   ❌ Dependency check failed:', error);
    allPassed = false;
  }

  // 2. Verify Sitemap Generation Code
  console.log('\n🗺️  Checking Sitemap Service...');
  const sitemapPath = path.resolve(process.cwd(), 'server/services/sitemap.ts');
  if (fs.existsSync(sitemapPath)) {
    console.log('   ✅ Sitemap service exists');
  } else {
    console.error('   ❌ Sitemap service missing');
    allPassed = false;
  }

  // 3. Verify Compression Middleware
  console.log('\n🚀 Checking Compression Middleware...');
  const indexPath = path.resolve(process.cwd(), 'server/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  if (indexContent.includes('compression()')) {
    console.log('   ✅ Compression middleware configured');
  } else {
    console.error('   ❌ Compression middleware not found in server/index.ts');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PHASE 7 (PARTIAL) VERIFICATION SUCCESSFUL!');
    console.log('   SEO and Performance basics are in place.');
    process.exit(0);
  } else {
    console.error('⚠️  PHASE 7 VERIFICATION FAILED');
    console.error('   Please check the errors above.');
    process.exit(1);
  }
}

verifyPhase7().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
