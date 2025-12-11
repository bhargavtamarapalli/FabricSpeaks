import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Mock console to suppress logs during tests (optional, can be toggled)
// global.console = {
//   ...console,
//   log: vi.fn(),
//   error: vi.fn(),
// };

// Set required env vars for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
        updateUserById: vi.fn(),
      },
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

// Mock Supabase client if needed globally
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));
