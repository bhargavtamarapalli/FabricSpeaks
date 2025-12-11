#!/usr/bin/env tsx

/**
 * Script to create an admin user in Supabase Auth and profiles table
 * Run with: npm run create-admin
 */

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { profiles } from '../shared/schema';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const client = postgres(databaseUrl);
const db = drizzle(client);

async function createAdminUser() {
  const adminEmail = 'bhargav1999.t@gmail.com';
  const adminPassword = 'admin123'; // Change this in production
  const adminUsername = 'bhargav';

  try {
    console.log('Creating admin user...');

    // Check if admin profile already exists
    const existingProfile = await db.select().from(profiles).where(eq(profiles.username, adminUsername)).limit(1);
    if (existingProfile.length > 0) {
      console.log('Admin profile already exists');
      return;
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm for development
    });

    if (authError) {
      console.error('Error creating Supabase auth user:', authError);
      return;
    }

    console.log('Supabase auth user created:', authData.user.id);

    // Create profile record
    const [created] = await db.insert(profiles).values({
      user_id: authData.user.id,
      username: adminUsername,
      role: 'admin'
    }).returning();

    console.log('Admin profile created:', created);
    console.log('Admin login credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Username:', adminUsername);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
