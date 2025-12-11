/**
 * Redis Cache Service - Centralized caching layer for improved performance
 * @module services/cache
 */

import { createClient, RedisClientType } from 'redis';

/**
 * Cache configuration
 */
interface CacheConfig {
  url: string;
  defaultTTL: number; // Time to live in seconds
  keyPrefix: string;
}

/**
 * Cache key patterns
 */
export const CACHE_KEYS = {
  PRODUCT_LIST: 'products:list',
  PRODUCT_DETAIL: 'product:detail',
  CATEGORY_LIST: 'categories:list',
  CART: 'cart',
  SESSION: 'session',
  USER_PROFILE: 'user:profile',
} as const;

/**
 * Default TTL values (in seconds)
 */
export const CACHE_TTL = {
  PRODUCTS: 60 * 60, // 1 hour
  PRODUCT_DETAIL: 60 * 30, // 30 minutes
  CATEGORIES: 60 * 60 * 24, // 24 hours
  CART: 60 * 15, // 15 minutes
  SESSION: 60 * 60 * 24, // 24 hours
  USER_PROFILE: 60 * 15, // 15 minutes
} as const;

/**
 * Redis Cache Service
 * Provides a robust caching layer with connection pooling and error handling
 */
export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private config: CacheConfig;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      defaultTTL: config.defaultTTL || 3600,
      keyPrefix: config.keyPrefix || 'fs:',
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    // Disable Redis in development and test environments
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`[CacheService] Redis disabled in ${process.env.NODE_ENV} environment`);
      return;
    }

    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              console.error('[CacheService] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 2^retries * 100ms
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Error handling
      this.client.on('error', (err) => {
        console.error('[CacheService] Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[CacheService] Redis connected');
      });

      this.client.on('reconnecting', () => {
        console.log('[CacheService] Redis reconnecting...');
        this.connectionAttempts++;
      });

      this.client.on('ready', () => {
        console.log('[CacheService] Redis ready');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      await this.client.connect();
    } catch (error) {
      console.error('[CacheService] Failed to connect to Redis:', error);
      this.isConnected = false;
      // Don't throw - app should work without cache
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('[CacheService] Redis disconnected');
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(this.buildKey(key));
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[CacheService] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.config.defaultTTL;
      
      await this.client.setEx(this.buildKey(key), expiry, serialized);
      return true;
    } catch (error) {
      console.error(`[CacheService] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(this.buildKey(key));
      return true;
    } catch (error) {
      console.error(`[CacheService] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param pattern - Key pattern (e.g., "products:*")
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(this.buildKey(pattern));
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(keys);
    } catch (error) {
      console.error(`[CacheService] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param key - Cache key
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(this.buildKey(key));
      return result === 1;
    } catch (error) {
      console.error(`[CacheService] Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, any> | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('stats');
      return this.parseRedisInfo(info);
    } catch (error) {
      console.error('[CacheService] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Flush all cache
   * WARNING: Use with caution in production
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('[CacheService] Cache flushed');
      return true;
    } catch (error) {
      console.error('[CacheService] Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Get cache service instance (singleton)
 */
export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

/**
 * Initialize cache service
 */
export async function initializeCache(): Promise<CacheService> {
  const cache = getCacheService();
  await cache.connect();
  return cache;
}
