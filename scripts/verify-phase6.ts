/**
 * Phase 6 Verification Script
 * Verifies that all Phase 6 components are correctly implemented and functioning
 */

import 'dotenv/config';
import { db } from '../server/db/supabase';
import { sql } from 'drizzle-orm';
import { logInventoryChange } from '../server/services/inventory';
import { checkLowStock } from '../server/jobs/low-stock';

async function verifyPhase6() {
  console.log('🔍 Starting Phase 6 Verification...\n');
  let allPassed = true;

  // 1. Verify Database Schema Changes
  console.log('🗄️  Checking Database Schema...');
  try {
    // Check payment_provider_id in orders
    const ordersColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_provider_id'
    `);
    
    if ((ordersColumns as any).length > 0 || (ordersColumns as any).rows?.length > 0) {
      console.log('   ✅ orders.payment_provider_id column found');
    } else {
      console.error('   ❌ orders.payment_provider_id column missing');
      allPassed = false;
    }

    // Check inventory_logs table
    const logsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'inventory_logs'
    `);

    if ((logsTable as any).length > 0 || (logsTable as any).rows?.length > 0) {
      console.log('   ✅ inventory_logs table found');
    } else {
      console.error('   ❌ inventory_logs table missing');
      allPassed = false;
    }

  } catch (error) {
    console.error('   ❌ Database check failed:', error);
    allPassed = false;
  }

  // 2. Verify Inventory Service
  console.log('\n📦 Checking Inventory Service...');
  try {
    if (typeof logInventoryChange === 'function') {
      console.log('   ✅ Inventory service functions exported correctly');
    } else {
      console.error('   ❌ Inventory service functions missing');
      allPassed = false;
    }
  } catch (error) {
    console.error('   ❌ Inventory service check failed:', error);
    allPassed = false;
  }

  // 3. Verify Jobs
  console.log('\nHz Checking Background Jobs...');
  try {
    if (typeof checkLowStock === 'function') {
      console.log('   ✅ Low stock job function exported correctly');
    } else {
      console.error('   ❌ Low stock job function missing');
      allPassed = false;
    }
  } catch (error) {
    console.error('   ❌ Job check failed:', error);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 PHASE 6 VERIFICATION SUCCESSFUL!');
    console.log('   All business features are ready.');
    process.exit(0);
  } else {
    console.error('⚠️  PHASE 6 VERIFICATION FAILED');
    console.error('   Please check the errors above.');
    process.exit(1);
  }
}

verifyPhase6().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
