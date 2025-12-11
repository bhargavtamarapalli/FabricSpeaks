/**
 * Search API Handler
 * @module server/search
 */

import type { Request, Response } from 'express';
import { getSearchService } from './services/search';
import { z } from 'zod';

const searchService = getSearchService();

/**
 * Search query validation schema with filters and sorting
 */
const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.enum(['fulltext', 'fuzzy', 'combined']).default('combined'),
  // Filters
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  // Sorting
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'popular']).default('relevance'),
});

/**
 * Suggestions query validation schema
 */
const SuggestionsQuerySchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

/**
 * Search products handler
 * GET /api/search?q=query&limit=50&type=combined&categoryId=...&sortBy=price_asc
 */
export async function searchProductsHandler(req: Request, res: Response) {
  try {
    // Validate query parameters
    const validation = SearchQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        code: 'INVALID_QUERY',
        message: 'Invalid search parameters',
        errors: validation.error.issues,
      });
    }

    const { 
      q, 
      limit, 
      offset, 
      type, 
      categoryId, 
      minPrice, 
      maxPrice, 
      inStock, 
      onSale, 
      isFeatured, 
      sortBy 
    } = validation.data;

    // Perform search with filters
    const results = await searchService.searchProducts({
      query: q,
      limit,
      offset,
      searchType: type,
      useCache: true,
      filters: {
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        isFeatured,
      },
      sortBy,
    });

    return res.status(200).json({
      query: q,
      results,
      count: results.length,
      searchType: type,
      filters: {
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        isFeatured,
      },
      sortBy,
      pagination: {
        limit,
        offset,
        hasMore: results.length === limit,
      },
    });
  } catch (error) {
    console.error('[searchProductsHandler] Error:', error);
    return res.status(500).json({
      code: 'SEARCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to search products',
    });
  }
}

/**
 * Search suggestions handler
 * GET /api/search/suggestions?q=prefix&limit=10
 */
export async function searchSuggestionsHandler(req: Request, res: Response) {
  try {
    // Validate query parameters
    const validation = SuggestionsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        code: 'INVALID_QUERY',
        message: 'Invalid search parameters',
        errors: validation.error.issues,
      });
    }

    const { q, limit } = validation.data;

    // Get suggestions
    const suggestions = await searchService.getSuggestions(q, limit);

    return res.status(200).json({
      query: q,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('[searchSuggestionsHandler] Error:', error);
    return res.status(500).json({
      code: 'SUGGESTIONS_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get suggestions',
    });
  }
}
