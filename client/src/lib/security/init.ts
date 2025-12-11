/**
 * Security Initialization Helper
 * 
 * Centralized security setup for the application.
 * Call this once on app startup.
 * 
 * @module lib/security/init
 */

import { getTokenManager } from './auth-token-manager';
import { initializeCSRFProtection } from './csrf';
import { setUnauthorizedHandler } from '@/lib/admin/api';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface SecurityInitOptions {
  /** API base URL */
  apiUrl: string;
  
  /** Callback when user becomes unauthorized */
  onUnauthorized: () => void;
  
  /** Callback when token refresh succeeds */
  onTokenRefreshSuccess?: () => void;
  
  /** Callback when token refresh fails */
  onTokenRefreshFailure?: (error: Error) => void;
}

// ============================================================================
// Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initializes all security features
 * Should be called once on app startup
 * 
 * @param options - Security initialization options
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeSecurity(
  options: SecurityInitOptions
): Promise<void> {
  if (isInitialized) {
    logger.warn('Security already initialized');
    return;
  }
  
  try {
    logger.info('Initializing security features', {
      apiUrl: options.apiUrl,
    });
    
    // 1. Initialize CSRF Protection
    await initializeCSRFProtection(options.apiUrl);
    logger.info('CSRF protection initialized');
    
    // 2. Initialize Token Manager
    const tokenManager = getTokenManager({
      apiUrl: options.apiUrl,
      onUnauthorized: () => {
        logger.warn('User unauthorized - triggering logout flow');
        options.onUnauthorized();
      },
      onRefreshSuccess: (tokenData) => {
        logger.info('Token refreshed successfully', {
          expiresAt: new Date(tokenData.expiresAt).toISOString(),
        });
        options.onTokenRefreshSuccess?.();
      },
      onRefreshFailure: (error) => {
        logger.error('Token refresh failed', {
          error: error.message,
        });
        options.onTokenRefreshFailure?.(error);
      },
    });
    
    await tokenManager.initialize();
    logger.info('Token manager initialized');
    
    // 3. Set unauthorized handler for API client
    setUnauthorizedHandler(() => {
      logger.warn('API unauthorized response - triggering logout flow');
      options.onUnauthorized();
    });
    logger.info('API unauthorized handler set');
    
    isInitialized = true;
    logger.info('✅ All security features initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize security', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Don't throw - allow app to continue with degraded security
    // The app will still work, but some features may not be optimal
  }
}

/**
 * Cleans up security features
 * Call this on app unmount or logout
 */
export function cleanupSecurity(): void {
  try {
    logger.info('Cleaning up security features');
    
    const tokenManager = getTokenManager();
    tokenManager.stop();
    
    isInitialized = false;
    logger.info('Security cleanup complete');
  } catch (error) {
    logger.error('Error during security cleanup', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Checks if security is initialized
 * 
 * @returns True if security is initialized
 */
export function isSecurityInitialized(): boolean {
  return isInitialized;
}
