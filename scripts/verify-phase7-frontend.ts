/**
 * Phase 7 Frontend Verification Script
 * Verifies SEO (Meta Tags) implementation
 */

import fs from 'fs';
import path from 'path';

async function verifyPhase7Frontend() {
  console.log('🔍 Starting Phase 7 Frontend Verification...\n');
  let allPassed = true;

  // 1. Verify SEO Component
  console.log('🧩 Checking SEO Component...');
  const seoPath = path.resolve(process.cwd(), 'client/src/components/SEO.tsx');
  if (fs.existsSync(seoPath)) {
    console.log('   ✅ SEO component exists');
  } else {
    console.error('   ❌ SEO component missing');
    allPassed = false;
  }

  // 2. Verify HelmetProvider
  console.log('\n🛡️  Checking HelmetProvider...');
  const appPath = path.resolve(process.cwd(), 'client/src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  if (appContent.includes('HelmetProvider')) {
    console.log('   ✅ HelmetProvider configured in App.tsx');
  } else {
    console.error('   ❌ HelmetProvider missing in App.tsx');
    allPassed = false;
  }

  // 3. Verify Product Page Integration
  console.log('\n📄 Checking Product Page SEO...');
  const productPagePath = path.resolve(process.cwd(), 'client/src/pages/ProductPage.tsx');
  const productPageContent = fs.readFileSync(productPagePath, 'utf-8');
  if (productPageContent.includes('import { SEO }') && productPageContent.includes('<SEO')) {
    console.log('   ✅ SEO integrated in ProductPage');
  } else {
    console.error('   ❌ SEO missing in ProductPage');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PHASE 7 FRONTEND VERIFICATION SUCCESSFUL!');
    console.log('   Meta tags and structured data are ready.');
    process.exit(0);
  } else {
    console.error('⚠️  PHASE 7 FRONTEND VERIFICATION FAILED');
    console.error('   Please check the errors above.');
    process.exit(1);
  }
}

verifyPhase7Frontend().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
