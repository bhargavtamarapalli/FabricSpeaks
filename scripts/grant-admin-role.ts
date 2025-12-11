
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { profiles } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const client = postgres(databaseUrl);
const db = drizzle(client);

async function grantAdminRole() {
  const email = 'bhargav1999.t@gmail.com';
  
  try {
    console.log(`Looking up user ${email} in Supabase Auth...`);
    
    // 1. Get User ID from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        throw listError;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.error('User not found in Supabase Auth! Please run the create-admin-user script again or sign up first.');
      return;
    }

    console.log(`Found Auth User ID: ${user.id}`);

    // 2. Check Profile in Database
    console.log('Checking profile in database...');
    const existingProfile = await db.select().from(profiles).where(eq(profiles.user_id, user.id));

    if (existingProfile.length === 0) {
      console.log('Profile missing. Creating admin profile...');
      await db.insert(profiles).values({
        user_id: user.id,
        email: email,
        username: 'bhargav',
        role: 'admin',
        full_name: 'Admin User'
      });
      console.log('Admin profile created successfully.');
    } else {
      console.log(`Profile found. Current role: ${existingProfile[0].role}`);
      if (existingProfile[0].role !== 'admin') {
        console.log('Updating role to admin...');
        await db.update(profiles)
          .set({ role: 'admin' })
          .where(eq(profiles.user_id, user.id));
        console.log('Role updated to admin.');
      } else {
        console.log('User is already an admin.');
      }
    }

  } catch (error) {
    console.error('Error granting admin role:', error);
  } finally {
    await client.end();
  }
}

grantAdminRole();
