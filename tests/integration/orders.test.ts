import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminOrdersRouter from '../../server/admin-orders';

// Mock DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
  },
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb)),
  }
}));

// Mock Email Service
vi.mock('../../server/utils/email', () => ({
  sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(true),
}));

// Mock Audit Log
vi.mock('../../server/audit', () => ({
  logAuditAction: vi.fn(),
}));

// Mock Auth Middleware
vi.mock('../../server/middleware/auth', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    req.user = { user_id: 'admin-id', role: 'admin' };
    next();
  },
}));

import { db, supabase } from '../../server/db/supabase';

describe('Admin Orders API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    app.use('/api/admin', adminOrdersRouter);

    vi.clearAllMocks();
  });

  describe('GET /api/admin/orders', () => {
    it('should list orders with pagination', async () => {
      const mockOrders = [
        { 
          order: { id: 'o1', status: 'pending', total_amount: 100 }, 
          user: { username: 'user1', email: 'user1@example.com' } 
        }
      ];
      const mockCount = [{ count: 1 }];

      // Mock db.select calls
      const queryBuilderOrders = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockOrders).then(cb))
      };
      const queryBuilderCount = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockCount).then(cb))
      };

      (db.select as any)
        .mockReturnValueOnce(queryBuilderOrders)
        .mockReturnValueOnce(queryBuilderCount);

      const res = await request(app).get('/api/admin/orders?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].customer).toBeDefined();
    });
  });

  describe('PUT /api/admin/orders/status', () => {
    it('should update order status', async () => {
      const orderIds = ['o1'];
      const status = 'shipped';

      // Mock DB update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });

      // Mock Supabase fetch for emails
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ 
            data: [{ id: 'o1', status: 'shipped', profiles: { email: 'test@example.com' } }], 
            error: null 
          })
        })
      });

      const res = await request(app)
        .put('/api/admin/orders/status')
        .send({ orderIds, status });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedCount).toBe(1);
    });

    it('should validate status', async () => {
      const res = await request(app)
        .put('/api/admin/orders/status')
        .send({ orderIds: ['o1'], status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid order status');
    });
  });

  describe('PUT /api/admin/orders/tracking', () => {
    it('should update tracking number', async () => {
      const orderUpdates = [{ orderId: 'o1', trackingNumber: 'TRACK123' }];

      // Mock DB update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });

      // Mock Supabase fetch for email
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { id: 'o1', profiles: { email: 'test@example.com' } }, 
              error: null 
            })
          })
        })
      });

      const res = await request(app)
        .put('/api/admin/orders/tracking')
        .send({ orderUpdates });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
