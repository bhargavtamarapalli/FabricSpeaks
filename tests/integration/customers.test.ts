import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { listUsersHandler } from '../../server/auth';
import { getAbandonedCartsHandler, getVIPCustomersHandler } from '../../server/admin-customers';

// Mock DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  having: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    query: {
      profiles: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    select: vi.fn(() => mockQueryBuilder),
  },
}));

import { db } from '../../server/db/supabase';

describe('Admin Customers API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Mock Auth Middleware
    app.use((req, res, next) => {
      (req as any).user = { user_id: 'admin-id', role: 'admin' };
      next();
    });

    // Register Routes
    app.get('/api/admin/users', listUsersHandler);
    app.get('/api/admin/customers/abandoned-carts', getAbandonedCartsHandler);
    app.get('/api/admin/customers/vip', getVIPCustomersHandler);

    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should list all users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 2, username: 'user2', email: 'user2@example.com', role: 'admin' }
      ];

      (db.query.profiles.findMany as any).mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].username).toBe('user1');
    });
  });

  describe('GET /api/admin/customers/abandoned-carts', () => {
    it('should list abandoned carts', async () => {
      const mockCarts = [
        { cartId: 'c1', userId: 'u1', username: 'user1' }
      ];
      const mockItems = [
        { productName: 'Product 1', quantity: 1, price: '100' }
      ];

      // Mock fetching carts
      const queryBuilderCarts = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockCarts).then(cb))
      };

      // Mock fetching items for cart
      const queryBuilderItems = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockItems).then(cb))
      };

      (db.select as any)
        .mockReturnValueOnce(queryBuilderCarts)
        .mockReturnValueOnce(queryBuilderItems);

      const res = await request(app).get('/api/admin/customers/abandoned-carts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].items).toHaveLength(1);
    });
  });

  describe('GET /api/admin/customers/vip', () => {
    it('should list VIP customers', async () => {
      const mockVIPs = [
        { userId: 'u1', username: 'vip1', totalSpent: 60000 }
      ];

      const queryBuilderVIPs = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockVIPs).then(cb))
      };

      (db.select as any).mockReturnValue(queryBuilderVIPs);

      const res = await request(app).get('/api/admin/customers/vip');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].totalSpent).toBe(60000);
    });
  });
});
