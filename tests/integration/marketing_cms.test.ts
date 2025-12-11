import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { listCampaignsHandler, createCampaignHandler } from '../../server/admin-marketing';
import { listContentHandler, createContentHandler, updateContentHandler, deleteContentHandler, getActiveBannersHandler } from '../../server/admin-content';
import { votePollHandler, getPollResultsHandler, getActivePollHandler } from '../../server/polls';

// Mock DB
const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  then: vi.fn((cb) => Promise.resolve([]).then(cb)),
};

vi.mock('../../server/db/supabase', () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
    delete: vi.fn(() => mockQueryBuilder),
    execute: vi.fn(() => Promise.resolve({ rowCount: 1 })), // Added execute for raw sql
    rpc: vi.fn(() => Promise.resolve({ data: 'mock-audit-id', error: null })),
  },
  supabase: { // Added supabase export
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  }
}));

import { db } from '../../server/db/supabase';

describe('Marketing & CMS API Integration', () => {
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
    app.get('/api/admin/marketing', listCampaignsHandler);
    app.post('/api/admin/marketing', createCampaignHandler);
    app.get('/api/admin/content', listContentHandler);
    app.post('/api/admin/content', createContentHandler);
    app.put('/api/admin/content/:id', updateContentHandler);
    app.delete('/api/admin/content/:id', deleteContentHandler);
    app.get('/api/banners/active', getActiveBannersHandler);
    app.post('/api/polls/:pollId/vote', votePollHandler);
    app.get('/api/polls/:pollId/results', getPollResultsHandler);
    app.get('/api/polls/active', getActivePollHandler);

    vi.clearAllMocks();
  });

  describe('Marketing Campaigns', () => {
    it('should list campaigns', async () => {
      const mockCampaigns = [{ id: 'c1', name: 'Campaign 1' }];
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockCampaigns).then(cb))
      };
      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get('/api/admin/marketing');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should create a campaign', async () => {
      const newCampaign = { name: 'New Campaign', type: 'email', message: 'Hello' };
      const createdCampaign = { id: 'c2', ...newCampaign };
      
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([createdCampaign]).then(cb))
      };
      (db.insert as any).mockReturnValue(queryBuilder);

      const res = await request(app).post('/api/admin/marketing').send(newCampaign);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('c2');
    });
  });

  describe('CMS Content', () => {
    it('should list content', async () => {
      const mockContent = [{ id: 'cnt1', title: 'Banner 1' }];
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockContent).then(cb))
      };
      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get('/api/admin/content');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should create content', async () => {
      const newContent = { title: 'New Banner', type: 'banner' };
      const createdContent = { id: 'cnt2', ...newContent };
      
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([createdContent]).then(cb))
      };
      (db.insert as any).mockReturnValue(queryBuilder);

      const res = await request(app).post('/api/admin/content').send(newContent);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('cnt2');
    });

    it('should update content', async () => {
      const updateData = { title: 'Updated Banner' };
      const updatedContent = { id: 'cnt1', ...updateData };

      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve([updatedContent]).then(cb))
      };
      
      const setMock = vi.fn().mockReturnValue(queryBuilder);
      const whereMock = vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue({ then: vi.fn((cb) => Promise.resolve([updatedContent]).then(cb)) }) });
      
      // Need to mock update().set().where().returning() chain
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue({
              then: vi.fn((cb) => Promise.resolve([updatedContent]).then(cb))
            })
          })
        })
      });

      const res = await request(app).put('/api/admin/content/cnt1').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Banner');
    });

    it('should delete content', async () => {
      const deletedContent = { id: 'cnt1', title: 'To Delete' };
      
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            then: vi.fn((cb) => Promise.resolve([deletedContent]).then(cb))
          })
        })
      });

      const res = await request(app).delete('/api/admin/content/cnt1');
      expect(res.status).toBe(204);
    });

    it('should get active banners', async () => {
      const mockBanners = [{ id: 'b1', title: 'Active Banner' }];
      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockBanners).then(cb))
      };
      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get('/api/banners/active');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('Polls', () => {
    it('should vote on a poll', async () => {
      const pollId = 'p1';
      // Mock poll check
      const mockPoll = [{ id: pollId, is_active: true, type: 'poll' }];
      // Mock existing vote check (empty)
      const mockExistingVote: any[] = [];
      // Mock vote insertion
      const mockVote = [{ id: 'v1', poll_id: pollId, option_index: 1 }];

      const queryBuilderPoll = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockPoll).then(cb))
      };
      const queryBuilderExistingVote = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockExistingVote).then(cb))
      };
      const queryBuilderInsert = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockVote).then(cb))
      };

      (db.select as any)
        .mockReturnValueOnce(queryBuilderPoll)
        .mockReturnValueOnce(queryBuilderExistingVote);
      (db.insert as any).mockReturnValue(queryBuilderInsert);

      const res = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .send({ option_index: 1 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('v1');
    });

    it('should get poll results', async () => {
      const pollId = 'p1';
      const mockResults = [
        { option_index: 0, count: 5 },
        { option_index: 1, count: 3 }
      ];

      const queryBuilder = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockResults).then(cb))
      };
      (db.select as any).mockReturnValue(queryBuilder);

      const res = await request(app).get(`/api/polls/${pollId}/results`);

      expect(res.status).toBe(200);
      expect(res.body.total_votes).toBe(8);
      expect(res.body.results['0']).toBe(5);
    });

    it('should get active poll', async () => {
      const mockPoll = [{ id: 'p1', type: 'poll', is_active: true }];
      // Mock user vote check
      const mockVote = [{ option_index: 1 }];

      const queryBuilderPoll = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockPoll).then(cb))
      };
      const queryBuilderVote = {
        ...mockQueryBuilder,
        then: vi.fn((cb) => Promise.resolve(mockVote).then(cb))
      };

      (db.select as any)
        .mockReturnValueOnce(queryBuilderPoll)
        .mockReturnValueOnce(queryBuilderVote);

      const res = await request(app).get('/api/polls/active');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('p1');
      expect(res.body.user_voted).toBe(true);
    });
  });
});
