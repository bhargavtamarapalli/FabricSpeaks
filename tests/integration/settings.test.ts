import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { inviteAdminHandler, listInvitationsHandler, revokeInvitationHandler } from '../../server/adminInvitations';
import { getPreferencesHandler, updatePreferencesHandler } from '../../server/admin-notifications';

vi.mock('../../server/db/supabase', () => {
  const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((cb) => Promise.resolve([]).then(cb)),
  };

  const mockSupabase: any = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    order: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn(),
    delete: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: 'audit-id', error: null }),
  };
  // Circular references for chaining
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.gte.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);

  return {
    db: {
      select: vi.fn(() => mockQueryBuilder),
      insert: vi.fn(() => mockQueryBuilder),
      update: vi.fn(() => mockQueryBuilder),
      delete: vi.fn(() => mockQueryBuilder),
      $count: vi.fn(),
    },
    supabase: mockSupabase
  };
});

// Mock RBAC
vi.mock('../../server/middleware/rbac', () => ({
  UserRole: {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    MODERATOR: 'moderator',
    USER: 'user'
  },
  isSuperAdmin: vi.fn().mockResolvedValue(true),
}));

import { db, supabase } from '../../server/db/supabase';

// Mock DB Helper for tests
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

describe('Settings API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Mock Session/Auth
    app.use((req, res, next) => {
      (req as any).session = { userId: 'admin-id' };
      (req as any).user = { user_id: 'admin-id', role: 'admin' };
      next();
    });

    // Register Routes
    app.post('/api/admin/invitations', inviteAdminHandler);
    app.get('/api/admin/invitations', listInvitationsHandler);
    app.delete('/api/admin/invitations/:id', revokeInvitationHandler);
    app.get('/api/admin/notifications/preferences', getPreferencesHandler);
    app.put('/api/admin/notifications/preferences', updatePreferencesHandler);

    vi.clearAllMocks();
  });

  describe('Admin Invitations', () => {
    it('should create an invitation', async () => {
      const createChain = (finalResult: any) => {
        const chain: any = {
          then: (cb: any) => Promise.resolve(finalResult).then(cb),
          single: vi.fn().mockResolvedValue(finalResult),
        };
        
        const proxy = new Proxy(chain, {
          get: (target, prop) => {
            if (prop in target) return target[prop];
            if (typeof prop === 'string' && prop !== 'then') {
              console.log('Proxy get:', prop);
              return vi.fn().mockReturnValue(proxy);
            }
            return undefined;
          }
        });
        return proxy;
      };

      // Mock profile check (user doesn't exist)
      (supabase.from as any).mockReturnValueOnce(createChain({ data: null }));

      // Mock pending invitation check (none)
      (supabase.from as any).mockReturnValueOnce(createChain({ data: null }));

      // Mock insertion
      (supabase.from as any).mockReturnValueOnce(createChain({ 
        data: { id: 'inv1', email: 'new@example.com', token: 'token123', role: 'admin' }, 
        error: null 
      }));

      const res = await request(app)
        .post('/api/admin/invitations')
        .send({ email: 'new@example.com', role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.invitation.email).toBe('new@example.com');
    });

    it('should list invitations', async () => {
      const mockInvitations = [{ id: 'inv1', email: 'test@example.com' }];
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInvitations, error: null })
      });

      const res = await request(app).get('/api/admin/invitations');

      expect(res.status).toBe(200);
      expect(res.body.invitations).toHaveLength(1);
    });
  });

  describe('Notification Preferences', () => {
    it('should get preferences', async () => {
      const mockPrefs = [{ admin_user_id: 'admin-id', channels: { email: true } }];
      
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockPrefs).then(cb))
      };
      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get('/api/admin/notifications/preferences');

      expect(res.status).toBe(200);
      expect(res.body.channels.email).toBe(true);
    });

    it('should update preferences', async () => {
      const mockPrefs = [{ admin_user_id: 'admin-id', channels: { email: false } }];
      
      // Mock existing check
      const queryBuilderSelect = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockPrefs).then(cb))
      };
      
      // Mock update
      const queryBuilderUpdate = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([{ ...mockPrefs[0], channels: { email: true } }]).then(cb))
      };

      (db.select as any).mockReturnValue(queryBuilderSelect);
      (db.update as any).mockReturnValue(queryBuilderUpdate);

      const res = await request(app)
        .put('/api/admin/notifications/preferences')
        .send({ channels: { email: true } });

      expect(res.status).toBe(200);
      expect(res.body.channels.email).toBe(true);
    });
  });
});
