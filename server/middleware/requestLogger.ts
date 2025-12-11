/**
 * Request Logging Middleware
 * Logs all HTTP requests with timing and user information
 */

import { Request, Response, NextFunction } from 'express';
import logger, { loggers } from '../utils/logger';

/**
 * Middleware to log HTTP requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request start
  logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req.session as any)?.userId,
  });

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log when response is sent
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;

    // Log the request completion
    loggers.apiRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      { userId: (req.session as any)?.userId }
    );

    // Call the original end function
    return originalEnd.apply(this, args as any);
  };

  next();
}

/**
 * Middleware to log errors
 */
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: (req.session as any)?.userId,
  });

  next(err);
}
