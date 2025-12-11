/**
 * Cache Middleware - HTTP response caching for Express
 * @module middleware/cache
 */

import type { Request, Response, NextFunction } from 'express';
import { getCacheService, CACHE_TTL } from '../services/cache';
import crypto from 'crypto';

/**
 * Cache middleware options
 */
interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  invalidateOn?: string[]; // HTTP methods that should invalidate cache
}

/**
 * Generate cache key from request
 */
function defaultKeyGenerator(req: Request): string {
  const { method, originalUrl, query, body } = req;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Create a deterministic key based on request parameters
  const keyData = {
    method,
    url: originalUrl,
    query,
    userId,
  };
  
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(keyData))
    .digest('hex');
  
  return `http:${method}:${hash}`;
}

/**
 * HTTP Cache Middleware
 * Caches GET requests by default
 * 
 * @param options - Cache options
 * @returns Express middleware
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = CACHE_TTL.PRODUCTS,
    keyGenerator = defaultKeyGenerator,
    condition = (req) => req.method === 'GET',
    invalidateOn = ['POST', 'PUT', 'PATCH', 'DELETE'],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const cache = getCacheService();

    // Skip caching if Redis is not ready
    if (!cache.isReady()) {
      return next();
    }

    // Check if request should be cached
    if (!condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedData = await cache.get<{ data: any; headers: Record<string, string> }>(cacheKey);

      if (cachedData) {
        // Cache hit
        console.log(`[CacheMiddleware] Cache HIT for key: ${cacheKey}`);
        
        // Set cached headers
        if (cachedData.headers) {
          Object.entries(cachedData.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }
        
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData.data);
      }

      // Cache miss - intercept response
      console.log(`[CacheMiddleware] Cache MISS for key: ${cacheKey}`);
      
      const originalJson = res.json.bind(res);
      
      res.json = function (data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const headersToCache = {
            'content-type': res.getHeader('content-type') as string,
          };

          cache.set(cacheKey, { data, headers: headersToCache }, ttl).catch((err) => {
            console.error('[CacheMiddleware] Error caching response:', err);
          });
        }
        
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('[CacheMiddleware] Error:', error);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache on mutating operations
 * 
 * @param patterns - Cache key patterns to invalidate
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cache = getCacheService();

    if (!cache.isReady()) {
      return next();
    }

    // Store original send function
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map((pattern) => 
            cache.deletePattern(pattern).catch((err) => {
              console.error(`[InvalidateCache] Error invalidating pattern ${pattern}:`, err);
            })
          )
        ).then((results) => {
          const validResults = results.filter((count): count is number => typeof count === 'number');
          const totalDeleted = validResults.reduce((sum, count) => sum + count, 0);
          console.log(`[InvalidateCache] Invalidated ${totalDeleted} cache entries`);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Product-specific cache middleware
 */
export const productsCacheMiddleware = cacheMiddleware({
  ttl: CACHE_TTL.PRODUCTS,
  keyGenerator: (req) => {
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    return `products:list:${query}`;
  },
  condition: (req) => req.method === 'GET' && req.path.includes('/products'),
});

/**
 * Product detail cache middleware
 */
export const productDetailCacheMiddleware = cacheMiddleware({
  ttl: CACHE_TTL.PRODUCT_DETAIL,
  keyGenerator: (req) => {
    const productId = req.params.id;
    return `product:detail:${productId}`;
  },
  condition: (req) => req.method === 'GET' && /\/products\/[^\/]+$/.test(req.path),
});

/**
 * Invalidate products cache on mutations
 */
export const invalidateProductsCacheMiddleware = invalidateCacheMiddleware([
  'products:*',
  'product:*',
]);
