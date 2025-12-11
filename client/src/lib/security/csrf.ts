/**
 * CSRF Protection Utilities
 * 
 * Client-side CSRF token management for secure state-changing requests.
 * Implements Double Submit Cookie pattern.
 * 
 * Security Features:
 * - Automatic CSRF token injection
 * - Token validation before requests
 * - Token refresh on expiry
 * - Secure token storage
 * 
 * @module lib/security/csrf
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface CSRFToken {
  token: string;
  expiresAt: number;
}

// ============================================================================
// Constants
// ============================================================================

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_META_TAG = 'csrf-token';
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Token expiry time: 1 hour
 * Configurable via environment
 */
const TOKEN_EXPIRY = parseInt(
  import.meta.env.VITE_CSRF_TOKEN_EXPIRY || '3600000',
  10
); // 1 hour default

// ============================================================================
// CSRF Token Management
// ============================================================================

/**
 * Retrieves CSRF token from meta tag or storage
 * Meta tag takes precedence (server-provided)
 * 
 * @returns CSRF token or null if not found
 */
export function getCSRFToken(): string | null {
  try {
    // 1. Try cookie FIRST (Source of Truth for Double Submit Cookie)
    const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
    if (match) {
      logger.debug('CSRF token retrieved from cookie');
      return match[2];
    }

    // 2. Fallback to meta tag (SSR)
    const metaToken = document
      .querySelector(`meta[name="${CSRF_META_TAG}"]`)
      ?.getAttribute('content');
    
    if (metaToken) {
      logger.debug('CSRF token retrieved from meta tag');
      return metaToken;
    }
    
    // 3. Fallback to stored token
    const stored = getStoredCSRFToken();
    if (stored && !isTokenExpired(stored)) {
      logger.debug('CSRF token retrieved from storage');
      return stored.token;
    }
    
    logger.warn('No valid CSRF token found');
    return null;
  } catch (error) {
    logger.error('Error retrieving CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Stores CSRF token with expiry
 * 
 * @param token - CSRF token to store
 */
export function setCSRFToken(token: string): void {
  try {
    const tokenData: CSRFToken = {
      token,
      expiresAt: Date.now() + TOKEN_EXPIRY,
    };
    
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(tokenData));
    
    logger.debug('CSRF token stored', {
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
    });
  } catch (error) {
    logger.error('Error storing CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Retrieves stored CSRF token
 * 
 * @returns Stored CSRF token data or null
 */
function getStoredCSRFToken(): CSRFToken | null {
  try {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored) as CSRFToken;
  } catch (error) {
    logger.error('Error parsing stored CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Checks if CSRF token is expired
 * 
 * @param tokenData - CSRF token data
 * @returns True if token is expired
 */
function isTokenExpired(tokenData: CSRFToken): boolean {
  return Date.now() >= tokenData.expiresAt;
}

/**
 * Clears stored CSRF token
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    logger.debug('CSRF token cleared');
  } catch (error) {
    logger.error('Error clearing CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Injects CSRF token into request headers
 * Only for state-changing methods (POST, PUT, PATCH, DELETE)
 * 
 * @param headers - Existing headers object
 * @param method - HTTP method
 * @returns Headers with CSRF token if applicable
 */
export function injectCSRFToken(
  headers: HeadersInit,
  method: string
): HeadersInit {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Only add CSRF token for state-changing requests
  if (!stateChangingMethods.includes(method.toUpperCase())) {
    return headers;
  }
  
  const csrfToken = getCSRFToken();
  
  if (!csrfToken) {
    logger.warn('CSRF token not available for state-changing request', {
      method,
    });
    return headers;
  }
  
  // Create new Headers object to avoid mutation
  const newHeaders = new Headers(headers);
  newHeaders.set(CSRF_HEADER, csrfToken);
  
  logger.debug('CSRF token injected into request', {
    method,
    header: CSRF_HEADER,
  });
  
  return newHeaders;
}

/**
 * Validates CSRF token before making request
 * Throws error if token is missing or expired
 * 
 * @param method - HTTP method
 * @throws Error if CSRF token is invalid
 */
export function validateCSRFToken(method: string): void {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Only validate for state-changing requests
  if (!stateChangingMethods.includes(method.toUpperCase())) {
    return;
  }
  
  const token = getCSRFToken();
  
  if (!token) {
    throw new Error(
      'CSRF token is required for this request. Please refresh the page.'
    );
  }
  
  const stored = getStoredCSRFToken();
  if (stored && isTokenExpired(stored)) {
    throw new Error(
      'CSRF token has expired. Please refresh the page.'
    );
  }
}

/**
 * Refreshes CSRF token by fetching from server
 * Should be called periodically or after authentication
 * 
 * @param apiUrl - API base URL
 * @returns Promise resolving to new token
 */
export async function refreshCSRFToken(apiUrl: string): Promise<string> {
  try {
    logger.info('Refreshing CSRF token');
    
    const response = await fetch(`${apiUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based CSRF
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh CSRF token: ${response.statusText}`);
    }
    
    const data = await response.json();
    const token = data.csrfToken;
    
    if (!token) {
      throw new Error('CSRF token not found in response');
    }
    
    setCSRFToken(token);
    
    logger.info('CSRF token refreshed successfully');
    
    return token;
  } catch (error) {
    logger.error('Error refreshing CSRF token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Initializes CSRF protection
 * Should be called on app startup
 * 
 * @param apiUrl - API base URL
 */
export async function initializeCSRFProtection(apiUrl: string): Promise<void> {
  try {
    logger.info('Initializing CSRF protection');
    
    // Check if token exists in meta tag (SSR)
    const metaToken = document
      .querySelector(`meta[name="${CSRF_META_TAG}"]`)
      ?.getAttribute('content');
    
    if (metaToken) {
      setCSRFToken(metaToken);
      logger.info('CSRF protection initialized from meta tag');
      return;
    }
    
    // Otherwise, fetch from server
    await refreshCSRFToken(apiUrl);
    
    logger.info('CSRF protection initialized');
  } catch (error) {
    logger.error('Failed to initialize CSRF protection', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - allow app to continue
  }
}

/**
 * Creates fetch wrapper with CSRF protection
 * 
 * @param originalFetch - Original fetch function
 * @returns Wrapped fetch with CSRF protection
 */
export function createCSRFProtectedFetch(
  originalFetch: typeof fetch
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method || 'GET';
    
    // Validate CSRF token
    try {
      validateCSRFToken(method);
    } catch (error) {
      logger.error('CSRF validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
    
    // Inject CSRF token into headers
    const headers = injectCSRFToken(init?.headers || {}, method);
    
    // Make request with modified headers
    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if CSRF protection is enabled
 * 
 * @returns True if CSRF protection is enabled
 */
export function isCSRFProtectionEnabled(): boolean {
  const enabled = import.meta.env.VITE_CSRF_PROTECTION !== 'false';
  
  if (!enabled) {
    logger.warn('CSRF protection is disabled');
  }
  
  return enabled;
}

/**
 * Gets CSRF token for manual use (e.g., in forms)
 * 
 * @returns CSRF token or empty string
 */
export function getCSRFTokenForForm(): string {
  return getCSRFToken() || '';
}
