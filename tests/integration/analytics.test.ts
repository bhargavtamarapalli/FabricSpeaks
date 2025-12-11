import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getDashboardStatsHandler } from '../../server/admin-dashboard';
import { 
  getRevenueAnalyticsHandler, 
  getTopProductsHandler, 
  getCustomerGrowthHandler, 
  getSalesByRegionHandler, 
  getSalesByCategoryHandler 
} from '../../server/admin-analytics';

// Mock DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

import { db } from '../../server/db/supabase';

describe('Admin Analytics API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Register Routes
    app.get('/api/admin/stats', getDashboardStatsHandler);
    app.get('/api/admin/analytics/revenue', getRevenueAnalyticsHandler);
    app.get('/api/admin/analytics/top-products', getTopProductsHandler);
    app.get('/api/admin/analytics/customer-growth', getCustomerGrowthHandler);
    app.get('/api/admin/analytics/sales-by-region', getSalesByRegionHandler);
    app.get('/api/admin/analytics/sales-by-category', getSalesByCategoryHandler);

    vi.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard stats', async () => {
      // Mock the 11 sequential db.select calls
      const mockRevenue = [{ total: 1000 }];
      const mockOrders = [{ total: 10 }];
      const mockPending = [{ count: 2 }];
      const mockProcessing = [{ count: 3 }];
      const mockCompleted = [{ count: 4 }];
      const mockCancelled = [{ count: 1 }];
      const mockProducts = [{ total: 20 }];
      const mockActiveProducts = [{ count: 15 }];
      const mockLowStock = [{ count: 2 }];
      const mockOutOfStock = [{ count: 1 }];
      const mockCustomers = [{ total: 50 }];

      const createMockBuilder = (data: any) => ({
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(data).then(cb))
      });

      (db.select as any)
        .mockReturnValueOnce(createMockBuilder(mockRevenue))
        .mockReturnValueOnce(createMockBuilder(mockOrders))
        .mockReturnValueOnce(createMockBuilder(mockPending))
        .mockReturnValueOnce(createMockBuilder(mockProcessing))
        .mockReturnValueOnce(createMockBuilder(mockCompleted))
        .mockReturnValueOnce(createMockBuilder(mockCancelled))
        .mockReturnValueOnce(createMockBuilder(mockProducts))
        .mockReturnValueOnce(createMockBuilder(mockActiveProducts))
        .mockReturnValueOnce(createMockBuilder(mockLowStock))
        .mockReturnValueOnce(createMockBuilder(mockOutOfStock))
        .mockReturnValueOnce(createMockBuilder(mockCustomers));

      const res = await request(app).get('/api/admin/stats');

      expect(res.status).toBe(200);
      expect(res.body.revenue.total).toBe(1000);
      expect(res.body.orders.total).toBe(10);
      expect(res.body.orders.pending).toBe(2);
      expect(res.body.products.total).toBe(20);
      expect(res.body.customers.total).toBe(50);
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    it('should return revenue analytics', async () => {
      const mockData = [
        { date: '2023-01-01', revenue: '100', orders: '5' }
      ];
      (db.execute as any).mockResolvedValue({ rows: mockData });

      const res = await request(app).get('/api/admin/analytics/revenue');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].revenue).toBe(100);
    });
  });

  describe('GET /api/admin/analytics/top-products', () => {
    it('should return top products', async () => {
      const mockData = [
        { id: 'p1', name: 'Product 1', sales: '10', revenue: '1000' }
      ];
      (db.execute as any).mockResolvedValue({ rows: mockData });

      const res = await request(app).get('/api/admin/analytics/top-products');

      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe('Product 1');
    });
  });

  describe('GET /api/admin/analytics/customer-growth', () => {
    it('should return customer growth', async () => {
      const mockData = [
        { date: '2023-01-01', customers: '5' }
      ];
      (db.execute as any).mockResolvedValue({ rows: mockData });

      const res = await request(app).get('/api/admin/analytics/customer-growth');

      expect(res.status).toBe(200);
      expect(res.body[0].customers).toBe(5);
    });
  });

  describe('GET /api/admin/analytics/sales-by-region', () => {
    it('should return sales by region', async () => {
      // First call for total sales
      (db.execute as any).mockResolvedValueOnce({ rows: [{ total: '1000' }] });
      // Second call for region data
      (db.execute as any).mockResolvedValueOnce({ rows: [{ region: 'New York', sales: '500' }] });

      const res = await request(app).get('/api/admin/analytics/sales-by-region');

      expect(res.status).toBe(200);
      expect(res.body[0].region).toBe('New York');
      expect(res.body[0].percentage).toBe(50);
    });
  });

  describe('GET /api/admin/analytics/sales-by-category', () => {
    it('should return sales by category', async () => {
      const mockData = [
        { category: 'Electronics', sales: '500' }
      ];
      (db.execute as any).mockResolvedValue({ rows: mockData });

      const res = await request(app).get('/api/admin/analytics/sales-by-category');

      expect(res.status).toBe(200);
      expect(res.body[0].category).toBe('Electronics');
    });
  });
});
