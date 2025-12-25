// Load environment variables FIRST before any other imports
import './env';

// Validate environment variables before proceeding
import { validateEnv } from './utils/env-validation';
import { loggers } from './utils/logger';

try {
  validateEnv();
  loggers.info('Server starting...', {
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
} catch (error) {
  console.error('Failed to start server due to environment validation errors');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middleware/error";
import compression from "compression";

// Phase 4: Security & Monitoring
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './utils/sentry';
import { securityHeaders, additionalSecurityHeaders } from './middleware/securityHeaders';
import { csrfProtection, getCSRFToken } from './middleware/csrf-protection';

// Phase 5: Cache initialization
import { initializeCache } from './services/cache';
import { checkLowStock } from './jobs/low-stock';
import { checkStockAndNotify } from './jobs/stock-monitor';

// Initialize Sentry
console.error('DEBUG: Initializing Sentry');
initializeSentry();

// Initialize Redis Cache
console.error('DEBUG: Initializing Cache');
initializeCache().catch((err) => {
  loggers.warn('Failed to initialize cache - continuing without cache', { error: err.message });
});

const app = express();

// Export app for testing
export { app };

// Enable compression
app.use(compression());

// Serve uploads directory
import path from "path";
// DEBUG: Log requests to /uploads to debug image loading
app.use('/uploads', (req, res, next) => {
  console.log(`[DEBUG] Static Access: ${req.method} ${req.url}`);
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// DEBUG: Log all requests to /api/upload
app.use('/api/upload', (req, res, next) => {
  console.log('----------------------------------------------------------------');
  console.log('[DEBUG] Incoming /api/upload request');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Cookies:', req.cookies);
  console.log('----------------------------------------------------------------');
  next();
});

// Body parsing middleware
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Security headers
if (process.env.NODE_ENV === 'development') {
  // In development, disable CSP to allow Vite's HMR and all resources
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
} else {
  // In production, use strict CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://checkout.razorpay.com",
            "https://*.razorpay.com"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://*.razorpay.com",
            "https://images.unsplash.com",
            "https://*.unsplash.com"
          ],
          connectSrc: [
            "'self'",
            "https://checkout.razorpay.com",
            "https://*.supabase.co",
            "https://api.razorpay.com",
            "wss://*.supabase.co"
          ],
          frameSrc: [
            "'self'",
            "https://checkout.razorpay.com",
            "https://api.razorpay.com"
          ],
        },
      },
    })
  );
}

// Additional security headers
app.use(additionalSecurityHeaders);

app.use(cors({ origin: false }));

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 1000 : 5,
  message: { code: "TOO_MANY_AUTH_REQUESTS", message: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => {
    return req.method === 'GET';
  }
});

// Apply strict auth rate limiting to login and register endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// More lenient rate limiting for general API endpoints
app.use(
  rateLimit({
    windowMs: 60_000, // 1 minute
    max: process.env.NODE_ENV === 'development' ? 1000 : 120,
    message: { code: "TOO_MANY_REQUESTS", message: "Too many requests" }
  })
);

// Initialize PostgreSQL session store
const PgSession = connectPgSimple(session);

// Create PostgreSQL connection pool for sessions (only needed in non-test environments)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL?.includes('.supabase.co') ?? false),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

let sessionStore;
if (process.env.NODE_ENV === 'test') {
  sessionStore = new session.MemoryStore();
} else {
  sessionStore = new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true, // Creates table if it doesn't exist
  });
}

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1); // exit to allow process manager to restart
  }
});

// CSRF Protection (skip for webhooks and safe methods)
const conditionalCsrf = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for webhooks, tests, debug endpoints, and OAuth flows
  if (
    req.path.startsWith('/api/webhooks') ||
    req.path.startsWith('/api/debug') ||
    req.path.startsWith('/api/auth/oauth') || // OAuth has its own token-based auth
    process.env.NODE_ENV === 'test'
  ) return next();

  // Apply CSRF protection with ignore paths for webhooks
  return csrfProtection({
    ignorePaths: ['/api/webhooks', '/api/auth/oauth']
  })(req, res, next);
};

app.use(conditionalCsrf);

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFToken);



app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { initSocket } from "./socket";

export const setupServer = async () => {
  console.error('DEBUG: Starting setupServer');
  const server = await registerRoutes(app);
  // const server = require('http').createServer(app);
  console.error('DEBUG: Routes registered');

  // Initialize Socket.IO
  initSocket(server);
  console.log('DEBUG: Socket initialized');

  // Sentry error handler (must be before global error handler)
  app.use(sentryErrorHandler);

  app.use(globalErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else if (process.env.NODE_ENV === "test") {
    log("Running in test mode, skipping static file serving");
  } else {
    serveStatic(app);
  }
  console.log('DEBUG: Static/Vite setup complete');

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Do NOT listen if running in test environment (Supertest handles binding)
  if (process.env.NODE_ENV !== 'test') {
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);

      // Schedule Low Stock Alert Job (every hour)
      setInterval(() => {
        checkLowStock().catch(err => console.error('Low stock job failed:', err));
      }, 60 * 60 * 1000);

      // Schedule Stock Notification Job (every hour)
      setInterval(() => {
        checkStockAndNotify().catch(err => console.error('Stock notification job failed:', err));
      }, 60 * 60 * 1000);

      // Run stock notification job immediately on startup (optional)
      checkStockAndNotify().catch(err => console.error('Initial stock notification check failed:', err));
    });
  }
  console.log('DEBUG: setupServer complete');
};

if (process.env.NODE_ENV !== 'test') {
  setupServer();
}

console.log('DEBUG: server/index.ts end of file');
