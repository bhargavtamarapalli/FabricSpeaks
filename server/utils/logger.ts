import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: {
    service: 'fabric-speaks-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Helper functions for common log patterns
export const loggers = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: Error | object) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, error);
    }
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
  
  // Specific loggers for common scenarios
  apiRequest: (method: string, path: string, statusCode: number, duration: number, meta?: object) => {
    logger.info('API Request', {
      method,
      path,
      statusCode,
      duration,
      ...meta
    });
  },
  
  dbQuery: (query: string, duration: number, meta?: object) => {
    logger.debug('Database Query', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...meta
    });
  },
  
  security: (event: string, meta?: object) => {
    logger.warn(`Security Event: ${event}`, meta);
  }
};

export default logger;
