/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse and DDoS attacks.
 * Multiple rate limit strategies for different endpoints.
 * 
 * Day 15: Security Hardening (CRITICAL C7)
 * 
 * @module server/middleware/rate-limiter
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ============================================================================
// In-Memory Store (Use Redis in production)
// ============================================================================

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60 * 1000);

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

/**
 * Creates rate limiting middleware
 * 
 * @param config - Rate limit configuration
 * @returns Express middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Get identifier (IP + User ID if available)
    const identifier = getIdentifier(req);
    const key = `ratelimit:${identifier}`;
    
    const now = Date.now();
    let entry = store.get(key);

    // Create or reset entry
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
    }

    // Increment count
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetAt / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter,
        },
      });
      
      console.warn('[Rate Limit] Limit exceeded', {
        identifier,
        limit: maxRequests,
        current: entry.count,
      });
      
      return;
    }

    // Track response status for conditional limiting
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalJson = res.json.bind(res);
      
      res.json = function (body: unknown) {
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        if ((skipSuccessfulRequests && success) || (skipFailedRequests && !success)) {
          entry!.count--;
        }
        
        return originalJson(body);
      };
    }

    next();
  };
}

/**
 * Gets identifier for rate limiting
 * 
 * @param req - Express request
 * @returns Identifier string
 */
function getIdentifier(req: Request): string {
  // Get IP address
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown';

  // Get user ID if available
  const userId = (req as any).user?.id;

  return userId ? `user:${userId}` : `ip:${ip}`;
}

// ============================================================================
// Preset Rate Limiters
// ============================================================================

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per 15 minutes
 */
export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many requests to this endpoint. Please try again later.',
});

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Upload rate limiter
 * 50 uploads per hour
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50,
  message: 'Upload limit exceeded. Please try again in an hour.',
});

/**
 * Export rate limiter
 * 10 exports per hour
 */
export const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Export limit exceeded. Please try again in an hour.',
});

/**
 * Search rate limiter
 * 60 searches per minute
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'Too many search requests. Please slow down.',
});

// ============================================================================
// Rate Limit Statistics
// ============================================================================

/**
 * Gets rate limit statistics
 * 
 * @returns Rate limit stats
 */
export function getRateLimitStats(): {
  totalEntries: number;
  topUsers: Array<{ identifier: string; count: number; resetAt: number }>;
} {
  const entries = Array.from(store.entries()).map(([key, entry]) => ({
    identifier: key.replace('ratelimit:', ''),
    count: entry.count,
    resetAt: entry.resetAt,
  }));

  const topUsers = entries
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEntries: store.size,
    topUsers,
  };
}

/**
 * Clears rate limit for specific identifier
 * 
 * @param identifier - User or IP identifier
 */
export function clearRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`;
  store.delete(key);
  console.log('[Rate Limit] Cleared', { identifier });
}

/**
 * Clears all rate limits
 */
export function clearAllRateLimits(): void {
  store.clear();
  console.log('[Rate Limit] All limits cleared');
}
