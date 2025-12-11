/**
 * Application Error Class
 * Provides structured error handling with error codes and metadata
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'LOCK_FAILED'
  | 'INSUFFICIENT_STOCK'
  | 'STOCK_DEDUCTION_FAILED'
  | 'STOCK_RESTORATION_FAILED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'DUPLICATE_PAYMENT'
  | 'RECORD_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_REQUEST';

export interface ErrorMetadata {
  [key: string]: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly code: ErrorCode;
  public readonly metadata?: ErrorMetadata;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    metadata?: ErrorMetadata
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, any> {
    return {
      status: this.status,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.metadata && { metadata: this.metadata }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Check if error is a specific type
   */
  isType(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Static factory methods for common errors
   */
  static badRequest(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', metadata);
  }

  static unauthorized(message: string = 'Unauthorized', metadata?: ErrorMetadata): AppError {
    return new AppError(message, 401, 'AUTHENTICATION_ERROR', metadata);
  }

  static forbidden(message: string = 'Forbidden', metadata?: ErrorMetadata): AppError {
    return new AppError(message, 403, 'AUTHORIZATION_ERROR', metadata);
  }

  static notFound(message: string = 'Resource not found', metadata?: ErrorMetadata): AppError {
    return new AppError(message, 404, 'NOT_FOUND', metadata);
  }

  static conflict(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 409, 'CONFLICT', metadata);
  }

  static tooManyRequests(message: string = 'Too many requests', metadata?: ErrorMetadata): AppError {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', metadata);
  }

  static internal(message: string = 'Internal server error', metadata?: ErrorMetadata): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', metadata);
  }

  static validation(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', metadata);
  }
}
