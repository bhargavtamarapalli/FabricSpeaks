/**
 * Search Service - Full-text and fuzzy search implementation
 * @module services/search
 */

import { db } from '../db/supabase';
import { sql } from 'drizzle-orm';
import { getCacheService, CACHE_TTL, CACHE_KEYS } from './cache';

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  brand: string;
  images: any;
  category_id: string | null;
  status: string;
  score: number;
  matchType?: 'fulltext' | 'fuzzy';
}

/**
 * Search suggestion interface
 */
export interface SearchSuggestion {
  suggestion: string;
  category: 'product' | 'brand';
  count: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  useCache?: boolean;
  searchType?: 'fulltext' | 'fuzzy' | 'combined';
  filters?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    onSale?: boolean;
    isFeatured?: boolean;
  };
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

/**
 * Search Service
 * Provides full-text and fuzzy search capabilities
 */
export class SearchService {
  private cache = getCacheService();

  /**
   * Search products with full-text search
   * @param options - Search options
   * @returns Array of search results
   */
  async searchProducts(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      limit = 50,
      useCache = true,
      searchType = 'combined',
    } = options;

    // Validate query
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();

    // Check cache
    const cacheKey = `${CACHE_KEYS.PRODUCT_LIST}:search:${searchType}:${trimmedQuery}:${limit}`;
    
    if (useCache && this.cache.isReady()) {
      const cached = await this.cache.get<SearchResult[]>(cacheKey);
      if (cached) {
        console.log('[SearchService] Cache hit for search:', trimmedQuery);
        return cached;
      }
    }

    try {
      let results: SearchResult[];

      switch (searchType) {
        case 'fulltext':
          results = await this.fullTextSearch(trimmedQuery, limit);
          break;
        
        case 'fuzzy':
          results = await this.fuzzySearch(trimmedQuery, limit);
          break;
        
        case 'combined':
        default:
          results = await this.combinedSearch(trimmedQuery, limit);
          break;
      }

      // Cache results
      if (useCache && this.cache.isReady() && results.length > 0) {
        await this.cache.set(cacheKey, results, CACHE_TTL.PRODUCTS);
      }

      return results;
    } catch (error) {
      console.error('[SearchService] Search error:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Helper to safely get rows from Drizzle result
   */
  private getRows(result: any): any[] {
    return Array.isArray(result) ? result : (result && result.rows) ? result.rows : [];
  }

  /**
   * Full-text search using PostgreSQL tsvector
   */
  private async fullTextSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results = await db.execute(
      sql`
        SELECT 
          id,
          name,
          slug,
          description,
          price,
          brand,
          images,
          category_id,
          status,
          ts_rank(
            setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B'),
            plainto_tsquery('english', ${query})
          ) AS score
        FROM products
        WHERE 
          (
            setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B')
          ) @@ plainto_tsquery('english', ${query})
          AND status = 'active'
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `
    );

    return this.getRows(results).map(row => ({
      ...row,
      score: Number(row.score) || 0,
      matchType: 'fulltext' as const,
    })) as SearchResult[];
  }

  /**
   * Fuzzy search with typo tolerance using trigrams
   */
  private async fuzzySearch(
    query: string,
    limit: number,
    similarityThreshold = 0.3
  ): Promise<SearchResult[]> {
    const results = await db.execute(
      sql`
        SELECT 
          id,
          name,
          slug,
          description,
          price,
          brand,
          images,
          category_id,
          status,
          GREATEST(
            similarity(name, ${query}::text),
            similarity(brand, ${query}::text)
          ) AS score
        FROM products
        WHERE 
          status = 'active'
          AND (
            name % ${query}::text
            OR brand % ${query}::text
            OR similarity(name, ${query}::text) > ${similarityThreshold}
            OR similarity(brand, ${query}::text) > ${similarityThreshold}
          )
        ORDER BY score DESC, created_at DESC
        LIMIT ${limit}
      `
    );

    return this.getRows(results).map(row => ({
      ...row,
      score: Number(row.score) || 0,
      matchType: 'fuzzy' as const,
    })) as SearchResult[];
  }

  /**
   * Combined search (full-text + fuzzy)
   */
  private async combinedSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results = await db.execute(
      sql`
        -- Full-text search results (weighted higher)
        SELECT 
          id,
          name,
          slug,
          description,
          price,
          brand,
          images,
          category_id,
          status,
          ts_rank(
            setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B'),
            plainto_tsquery('english', ${query})
          ) * 2.0 AS score,
          'fulltext' AS match_type
        FROM products
        WHERE 
          (
            setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B')
          ) @@ plainto_tsquery('english', ${query})
          AND status = 'active'
        
        UNION ALL
        
        -- Fuzzy search results
        SELECT 
          id,
          name,
          slug,
          description,
          price,
          brand,
          images,
          category_id,
          status,
          GREATEST(
            similarity(name, ${query}::text),
            similarity(brand, ${query}::text)
          ) AS score,
          'fuzzy' AS match_type
        FROM products
        WHERE 
          status = 'active'
          AND (name % ${query}::text OR brand % ${query}::text)
          AND id NOT IN (
            SELECT id 
            FROM products 
            WHERE (
              setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(description, '')), 'B')
            ) @@ plainto_tsquery('english', ${query})
          )
        
        ORDER BY score DESC
        LIMIT ${limit}
      `
    );

    return this.getRows(results).map(row => ({
      ...row,
      score: Number(row.score) || 0,
      matchType: row.match_type as 'fulltext' | 'fuzzy',
    })) as SearchResult[];
  }

  /**
   * Get search suggestions for auto-complete
   * @param prefix - Search prefix
   * @param limit - Maximum suggestions
   * @returns Array of suggestions
   */
  async getSuggestions(prefix: string, limit = 10): Promise<SearchSuggestion[]> {
    if (!prefix || prefix.trim().length < 2) {
      return [];
    }

    const trimmedPrefix = prefix.trim();

    // Check cache
    const cacheKey = `${CACHE_KEYS.PRODUCT_LIST}:suggestions:${trimmedPrefix}:${limit}`;
    
    if (this.cache.isReady()) {
      const cached = await this.cache.get<SearchSuggestion[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const results = await db.execute(
        sql`
          -- Product name suggestions
          SELECT DISTINCT
            name AS suggestion,
            'product' AS category,
            COUNT(*)::BIGINT AS count
          FROM products
          WHERE 
            name ILIKE ${trimmedPrefix + '%'}
            AND status = 'active'
          GROUP BY name
          
          UNION ALL
          
          -- Brand suggestions
          SELECT DISTINCT
            brand AS suggestion,
            'brand' AS category,
            COUNT(*)::BIGINT AS count
          FROM products
          WHERE 
            brand ILIKE ${trimmedPrefix + '%'}
            AND status = 'active'
            AND brand IS NOT NULL
          GROUP BY brand
          
          ORDER BY count DESC, suggestion ASC
          LIMIT ${limit}
        `
      );

      const suggestions = this.getRows(results).map(row => ({
        suggestion: row.suggestion as string,
        category: row.category as 'product' | 'brand',
        count: Number(row.count) || 0,
      }));

      // Cache suggestions
      if (this.cache.isReady() && suggestions.length > 0) {
        await this.cache.set(cacheKey, suggestions, CACHE_TTL.PRODUCTS);
      }

      return suggestions;
    } catch (error) {
      console.error('[SearchService] Suggestions error:', error);
      return [];
    }
  }

  /**
   * Invalidate search cache
   */
  async invalidateCache(): Promise<void> {
    if (this.cache.isReady()) {
      await this.cache.deletePattern(`${CACHE_KEYS.PRODUCT_LIST}:search:*`);
      await this.cache.deletePattern(`${CACHE_KEYS.PRODUCT_LIST}:suggestions:*`);
    }
  }
}

// Singleton instance
let searchServiceInstance: SearchService | null = null;

/**
 * Get search service instance
 */
export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService();
  }
  return searchServiceInstance;
}
