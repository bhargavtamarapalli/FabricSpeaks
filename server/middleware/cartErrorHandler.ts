/**
 * Cart Error Handler Middleware
 * 
 * Express error handler specifically for cart operations.
 * Converts CartError instances to proper API responses with user-friendly messages.
 * 
 * @module middleware/cartErrorHandler
 */

import type { Request, Response, NextFunction } from 'express';
import { CartError, isCartError } from '../utils/cartErrors';

/**
 * Error handler middleware for cart routes
 * 
 * - CartError: Returns structured response with user-friendly message
 * - Other errors: Logs full error, returns generic message to user
 */
export function cartErrorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // If response already started, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  if (isCartError(err)) {
    // Log cart errors at appropriate level
    if (err.status >= 500) {
      console.error(`[CART_ERROR] ${err.code}:`, err.message, err.details);
    } else {
      console.log(`[CART] ${err.code}: ${err.message}`);
    }

    res.status(err.status).json(err.toResponse());
    return;
  }

  // Unknown error - log full details, return safe message to user
  console.error('[CART_ERROR] Unexpected error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: (req as any).user?.user_id,
    session: req.headers['x-session-id']
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      userAction: 'If the problem persists, please contact support.'
    }
  });
}

/**
 * Async handler wrapper for cart routes
 * Catches async errors and forwards to error handler
 */
export function asyncCartHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
