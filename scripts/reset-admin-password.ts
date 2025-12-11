#!/usr/bin/env tsx

/**
 * Script to reset admin password
 * Usage: npx tsx scripts/reset-admin-password.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    console.log('\n=== Admin Password Reset Tool ===\n');
    
    const email = await question('Enter admin email (default: bhargav1999.t@gmail.com): ');
    const adminEmail = email.trim() || 'bhargav1999.t@gmail.com';
    
    const newPassword = await question('Enter new password: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      process.exit(1);
    }

    console.log(`\nResetting password for ${adminEmail}...`);

    // Get user from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === adminEmail);

    if (!user) {
      console.error(`❌ User with email ${adminEmail} not found in authentication system`);
      rl.close();
      process.exit(1);
    }

    // Update user password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Error updating password:', error.message);
      rl.close();
      process.exit(1);
    }

    console.log('\n✅ Password updated successfully!');
    console.log('\nYou can now login with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log('\nAccess admin panel at: http://localhost:5000/admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

resetPassword();
