/**
 * Phase 4 Configuration
 * Central configuration for all Phase 4 features
 */

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
  },

  // Checkout endpoint
  checkout: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many checkout attempts, please try again later.',
  },

  // Payment endpoints
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: 'Too many payment attempts, please try again later.',
  },

  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many admin actions, please try again later.',
  },

  // Review creation
  review: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many reviews submitted, please try again later.',
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts, please try again later.',
  },
};

/**
 * Transaction Configuration
 */
export const transactionConfig = {
  // Maximum number of retries for deadlock errors
  maxRetries: 3,

  // Initial retry delay in milliseconds
  retryDelay: 100,

  // Transaction isolation level
  isolationLevel: 'READ COMMITTED' as const,
};

/**
 * Logging Configuration
 */
export const loggingConfig = {
  // Log level (error, warn, info, http, debug)
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Log file configuration
  files: {
    error: {
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    },
    combined: {
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    },
  },

  // Console logging
  console: {
    enabled: true,
    colorize: true,
  },
};

/**
 * Redis Configuration
 */
export const redisConfig = {
  // Redis URL (optional)
  url: process.env.REDIS_URL,

  // Connection options
  options: {
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          return new Error('Redis connection failed after 10 retries');
        }
        return Math.min(retries * 50, 500);
      },
    },
  },

  // Rate limit store prefix
  rateLimitPrefix: 'rl:',

  // Cache TTL (in seconds)
  cacheTTL: {
    products: 3600, // 1 hour
    cart: 900, // 15 minutes
    session: 86400, // 24 hours
  },
};

/**
 * Audit Log Configuration
 */
export const auditLogConfig = {
  // Enable audit logging
  enabled: true,

  // Log all actions (or only specific ones)
  logAllActions: true,

  // Actions to always log (even if logAllActions is false)
  criticalActions: [
    'DELETE',
    'PERMISSION_CHANGE',
    'BULK_DELETE',
    'EXPORT',
  ],

  // Retention period (in days)
  retentionDays: 90,
};

/**
 * Security Configuration
 */
export const securityConfig = {
  // CSRF protection
  csrf: {
    enabled: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    },
  },

  // Helmet (security headers)
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const,
    },
  },
};

/**
 * Payment Configuration
 */
export const paymentConfig = {
  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    currency: 'INR',
  },

  // Payment timeout (in milliseconds)
  timeout: 300000, // 5 minutes

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
};

/**
 * Stock Management Configuration
 */
export const stockConfig = {
  // Low stock threshold
  lowStockThreshold: 10,

  // Out of stock threshold
  outOfStockThreshold: 0,

  // Enable stock reservation (hold stock during checkout)
  enableReservation: true,

  // Stock reservation timeout (in minutes)
  reservationTimeout: 15,

  // Enable overselling prevention
  preventOverselling: true,
};

/**
 * Error Handling Configuration
 */
export const errorConfig = {
  // Show stack traces in development
  showStackTrace: process.env.NODE_ENV === 'development',

  // Include error metadata in responses
  includeMetadata: process.env.NODE_ENV === 'development',

  // Log all errors
  logAllErrors: true,

  // Send errors to external service (e.g., Sentry)
  externalErrorTracking: {
    enabled: false, // Set to true when Sentry is configured
    dsn: process.env.SENTRY_DSN,
  },
};

/**
 * Performance Configuration
 */
export const performanceConfig = {
  // Request timeout (in milliseconds)
  requestTimeout: 30000, // 30 seconds

  // Database query timeout (in milliseconds)
  queryTimeout: 10000, // 10 seconds

  // Enable query logging
  logSlowQueries: true,

  // Slow query threshold (in milliseconds)
  slowQueryThreshold: 1000, // 1 second

  // Enable caching
  enableCaching: true,

  // Cache strategy
  cacheStrategy: (process.env.NODE_ENV === 'development' ? 'memory' : 'redis') as 'memory' | 'redis',
};

/**
 * Testing Configuration
 */
export const testConfig = {
  // Test database URL
  databaseUrl: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,

  // Test timeout (in milliseconds)
  timeout: 30000, // 30 seconds

  // Enable test coverage
  coverage: true,

  // Coverage threshold
  coverageThreshold: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
};

/**
 * Export all configurations
 */
export const config = {
  rateLimit: rateLimitConfig,
  transaction: transactionConfig,
  logging: loggingConfig,
  redis: redisConfig,
  auditLog: auditLogConfig,
  security: securityConfig,
  payment: paymentConfig,
  stock: stockConfig,
  error: errorConfig,
  performance: performanceConfig,
  test: testConfig,
};

export default config;
