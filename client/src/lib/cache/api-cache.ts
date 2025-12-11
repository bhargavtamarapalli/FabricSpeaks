/**
 * API Response Cache
 * 
 * Client-side caching for API responses to improve performance.
 * 
 * Features:
 * - Automatic cache invalidation (TTL-based)
 * - Cache key generation
 * - Memory-efficient storage
 * - Cache statistics
 * - Conditional caching
 * 
 * @module lib/cache/api-cache
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheStats {
  entries: number;
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  enableLogging?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 100; // max cache entries
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// ============================================================================
// Cache Implementation
// ============================================================================

/**
 * API Response Cache
 * Thread-safe, memory-efficient caching
 */
export class APICache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || DEFAULT_TTL,
      maxSize: options.maxSize || DEFAULT_MAX_SIZE,
      enableLogging: options.enableLogging ?? false,
    };

    // Start cleanup timer
    this.startCleanup();

    if (this.options.enableLogging) {
      logger.info('API Cache initialized', {
        ttl: this.options.ttl,
        maxSize: this.options.maxSize,
      });
    }
  }

  /**
   * Gets value from cache
   * 
   * @param key - Cache key
   * @returns Cached value or null
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      if (this.options.enableLogging) {
        logger.debug('Cache miss', { key });
      }
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      if (this.options.enableLogging) {
        logger.debug('Cache expired', { key });
      }
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;

    if (this.options.enableLogging) {
      logger.debug('Cache hit', { key, hits: entry.hits });
    }

    return entry.data as T;
  }

  /**
   * Sets value in cache
   * 
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Custom TTL (optional)
   */
  set<T = unknown>(key: string, data: T, ttl?: number): void {
    // Enforce max size
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    const expiresAt = now + (ttl || this.options.ttl);

    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: now,
      hits: 0,
    });

    if (this.options.enableLogging) {
      logger.debug('Cache set', { key, ttl: ttl || this.options.ttl });
    }
  }

  /**
   * Checks if key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Deletes specific key
   * 
   * @param key - Cache key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.options.enableLogging) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;

    if (this.options.enableLogging) {
      logger.info('Cache cleared');
    }
  }

  /**
   * Invalidates all keys matching pattern
   * 
   * @param pattern - Regex pattern or string prefix
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' 
      ? new RegExp(`^${pattern}`) 
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (this.options.enableLogging) {
      logger.info('Cache invalidated by pattern', { pattern: pattern.toString(), count });
    }

    return count;
  }

  /**
   * Gets cache statistics
   * 
   * @returns Cache stats
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      entries: this.cache.size,
      size: this.getMemorySize(),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Estimates memory usage (rough estimate)
   * 
   * @returns Estimated bytes
   */
  private getMemorySize(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(entry.data).length * 2; // Rough estimate
      size += 32; // Overhead for entry object
    }

    return size;
  }

  /**
   * Evicts oldest entry
   */
  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
      if (this.options.enableLogging) {
        logger.debug('Cache evicted oldest', { key: oldest });
      }
    }
  }

  /**
   * Starts periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Removes expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0 && this.options.enableLogging) {
      logger.debug('Cache cleanup', { removed, remaining: this.cache.size });
    }
  }

  /**
   * Stops cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();

    if (this.options.enableLogging) {
      logger.info('API Cache destroyed');
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheInstance: APICache | null = null;

/**
 * Gets or creates cache instance
 * 
 * @param options - Cache options
 * @returns Cache instance
 */
export function getCache(options?: CacheOptions): APICache {
  if (!cacheInstance) {
    cacheInstance = new APICache(options);
  }
  return cacheInstance;
}

/**
 * Resets cache instance (useful for testing)
 */
export function resetCache(): void {
  if (cacheInstance) {
    cacheInstance.destroy();
    cacheInstance = null;
  }
}

// ============================================================================
// Cache Key Helpers
// ============================================================================

/**
 * Generates cache key from URL and params
 * 
 * @param url - API URL
 * @param params - Query params
 * @returns Cache key
 */
export function generateCacheKey(
  url: string,
  params?: Record<string, unknown>
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  // Sort params for consistent keys
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  return `${url}?${JSON.stringify(sortedParams)}`;
}

/**
 * Generates cache key with user context
 * 
 * @param url - API URL
 * @param userId - User ID
 * @param params - Query params
 * @returns Cache key
 */
export function generateUserCacheKey(
  url: string,
  userId: string,
  params?: Record<string, unknown>
): string {
  const baseKey = generateCacheKey(url, params);
  return `user:${userId}:${baseKey}`;
}

// ============================================================================
// Export default instance
// ============================================================================

export const apiCache = getCache({ enableLogging: false });
