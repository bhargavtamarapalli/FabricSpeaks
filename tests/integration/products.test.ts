import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  getAdminProductsHandler, 
  getAdminProductHandler, 
  createAdminProductHandler, 
  updateAdminProductHandler, 
  deleteAdminProductHandler 
} from '../../server/admin-products';

// Mock Supabase DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  then: vi.fn().mockImplementation((callback) => Promise.resolve([]).then(callback)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

// Mock Audit Log
vi.mock('../../server/audit', () => ({
  logAuditAction: vi.fn(),
}));

import { db } from '../../server/db/supabase';

describe('Admin Products API Integration', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.spyOn(console, 'error');
    vi.spyOn(console, 'log');

    app = express();
    app.use(express.json());
    
    // Mock Auth Middleware
    app.use((req, res, next) => {
      (req as any).user = { user_id: 'test-admin-id', role: 'admin' };
      next();
    });

    // Register Routes
    app.get('/api/admin/products', getAdminProductsHandler);
    app.get('/api/admin/products/:id', getAdminProductHandler);
    app.post('/api/admin/products', createAdminProductHandler);
    app.put('/api/admin/products/:id', updateAdminProductHandler);
    app.delete('/api/admin/products/:id', deleteAdminProductHandler);

    vi.clearAllMocks();
  });

  describe('GET /api/admin/products', () => {
    it('should list products with pagination', async () => {
      const mockProducts = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Product 1', price: '100', category_name: 'Category A', color_images: {} },
        { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Product 2', price: '200', category_name: 'Category B', color_images: {} }
      ];
      const mockCount = [{ count: 2 }];

      // Mock the two select calls
      const queryBuilderProducts = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockProducts).then(cb))
      };
      const queryBuilderCount = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockCount).then(cb))
      };

      (db.select as any)
        .mockReturnValueOnce(queryBuilderProducts)
        .mockReturnValueOnce(queryBuilderCount);

      const res = await request(app).get('/api/admin/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('POST /api/admin/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        price: '150.00',
        sku: 'NP-001',
        stock_quantity: 10,
        category_id: '123e4567-e89b-12d3-a456-426614174002',
        description: 'Test Description'
      };

      const createdProduct = { ...newProduct, id: '123e4567-e89b-12d3-a456-426614174003', slug: 'new-product-123' };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdProduct])
        })
      });

      const res = await request(app)
        .post('/api/admin/products')
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(createdProduct.id);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .send({ name: 'Invalid Product' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    it('should update an existing product', async () => {
      const updateData = { name: 'Updated Name', price: '160.00' }; // Use string for decimal
      const updatedProduct = { id: '123e4567-e89b-12d3-a456-426614174000', ...updateData };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProduct])
          })
        })
      });
      
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      });

      const res = await request(app)
        .put('/api/admin/products/123e4567-e89b-12d3-a456-426614174000')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('should return 404 if product not found', async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([])
          })
        })
      });

      const res = await request(app)
        .put('/api/admin/products/123e4567-e89b-12d3-a456-426614174999')
        .send({ name: 'Update', price: '100.00' }); // Use string for decimal

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    it('should delete a product', async () => {
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'p1' }])
        })
      });

      const res = await request(app).delete('/api/admin/products/p1');

      expect(res.status).toBe(204);
    });
  });
});
