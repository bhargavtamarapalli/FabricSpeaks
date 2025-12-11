/**
 * Database Configuration with Connection Pooling
 * 
 * Production-ready database configuration with:
 * - Connection pooling limits
 * - Automatic reconnection
 * - Health checks
 * - Performance monitoring
 * - Graceful shutdown
 * 
 * **BLOCKER B8 Resolution**
 * 
 * @module server/config/database
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from '../../shared/schema';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  // Pool configuration
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  // Performance
  statement_timeout?: number;
  query_timeout?: number;
}

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Environment-based database configuration
 */
function getDatabaseConfig(): DatabaseConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Base configuration from environment
  const baseConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'fabricspeaks',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
  
  // Environment-specific pool settings
  if (nodeEnv === 'production') {
    return {
      ...baseConfig,
      // Production: Higher limits for better performance
      min: parseInt(process.env.DB_POOL_MIN || '10', 10),
      max: parseInt(process.env.DB_POOL_MAX || '30', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000,
    };
  } else if (nodeEnv === 'test') {
    return {
      ...baseConfig,
      // Test: Minimal connections
      database: process.env.TEST_DATABASE_URL || 'fabricspeaks_test',
      min: 1,
      max: 5,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000,
    };
  } else {
    // Development: Moderate limits
    return {
      ...baseConfig,
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
    };
  }
}

// ============================================================================
// Connection Pool
// ============================================================================

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Creates PostgreSQL connection pool
 * 
 * @param config - Database configuration
 * @returns PostgreSQL Pool instance
 */
function createPool(config: DatabaseConfig): Pool {
  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    
    // Pool configuration
    min: config.min,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
    
    // Performance
    statement_timeout: config.statement_timeout,
    query_timeout: config.query_timeout,
    
    // SSL in production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false, // Set to true with proper cert in production
    } : false,
  };
  
  const newPool = new Pool(poolConfig);
  
  // Event handlers for monitoring
  newPool.on('connect', (client) => {
    console.log('[DB Pool] New client connected');
  });
  
  newPool.on('acquire', (client) => {
    console.log('[DB Pool] Client acquired from pool');
  });
  
  newPool.on('remove', (client) => {
    console.log('[DB Pool] Client removed from pool');
  });
  
  newPool.on('error', (err, client) => {
    console.error('[DB Pool] Unexpected error on idle client:', err);
    // Don't exit - pool will try to reconnect
  });
  
  console.log('[DB Pool] Connection pool created', {
    host: config.host,
    database: config.database,
    min: config.min,
    max: config.max,
  });
  
  return newPool;
}

/**
 * Initializes database connection
 * Call this once on server startup
 * 
 * @returns Drizzle database instance
 */
export function initializeDatabase(): ReturnType<typeof drizzle> {
  if (db) {
    console.warn('[DB] Database already initialized');
    return db;
  }
  
  try {
    console.log('[DB] Initializing database connection...');
    
    const config = getDatabaseConfig();
    pool = createPool(config);
    
    // Create Drizzle instance
    db = drizzle(pool, { schema });
    
    console.log('[DB] ✅ Database initialized successfully');
    
    return db;
  } catch (error) {
    console.error('[DB] ❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Gets database instance
 * Initializes if not already done
 * 
 * @returns Drizzle database instance
 */
export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) {
    console.log('[DB] Database not initialized, initializing now...');
    return initializeDatabase();
  }
  
  return db;
}

/**
 * Gets raw connection pool
 * Use sparingly - prefer using Drizzle ORM
 * 
 * @returns PostgreSQL Pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('[DB] Pool not initialized. Call initializeDatabase() first.');
  }
  
  return pool;
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Checks database connection health
 * 
 * @returns True if database is healthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!pool) {
      console.error('[DB Health] Pool not initialized');
      return false;
    }
    
    const client = await pool.connect();
    
    try {
      // Simple query to verify connection
      const result = await client.query('SELECT 1');
      
      if (result.rows.length === 1) {
        console.log('[DB Health] ✅ Database is healthy');
        return true;
      }
      
      console.error('[DB Health] ❌ Unexpected query result');
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB Health] ❌ Health check failed:', error);
    return false;
  }
}

/**
 * Gets connection pool statistics
 * 
 * @returns Pool statistics
 */
export function getPoolStats(): PoolStats | null {
  if (!pool) {
    return null;
  }
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Logs pool statistics
 */
export function logPoolStats(): void {
  const stats = getPoolStats();
  
  if (stats) {
    console.log('[DB Pool Stats]', {
      total: stats.totalCount,
      idle: stats.idleCount,
      waiting: stats.waitingCount,
      active: stats.totalCount - stats.idleCount,
    });
  } else {
    console.log('[DB Pool Stats] Pool not initialized');
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Closes database connections gracefully
 * Call this on server shutdown
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    console.log('[DB] Closing database connections...');
    
    if (pool) {
      await pool.end();
      pool = null;
      db = null;
      console.log('[DB] ✅ Database connections closed');
    } else {
      console.log('[DB] No active connections to close');
    }
  } catch (error) {
    console.error('[DB] ❌ Error closing database connections:', error);
    throw error;
  }
}

/**
 * Sets up graceful shutdown handlers
 * Automatically closes database on process termination
 */
export function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`[DB] Received ${signal}, shutting down gracefully...`);
    
    try {
      await closeDatabaseConnections();
      process.exit(0);
    } catch (error) {
      console.error('[DB] Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[DB] Uncaught exception:', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[DB] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Express middleware to inject database into request
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export function injectDatabase(req: any, res: any, next: any): void {
  req.db = getDatabase();
  next();
}

// ============================================================================
// Export default instance
// ============================================================================

export default {
  initialize: initializeDatabase,
  get: getDatabase,
  getPool,
  checkHealth: checkDatabaseHealth,
  getStats: getPoolStats,
  logStats: logPoolStats,
  close: closeDatabaseConnections,
  setupGracefulShutdown,
  injectDatabase,
};
