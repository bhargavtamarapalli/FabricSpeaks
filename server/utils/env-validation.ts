import { z } from 'zod';
import { loggers } from './logger';

/**
 * Environment variable validation schema
 * Validates all required environment variables on server startup
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // Session & Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // Redis (optional)
  CACHE_ENABLED: z.enum(['true', 'false']).default('false'),
  REDIS_URL: z.string().optional(),
  
  // Payment (optional in development)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  
  // Application
  FRONTEND_URL: z.string().url().default('http://localhost:5000'),
  APP_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // WhatsApp (optional)
  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_PHONE_NUMBER: z.string().optional(),
  
  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

/**
 * Production-specific validations
 */
const productionEnvSchema = envSchema.extend({
  // In production, these are required
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required in production'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required in production'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required in production'),
  
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required in production'),
  SMTP_PORT: z.string().min(1, 'SMTP_PORT is required in production'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required in production'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required in production'),
  FROM_EMAIL: z.string().email('FROM_EMAIL must be a valid email in production'),
  
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL in production'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
export function validateEnv(): Env {
  const isProduction = process.env.NODE_ENV === 'production';
  const schema = isProduction ? productionEnvSchema : envSchema;
  
  try {
    const validated = schema.parse(process.env);
    
    loggers.info('Environment variables validated successfully', {
      environment: validated.NODE_ENV,
      port: validated.PORT,
      cacheEnabled: validated.CACHE_ENABLED,
      razorpayConfigured: !!(validated.RAZORPAY_KEY_ID && validated.RAZORPAY_KEY_SECRET),
      emailConfigured: !!(validated.SMTP_HOST && validated.SMTP_USER),
      sentryConfigured: !!validated.SENTRY_DSN
    });
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      loggers.error('Environment validation failed', {
        errors: missingVars
      });
      
      console.error('\n❌ Environment Variable Validation Failed:\n');
      missingVars.forEach(({ path, message }) => {
        console.error(`  - ${path}: ${message}`);
      });
      console.error('\nPlease check your .env.local file and ensure all required variables are set.\n');
      
      throw new Error('Environment validation failed. Check logs for details.');
    }
    
    throw error;
  }
}

/**
 * Get a validated environment variable
 * Throws if the variable is not set
 */
export function getEnv(key: keyof Env): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable
 * Returns undefined if not set
 */
export function getOptionalEnv(key: keyof Env): string | undefined {
  return process.env[key];
}

/**
 * Check if a feature is enabled based on environment
 */
export const features = {
  isPaymentEnabled: () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  isEmailEnabled: () => !!(process.env.SMTP_HOST && process.env.SMTP_USER),
  isCacheEnabled: () => process.env.CACHE_ENABLED === 'true',
  isSentryEnabled: () => !!process.env.SENTRY_DSN,
  isWhatsAppEnabled: () => !!(process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_NUMBER),
  isCloudinaryEnabled: () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
};
