/**
 * Sentry Configuration for E-commerce Frontend
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
// BrowserTracing is now included in @sentry/react or removed in v8+
// import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for React app
 */
export function initializeSentry(): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Performance monitoring sample rate
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry Event (not sent in dev):', event);
        return null;
      }

      // Filter out specific errors
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Don't send network errors
        if (error.message.includes('Failed to fetch')) {
          return null;
        }

        // Don't send ResizeObserver errors (common browser quirk)
        if (error.message.includes('ResizeObserver')) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'ResizeObserver loop',
      'Non-Error promise rejection',
    ],
  });

  console.log('Sentry initialized for E-commerce app');
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  [key: string]: any;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): void {
  if (context) {
    Sentry.setContext('additional', context);
  }

  Sentry.captureException(error);
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void {
  if (context) {
    Sentry.setContext('additional', context);
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export default Sentry;
