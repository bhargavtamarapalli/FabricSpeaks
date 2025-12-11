/**
 * Phase 7 Analytics Verification Script
 * Verifies Analytics implementation
 */

import fs from 'fs';
import path from 'path';

async function verifyPhase7Analytics() {
  console.log('🔍 Starting Phase 7 Analytics Verification...\n');
  let allPassed = true;

  // 1. Verify Analytics Service
  console.log('📊 Checking Analytics Service...');
  const analyticsPath = path.resolve(process.cwd(), 'client/src/lib/analytics.ts');
  if (fs.existsSync(analyticsPath)) {
    console.log('   ✅ Analytics service exists');
  } else {
    console.error('   ❌ Analytics service missing');
    allPassed = false;
  }

  // 2. Verify Product Page Integration
  console.log('\n📄 Checking Product Page Analytics...');
  const productPagePath = path.resolve(process.cwd(), 'client/src/pages/ProductPage.tsx');
  const productPageContent = fs.readFileSync(productPagePath, 'utf-8');
  if (productPageContent.includes('analytics.viewItem') && productPageContent.includes('analytics.addToCart')) {
    console.log('   ✅ Analytics events integrated in ProductPage');
  } else {
    console.error('   ❌ Analytics events missing in ProductPage');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PHASE 7 ANALYTICS VERIFICATION SUCCESSFUL!');
    console.log('   Analytics tracking is ready.');
    process.exit(0);
  } else {
    console.error('⚠️  PHASE 7 ANALYTICS VERIFICATION FAILED');
    console.error('   Please check the errors above.');
    process.exit(1);
  }
}

verifyPhase7Analytics().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
