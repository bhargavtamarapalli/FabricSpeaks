import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  registerHandler, 
  loginHandler, 
  logoutHandler, 
  meHandler, 
  resetPasswordHandler, 
  updatePasswordHandler 
} from '../../server/auth';
import { createClient } from '@supabase/supabase-js';

// Define mock client using vi.hoisted to ensure it's available for mocks
const { mockSupabaseClient } = vi.hoisted(() => {
  return {
    mockSupabaseClient: {
      auth: {
        admin: {
          createUser: vi.fn(),
          deleteUser: vi.fn(),
        },

        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
      },
    }
  };
});

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Supabase DB
vi.mock('../../server/db/supabase', () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      loginAttempts: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
  supabase: {}, // Not used by server/auth.ts directly, but might be imported
}));

// Mock WhatsApp Service
vi.mock('../../server/services/whatsapp-notifications', () => ({
  whatsappService: {
    send: vi.fn(),
  },
  formatNotification: vi.fn(),
}));

// Mock notification templates
vi.mock('../../server/services/notification-templates', () => ({
  formatNotification: vi.fn(),
}));

// Import mocked modules
import { db } from '../../server/db/supabase';

describe('Auth API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    // Spy on console.error to catch server logs
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Manually register routes to isolate testing
    app.post('/api/auth/register', registerHandler);

    app.post('/api/auth/login', loginHandler);
    app.post('/api/auth/logout', logoutHandler);
    app.get('/api/auth/me', (req, res, next) => {
      // Mock auth middleware for /me
      (req as any).user = { id: 'test-profile-id', username: 'test@example.com', role: 'user' };
      next();
    }, meHandler);
    app.post('/api/auth/reset-password', resetPasswordHandler);
    app.post('/api/auth/update-password', (req, res, next) => {
       // Mock auth middleware for update-password
       (req as any).headers.authorization = 'Bearer valid-token';
       next();
    }, updatePasswordHandler);

    vi.clearAllMocks();
  });

  it('POST /api/auth/register - should register a new user', async () => {
    // Mock user not existing
    (db.query.profiles.findFirst as any).mockResolvedValue(null);

    // Mock Supabase creation
    (mockSupabaseClient.auth.admin.createUser as any).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    // Mock DB insertion
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-profile-id',
          user_id: 'test-user-id',
          username: 'test@example.com',
          role: 'user'
        }])
      })
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
      });

    if (res.status !== 201) {
      console.log('Register failed:', res.status, res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user_id', 'test-user-id');
  });

  it('POST /api/auth/login - should login user', async () => {
    // Mock Supabase login
    (mockSupabaseClient.auth.signInWithPassword as any).mockResolvedValue({
      data: { session: { access_token: 'fake-token' }, user: { id: 'test-user-id' } },
      error: null,
    });

    // Mock profile lookup
    (db.query.profiles.findFirst as any).mockResolvedValue({
      id: 'test-profile-id',
      user_id: 'test-user-id',
      username: 'test@example.com',
      role: 'user'
    });

    // Mock login attempt logging (optional, but good to prevent errors)
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue({})
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test@example.com',
        password: 'Password123!',
      });

    if (res.status !== 200) {
      console.log('Login failed:', res.status, res.body);
    }

    expect(res.body.user).toHaveProperty('id', 'test-profile-id');
  });

  it('POST /api/auth/logout - should logout user', async () => {
    (mockSupabaseClient.auth.signOut as any).mockResolvedValue({ error: null });

    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('GET /api/auth/me - should return current user profile', async () => {
    // Middleware mocks the user on request object
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'test-profile-id');
    expect(res.body).toHaveProperty('username', 'test@example.com');
  });

  it('POST /api/auth/reset-password - should initiate password reset', async () => {
    (mockSupabaseClient.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/auth/update-password - should update password', async () => {
    (mockSupabaseClient.auth.updateUser as any).mockResolvedValue({ error: null });

    const res = await request(app)
      .post('/api/auth/update-password')
      .send({ password: 'NewPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
