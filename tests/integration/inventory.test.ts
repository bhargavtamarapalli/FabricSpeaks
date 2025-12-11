import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  getInventoryHandler, 
  adjustInventoryHandler, 
  getInventoryHealthHandler 
} from '../../server/admin-inventory';

// Mock DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
  },
}));

// Mock Inventory Intelligence Service
vi.mock('../../server/services/inventory-intelligence', () => ({
  inventoryIntelligenceService: {
    getInventoryHealth: vi.fn().mockResolvedValue({ healthy: true }),
  },
}));

import { db } from '../../server/db/supabase';

describe('Admin Inventory API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Register Routes
    app.get('/api/admin/inventory', getInventoryHandler);
    app.post('/api/admin/inventory/adjust', adjustInventoryHandler);
    app.get('/api/admin/inventory/intelligence', getInventoryHealthHandler);

    vi.clearAllMocks();
  });

  describe('GET /api/admin/inventory', () => {
    it('should list inventory items', async () => {
      const mockVariants = [
        {
          variantId: 'v1',
          productId: 'p1',
          productName: 'Product 1',
          productSku: 'SKU1',
          size: 'M',
          color: 'Red',
          stockQuantity: 10,
          lowStockThreshold: 5,
          price: '100',
          colorImages: {}
        }
      ];

      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockVariants).then(cb))
      };

      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get('/api/admin/inventory');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('in-stock');
    });
  });

  describe('POST /api/admin/inventory/adjust', () => {
    it('should adjust inventory stock', async () => {
      const variantId = '123e4567-e89b-12d3-a456-426614174000';
      const adjustment = 5;

      // Mock fetching current stock
      const queryBuilderSelect = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([{ stock_quantity: 10, product_id: 'p1' }]).then(cb))
      };

      // Mock update
      const queryBuilderUpdate = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve({}).then(cb))
      };

      (db.select as any).mockReturnValue(queryBuilderSelect);
      (db.update as any).mockReturnValue(queryBuilderUpdate);
      (db.insert as any).mockReturnValue(queryBuilderUpdate);

      const res = await request(app)
        .post('/api/admin/inventory/adjust')
        .send({ variantId, adjustment, reason: 'Restock' });

      expect(res.status).toBe(200);
      expect(res.body.new_quantity).toBe(15);
    });

    it('should return 400 for negative stock', async () => {
      const variantId = '123e4567-e89b-12d3-a456-426614174000';
      const adjustment = -20;

      // Mock fetching current stock
      const queryBuilderSelect = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([{ stock_quantity: 10, product_id: 'p1' }]).then(cb))
      };

      (db.select as any).mockReturnValue(queryBuilderSelect);

      const res = await request(app)
        .post('/api/admin/inventory/adjust')
        .send({ variantId, adjustment });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OPERATION');
    });
  });

  describe('GET /api/admin/inventory/intelligence', () => {
    it('should return inventory health report', async () => {
      const res = await request(app).get('/api/admin/inventory/intelligence');

      expect(res.status).toBe(200);
      expect(res.body.healthy).toBe(true);
    });
  });
});
