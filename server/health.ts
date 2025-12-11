import type { Request, Response } from 'express';
import { db } from './db/supabase';
import { sql } from 'drizzle-orm';
import { loggers } from './utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  version: string;
  environment: string;
}

/**
 * Comprehensive health check endpoint
 * Returns detailed status of all system dependencies
 */
export async function healthCheckHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'down' }
    },
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database = {
      status: 'up',
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    health.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    health.status = 'unhealthy';
    loggers.error('Database health check failed', error as Error);
  }

  // Check Redis connectivity (if enabled)
  if (process.env.CACHE_ENABLED === 'true' && process.env.NODE_ENV !== 'development') {
    try {
      const { getCacheService } = await import('./services/cache');
      const cacheService = getCacheService();
      
      if (cacheService && cacheService.isReady()) {
        const redisStart = Date.now();
        // Cache service is ready
        health.checks.redis = {
          status: 'up',
          responseTime: Date.now() - redisStart
        };
      }
    } catch (error) {
      health.checks.redis = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      health.status = 'degraded'; // Redis failure is not critical
      loggers.warn('Redis health check failed', { error });
    }
  }

  // Determine overall status
  const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return res.status(httpStatus).json(health);
}

/**
 * Readiness probe - checks if app is ready to serve traffic
 */
export async function readinessHandler(req: Request, res: Response) {
  try {
    // Quick database check
    await db.execute(sql`SELECT 1`);
    return res.status(200).json({ ready: true });
  } catch (error) {
    return res.status(503).json({ ready: false });
  }
}

/**
 * Liveness probe - checks if app is alive
 */
export function livenessHandler(req: Request, res: Response) {
  return res.status(200).json({ alive: true });
}
