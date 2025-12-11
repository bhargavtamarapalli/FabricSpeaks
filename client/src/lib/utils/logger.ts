/**
 * Client-Side Logger
 * 
 * Structured logging utility for frontend application.
 * Supports different log levels and sends logs to monitoring service.
 * 
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Structured logging with context
 * - Development vs production behavior
 * - Integration with monitoring (Sentry)
 * - Performance tracking
 * 
 * @module lib/utils/logger
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Minimum log level to display
 * In production, we only show warn and error
 */
const MIN_LOG_LEVEL: Record<string, LogLevel> = {
  development: 'debug',
  production: 'warn',
  test: 'error',
};

const currentMinLevel = isDevelopment 
  ? MIN_LOG_LEVEL.development 
  : MIN_LOG_LEVEL.production;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  /**
   * Checks if log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentMinLevel];
  }

  /**
   * Formats log entry for display
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context, null, 2));
    }
    
    return parts.join(' ');
  }

  /**
   * Sends log to monitoring service (Sentry, etc.)
   */
  private sendToMonitoring(entry: LogEntry): void {
    if (!isProduction) return;
    
    // In production, send to monitoring service
    // This will be integrated with Sentry in Phase 4
    try {
      if (entry.level === 'error' && window.Sentry) {
        window.Sentry.captureException(new Error(entry.message), {
          level: entry.level,
          extra: entry.context,
        });
      } else if (entry.level === 'warn' && window.Sentry) {
        window.Sentry.captureMessage(entry.message, {
          level: 'warning',
          extra: entry.context,
        });
      }
    } catch (error) {
      // Silently fail - don't break the app if monitoring fails
      console.error('Failed to send log to monitoring:', error);
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    
    // Add stack trace for errors
    if (level === 'error') {
      entry.stack = new Error().stack;
    }
    
    // Console output in development
    if (isDevelopment) {
      const formatted = this.formatLogEntry(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted, entry.stack);
          break;
      }
    }
    
    // Send to monitoring in production
    this.sendToMonitoring(entry);
  }

  /**
   * Debug level logging
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   * Use for warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   * Use for error messages
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Performance tracking
   * Measures execution time of a function
   */
  async time<T>(
    label: string,
    fn: () => Promise<T> | T,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.debug(`${label} completed`, {
        ...context,
        duration: `${duration.toFixed(2)}ms`,
      });
      
      // Log slow operations
      if (duration > 1000) {
        this.warn(`${label} was slow`, {
          ...context,
          duration: `${duration.toFixed(2)}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.error(`${label} failed`, {
        ...context,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const logger = new Logger();

// ============================================================================
// Global type augmentation for window.Sentry
// ============================================================================

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
      captureMessage: (message: string, context?: any) => void;
    };
  }
}
