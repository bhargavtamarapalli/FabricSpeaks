
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { profiles } from './shared/schema';
import { eq } from 'drizzle-orm';
import './server/env'; // Load env vars

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(databaseUrl);
const db = drizzle(client);

async function checkAdmin() {
  try {
    console.log('Checking for user bhargav1999.t@gmail.com...');
    const users = await db.select().from(profiles).where(eq(profiles.email, 'bhargav1999.t@gmail.com'));
    
    if (users.length === 0) {
        console.log('User not found in profiles table.');
    } else {
        console.log('Found user:');
        users.forEach(user => {
            console.log(`- Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, ID: ${user.user_id}`);
        });
    }
  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await client.end();
  }
}

checkAdmin();
