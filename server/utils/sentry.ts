/**
 * Sentry Configuration for Backend
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { loggers } from './logger';

/**
 * Initialize Sentry
 * Should be called before any other imports
 */
export function initializeSentry(): void {
  if (!process.env.SENTRY_DSN) {
    loggers.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || 'unknown',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    beforeSend(event, hint) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Event (not sent in dev):', event);
        return null;
      }

      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes('Validation failed') || error.message.includes('Not found')) {
          return null;
        }
      }

      return event;
    },

    ignoreErrors: [
      'CSRF token validation failed',
      'Too many requests',
      'Network request failed',
      'Failed to fetch',
    ],
  });

  loggers.info('Sentry initialized', {
    environment: process.env.NODE_ENV,
    dsn: process.env.SENTRY_DSN?.substring(0, 20) + '...',
  });
}

export const sentryRequestHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const sentryTracingHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const sentryErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error);
  }
  next(error);
};

export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
  loggers.error('Exception captured by Sentry', { error: error.message, stack: error.stack, context });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureMessage(message, level as any);
  loggers.info('Message captured by Sentry', { message, level, context });
}

export function setUser(user: { id: string; email?: string; role?: string; [key: string]: any }): void {
  Sentry.setUser(user);
}

export function clearUser(): void {
  Sentry.setUser(null);
}

export default Sentry;
