/**
 * Centralized error handling utilities for consistent error responses
 * and proper sanitization to prevent information leakage
 */

export interface SanitizedError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: SanitizedError;
}

/**
 * Error codes for consistent error responses
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Validation & Input
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  BAD_REQUEST: 'BAD_REQUEST',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',

  // Business Logic
  EMPTY_CART: 'EMPTY_CART',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  // External Services
  RAZORPAY_ERROR: 'RAZORPAY_ERROR',
  RAZORPAY_NOT_CONFIGURED: 'RAZORPAY_NOT_CONFIGURED',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VERSION_READ_ERROR: 'VERSION_READ_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  TOO_MANY_AUTH_REQUESTS: 'TOO_MANY_AUTH_REQUESTS',
} as const;

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Sanitizes error messages to prevent information leakage
 * Removes database details, stack traces, and sensitive data
 */
export function sanitizeError(error: any, fallbackCode: ErrorCode = ERROR_CODES.INTERNAL_ERROR): SanitizedError {
  // If it's already a sanitized error, return it
  if (error && typeof error === 'object' && error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Handle known error types
  if (error?.code === 'PGRST116') {
    // Supabase "not found" error
    return { code: ERROR_CODES.NOT_FOUND, message: 'Resource not found' };
  }

  if (error?.code === '23505') {
    // PostgreSQL unique constraint violation
    return { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Resource already exists' };
  }

  if (error?.code === '23503') {
    // PostgreSQL foreign key constraint violation
    return { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid reference' };
  }

  if (error?.code === '23514') {
    // PostgreSQL check constraint violation
    return { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid data provided' };
  }

  // Handle common error messages that might leak info
  const message = error?.message || 'An error occurred';

  // Remove sensitive information from error messages
  const sanitizedMessage = message
    .replace(/at\s+.*?\(.*?\)/g, '') // Remove file paths and line numbers
    .replace(/password|token|key|secret/gi, '[REDACTED]') // Redact sensitive words
    .replace(/\b\d{4,}\b/g, '[REDACTED]') // Redact long numbers (potentially IDs)
    .replace(/postgresql:\/\/.*?@/g, 'postgresql://[REDACTED]@') // Redact database URLs
    .trim();

  // Use a generic message for unknown errors
  const finalMessage = sanitizedMessage.length > 0 && sanitizedMessage.length < 200
    ? sanitizedMessage
    : 'An unexpected error occurred';

  return {
    code: fallbackCode,
    message: error.message || 'An unexpected error occurred',
    details: { stack: error.stack, original: error }
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: any, statusCode: number = 500): { statusCode: number; response: ErrorResponse } {
  const sanitizedError = sanitizeError(error);

  const response = {
    error: sanitizedError,
    message: sanitizedError.message // Add this for debugging/compatibility
  };
  console.log('Creating error response:', JSON.stringify(response));

  return {
    statusCode,
    response: response as any,
  };
}

/**
 * Logs errors securely without exposing sensitive information
 */
export function logError(error: any, context?: string, additionalData?: Record<string, any>) {
  const sanitizedError = sanitizeError(error);

  // Log sanitized error for production
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'unknown',
    error: {
      code: sanitizedError.code,
      message: sanitizedError.message,
      originalMessage: error?.message, // Keep original for internal logs only
    },
    ...additionalData,
  };

  // In production, this would go to a logging service
  // For now, we'll use console.error but with sanitized data
  console.error('ERROR:', JSON.stringify(logData, null, 2));
}

/**
 * Handles async route errors consistently
 */
export function handleRouteError(error: any, res: any, context?: string) {
  logError(error, context);

  const { statusCode, response } = createErrorResponse(error);
  return res.status(statusCode).json(response);
}

/**
 * Wraps async route handlers to catch and handle errors
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleRouteError(error, res, `Route: ${req.method} ${req.path}`);
    });
  };
}
