/**
 * CSRF Protection Middleware
 * 
 * Server-side CSRF token generation and validation.
 * Implements Double Submit Cookie pattern.
 * 
 * Security Features:
 * - Generate unique CSRF tokens per session
 * - Validate tokens on state-changing requests
 * - Automatic token rotation
 * - Secure cookie configuration
 * 
 * @module server/middleware/csrf-protection
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}

// ============================================================================
// Constants
// ============================================================================

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';
const TOKEN_LENGTH = 32;

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generates secure random CSRF token
 * 
 * @returns CSRF token string
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * CSRF Protection Middleware
 * 
 * Generates and validates CSRF tokens
 * 
 * @param options - CSRF options
 * @returns Express middleware
 */
export function csrfProtection(options: {
  ignorePaths?: string[];
  cookieOptions?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
} = {}) {
  const {
    ignorePaths = [],
    cookieOptions = {
      httpOnly: false, // Must be false for client to read
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for ignored paths
    if (ignorePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip for non-protected methods (GET, HEAD, OPTIONS)
    if (!PROTECTED_METHODS.includes(req.method)) {
      // Generate token if not present
      let token = req.cookies?.[CSRF_COOKIE];
      
      if (!token) {
        token = generateCSRFToken();
        res.cookie(CSRF_COOKIE, token, {
          ...cookieOptions,
          maxAge: 3600000, // 1 hour
        });
        
        console.log('[CSRF] Token generated for session');
      }
      
      req.csrfToken = token;
      return next();
    }
    
    // Validate CSRF token for state-changing requests
    const tokenFromHeader = req.headers[CSRF_HEADER] as string;
    const tokenFromCookie = req.cookies?.[CSRF_COOKIE];
    
    if (!tokenFromHeader || !tokenFromCookie) {
      console.warn('[CSRF] Token missing', {
        method: req.method,
        path: req.path,
        hasHeader: !!tokenFromHeader,
        hasCookie: !!tokenFromCookie,
      });
      
      return res.status(403).json({
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required',
        },
      });
    }
    
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(tokenFromHeader),
      Buffer.from(tokenFromCookie)
    )) {
      console.warn('[CSRF] Token mismatch', {
        method: req.method,
        path: req.path,
        headerToken: tokenFromHeader.substring(0, 10) + '...',
        cookieToken: tokenFromCookie.substring(0, 10) + '...',
      });
      
      return res.status(403).json({
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF token is invalid',
        },
      });
    }
    
    // Token valid - rotate it for next request
    const newToken = generateCSRFToken();
    res.cookie(CSRF_COOKIE, newToken, {
      ...cookieOptions,
      maxAge: 3600000, // 1 hour
    });
    
    req.csrfToken = newToken;
    
    console.log('[CSRF] Token validated and rotated');
    
    next();
  };
}

/**
 * Endpoint to get CSRF token
 * Used by client to refresh token
 *  
 * @param req - Express request
 * @param res - Express response
 */
export function getCSRFToken(req: Request, res: Response) {
  const token = req.csrfToken || generateCSRFToken();
  
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });
  
  res.json({
    csrfToken: token,
  });
}
