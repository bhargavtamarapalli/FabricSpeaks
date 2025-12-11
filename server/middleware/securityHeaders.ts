/**
 * Security Headers Middleware
 * Configures Content Security Policy and other security headers using Helmet
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Content Security Policy configuration
 * Prevents XSS, clickjacking, and other code injection attacks
 */
const cspDirectives = {
  defaultSrc: ["'self'"],
  
  // Scripts: Allow self and specific trusted sources
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for React inline scripts (consider removing in production)
    "'unsafe-eval'", // Required for development (remove in production)
    'https://checkout.razorpay.com', // Razorpay payment gateway
    'https://cdn.jsdelivr.net', // CDN for libraries
  ],
  
  // Styles: Allow self and inline styles
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com', // Google Fonts
  ],
  
  // Images: Allow self, data URIs, and CDNs
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow all HTTPS images (for product images from various sources)
    'https://res.cloudinary.com', // Cloudinary CDN
  ],
  
  // Fonts: Allow self and Google Fonts
  fontSrc: [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  
  // Connect: API endpoints and external services
  connectSrc: [
    "'self'",
    'https://api.razorpay.com', // Razorpay API
    process.env.SUPABASE_URL || '', // Supabase API
    process.env.REDIS_URL || '', // Redis (if using)
  ].filter(Boolean), // Remove empty strings
  
  // Frames: Razorpay payment iframe
  frameSrc: [
    "'self'",
    'https://api.razorpay.com',
    'https://checkout.razorpay.com',
  ],
  
  // Objects: Disallow plugins
  objectSrc: ["'none'"],
  
  // Media: Allow self
  mediaSrc: ["'self'"],
  
  // Workers: Allow self
  workerSrc: ["'self'", 'blob:'],
  
  // Forms: Only allow posting to self
  formAction: ["'self'"],
  
  // Frame ancestors: Prevent clickjacking
  frameAncestors: ["'none'"],
  
  // Base URI: Restrict base tag
  baseUri: ["'self'"],
  
  // Upgrade insecure requests in production
  ...(process.env.NODE_ENV === 'production' && {
    upgradeInsecureRequests: [],
  }),
};

/**
 * Helmet configuration for security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: process.env.NODE_ENV === 'development', // Report-only in dev
  },

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options (prevent clickjacking)
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options (prevent MIME sniffing)
  noSniff: true,

  // X-XSS-Protection (legacy XSS protection)
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Permissions-Policy (formerly Feature-Policy)
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,
});

/**
 * Custom security headers middleware
 * Adds additional security headers not covered by Helmet
 */
export function additionalSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Permissions Policy (restrict browser features)
  res.setHeader(
    'Permissions-Policy',
    [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=(self)', // Allow payment API for Razorpay
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ')
  );

  // Cross-Origin policies - only in production
  // These are too strict for Vite development mode
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Expect-CT (Certificate Transparency)
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  next();
}

/**
 * CSP violation reporter
 * Logs CSP violations for monitoring
 */
export function cspViolationReporter(req: Request, res: Response): void {
  if (req.body && req.body['csp-report']) {
    const report = req.body['csp-report'];
    
    console.error('CSP Violation:', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
    });
  }

  res.status(204).end();
}

/**
 * Development-only: Relaxed CSP for hot reload
 */
export function developmentCSP(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === 'development') {
    // Allow webpack dev server and HMR
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;"
    );
  }
  next();
}
