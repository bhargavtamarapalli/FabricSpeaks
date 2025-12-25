import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Type for database instance
type DbInstance = PostgresJsDatabase<typeof schema>;

// Use SQLite in-memory for tests
let db: DbInstance;
let supabase: SupabaseClient;

// Use real database for all environments including test
// This ensures integration tests run against the actual Postgres DB
// let db: DbInstance; // Removed duplicate
// let supabase: SupabaseClient; // Removed duplicate

if (false) { // Disabled SQLite fallback for tests
  const sqlite = new Database(':memory:');
  db = drizzleSqlite(sqlite, { schema }) as DbInstance;
  supabase = {
    auth: {
      admin: {
        createUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
        signOut: async () => ({ data: null, error: null })
      },
      signInWithPassword: async () => ({ data: { user: { id: 'test-user' }, session: { access_token: 'test-token' } }, error: null }),
      getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null })
    }
  } as unknown as SupabaseClient;
} else {
  // Validate environment variables
  if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
  if (!process.env.SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  // Initialize Supabase client for auth
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );

  // Initialize Postgres client for Drizzle with connection pooling
  const isTransactionMode = process.env.DATABASE_URL?.includes(':6543');

  const queryClient = postgres(process.env.DATABASE_URL, {
    // Phase 5.4: Connection Pooling Configuration
    max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Maximum connections in pool
    idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20', 10), // Close idle connections after 20s
    max_lifetime: 60 * 30, // Close connections after 30 minutes
    connect_timeout: 30, // Connection timeout in seconds

    // Disable prepared statements for Supabase Transaction Mode (port 6543)
    // PGBouncer in transaction mode does not support prepared statements
    prepare: !isTransactionMode,

    // TLS/SSL configuration
    // Supabase requires SSL. We'll use a permissive configuration for broad compatibility.
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },

    // Connection lifecycle hooks for monitoring
    onnotice: (notice) => {
      // Log notices in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('[DB Notice]:', notice);
      }
    },

    // Error handling
    debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true',
  });

  // Initialize Drizzle with our schema
  db = drizzle(queryClient, { schema });
}

export { db, supabase };

// Helper to validate auth token
export const validateToken = async (token: string) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error(error?.message || 'Invalid token');
  return user;
};

// Helper to get user role
export const getUserRole = async (userId: string): Promise<string> => {
  const profile = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.id, userId),
    columns: {
      role: true
    }
  });
  return profile?.role || 'user';
};

// Helper to check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'admin';
};
