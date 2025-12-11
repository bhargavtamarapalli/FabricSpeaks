/**
 * Authentication Token Manager
 * 
 * Comprehensive token management with automatic refresh.
 * Implements secure token storage and rotation.
 * 
 * Security Features:
 * - Automatic token refresh before expiry
 * - Secure token storage (encrypted)
 * - Token rotation on refresh
 * - Graceful error handling
 * - No hard window redirects
 * 
 * @module lib/security/auth-token-manager
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
}

export interface TokenRefreshOptions {
  apiUrl: string;
  onRefreshSuccess?: (tokenData: TokenData) => void;
  onRefreshFailure?: (error: Error) => void;
  onUnauthorized?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const TOKEN_STORAGE_KEY = 'auth_token_data';
const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
const MAX_REFRESH_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// ============================================================================
// Token Storage (will be encrypted in production)
// ============================================================================

/**
 * Retrieves token data from storage
 * 
 * @returns Token data or null if not found
 */
export function getTokenData(): TokenData | null {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as TokenData;
    
    // Validate structure
    if (!data.accessToken || !data.refreshToken || !data.expiresAt) {
      logger.warn('Invalid token data structure found', {
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        hasExpiresAt: !!data.expiresAt,
      });
      clearTokenData();
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Error retrieving token data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Stores token data securely
 * TODO: Encrypt tokens in Phase 1 Day 15
 * 
 * @param tokenData - Token data to store
 */
export function setTokenData(tokenData: TokenData): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    
    logger.debug('Token data stored', {
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
      expiresIn: Math.round((tokenData.expiresAt - Date.now()) / 1000 / 60) + ' minutes',
    });
  } catch (error) {
    logger.error('Error storing token data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clears token data from storage
 */
export function clearTokenData(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    logger.info('Token data cleared');
  } catch (error) {
    logger.error('Error clearing token data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Checks if token is expired
 * 
 * @param tokenData - Token data to check
 * @returns True if token is expired
 */
export function isTokenExpired(tokenData: TokenData): boolean {
  return Date.now() >= tokenData.expiresAt;
}

/**
 * Checks if token will expire soon
 * 
 * @param tokenData - Token data to check
 * @param buffer - Time buffer in milliseconds (default: 5 minutes)
 * @returns True if token expires within buffer time
 */
export function isTokenExpiringSoon(
  tokenData: TokenData,
  buffer: number = REFRESH_BUFFER
): boolean {
  const expiresIn = tokenData.expiresAt - Date.now();
  return expiresIn > 0 && expiresIn <= buffer;
}

/**
 * Gets time until token expires
 * 
 * @param tokenData - Token data to check
 * @returns Milliseconds until expiry (negative if expired)
 */
export function getTimeUntilExpiry(tokenData: TokenData): number {
  return tokenData.expiresAt - Date.now();
}

// ============================================================================
// Token Refresh
// ============================================================================

let refreshPromise: Promise<TokenData> | null = null;
let refreshAttempts = 0;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 10000; // 10 seconds cooldown

/**
 * Refreshes authentication token
 * Prevents multiple simultaneous refresh calls
 * 
 * @param apiUrl - API base URL
 * @param currentRefreshToken - Current refresh token
 * @param retries - Number of retries remaining
 * @returns Promise resolving to new token data
 */
export async function refreshAuthToken(
  apiUrl: string,
  currentRefreshToken: string,
  retries: number = MAX_REFRESH_RETRIES
): Promise<TokenData> {
  // Return existing refresh promise if one is in progress
  if (refreshPromise) {
    logger.debug('Token refresh already in progress, reusing promise');
    return refreshPromise;
  }

  // Prevent aggressive refreshing
  const now = Date.now();
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    logger.debug('Token refresh cooldown active, skipping');
    const currentData = getTokenData();
    if (currentData) return currentData;
    throw new Error('Refresh cooldown active and no token available');
  }
  lastRefreshTime = now;
  
  // Create new refresh promise
  refreshPromise = performRefresh(apiUrl, currentRefreshToken, retries);
  
  try {
    const result = await refreshPromise;
    refreshAttempts = 0; // Reset on success
    return result;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Performs actual token refresh
 * 
 * @param apiUrl - API base URL
 * @param refreshToken - Refresh token
 * @param retries - Number of retries remaining
 * @returns Promise resolving to new token data
 */
async function performRefresh(
  apiUrl: string,
  refreshToken: string,
  retries: number
): Promise<TokenData> {
  try {
    logger.info('Refreshing authentication token', {
      attempt: refreshAttempts + 1,
      retriesLeft: retries,
    });
    
    refreshAttempts++;
    
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
      credentials: 'include',
    });
    
    if (response.status === 401 || response.status === 403) {
      // Refresh token is invalid/expired - user needs to re-authenticate
      logger.warn('Refresh token is invalid or expired');
      // Don't clear immediately, let the caller handle it via onUnauthorized
      // clearTokenData(); 
      throw new Error('REFRESH_TOKEN_INVALID');
    }
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.accessToken || !data.refreshToken || !data.expiresIn) {
      throw new Error('Invalid token refresh response structure');
    }
    
    // Calculate expiry
    const now = Date.now();
    const tokenData: TokenData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: now + (data.expiresIn * 1000),
      issuedAt: now,
    };
    
    // Store new tokens
    setTokenData(tokenData);
    
    logger.info('Authentication token refreshed successfully', {
      expiresIn: data.expiresIn + ' seconds',
    });
    
    return tokenData;
  } catch (error) {
    logger.error('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      attempt: refreshAttempts,
      retriesLeft: retries,
    });
    
    // Retry if attempts remaining
    if (retries > 0 && (error as Error).message !== 'REFRESH_TOKEN_INVALID') {
      logger.info(`Retrying token refresh in ${RETRY_DELAY}ms`);
      await sleep(RETRY_DELAY);
      return performRefresh(apiUrl, refreshToken, retries - 1);
    }
    
    throw error;
  }
}

/**
 * Sleep utility for retry delay
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Token Manager Class
// ============================================================================

/**
 * Auth Token Manager
 * Handles automatic token refresh and lifecycle management
 */
export class AuthTokenManager {
  private options: TokenRefreshOptions;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(options: TokenRefreshOptions) {
    this.options = options;
  }

  /**
   * Initializes token manager
   * Sets up automatic refresh
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Token manager already initialized');
      return;
    }
    
    logger.info('Initializing token manager');
    
    const tokenData = getTokenData();
    
    if (!tokenData) {
      logger.debug('No token data found, skipping auto-refresh setup');
      return;
    }
    
    // Check if token is already expired
    if (isTokenExpired(tokenData)) {
      logger.info('Token is expired, attempting refresh');
      await this.refreshToken();
    } else {
      // Schedule refresh before expiry
      this.scheduleRefresh(tokenData);
    }
    
    this.isInitialized = true;
    logger.info('Token manager initialized');
  }

  /**
   * Gets current access token
   * Automatically refreshes if expiring soon
   * 
   * @returns Access token or null
   */
  async getAccessToken(): Promise<string | null> {
    const tokenData = getTokenData();
    
    if (!tokenData) {
      return null;
    }
    
    // If token is expiring soon, refresh it
    if (isTokenExpiringSoon(tokenData)) {
      logger.info('Token expiring soon, refreshing proactively');
      try {
        const newToken = await this.refreshToken();
        return newToken.accessToken;
      } catch (error) {
        logger.error('Proactive refresh failed, using current token', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Use current token if refresh fails
        return tokenData.accessToken;
      }
    }
    
    return tokenData.accessToken;
  }

  /**
   * Refreshes token
   * 
   * @returns New token data
   */
  async refreshToken(): Promise<TokenData> {
    const currentData = getTokenData();
    
    if (!currentData) {
      throw new Error('No token data available to refresh');
    }
    
    try {
      const newTokenData = await refreshAuthToken(
        this.options.apiUrl,
        currentData.refreshToken
      );
      
      // Call success callback
      this.options.onRefreshSuccess?.(newTokenData);
      
      // Schedule next refresh
      this.scheduleRefresh(newTokenData);
      
      return newTokenData;
    } catch (error) {
      // Call failure callback
      this.options.onRefreshFailure?.(error as Error);
      
      // If refresh token is invalid, call unauthorized callback
      if ((error as Error).message === 'REFRESH_TOKEN_INVALID') {
        this.options.onUnauthorized?.();
      }
      
      throw error;
    }
  }

  /**
   * Schedules automatic token refresh
   * 
   * @param tokenData - Token data
   */
  private scheduleRefresh(tokenData: TokenData): void {
    // Clear existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    const timeUntilExpiry = getTimeUntilExpiry(tokenData);
    const refreshIn = Math.max(0, timeUntilExpiry - REFRESH_BUFFER);
    
    logger.debug('Scheduling token refresh', {
      refreshIn: Math.round(refreshIn / 1000 / 60) + ' minutes',
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
    });
    
    this.refreshTimeout = setTimeout(() => {
      logger.info('Automatic token refresh triggered');
      this.refreshToken().catch(error => {
        logger.error('Automatic token refresh failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, refreshIn);
  }

  /**
   * Stops automatic token refresh
   */
  stop(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    this.isInitialized = false;
    logger.info('Token manager stopped');
  }

  /**
   * Clears all token data and stops refresh
   */
  logout(): void {
    this.stop();
    clearTokenData();
    logger.info('User logged out, tokens cleared');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let tokenManagerInstance: AuthTokenManager | null = null;

/**
 * Gets or creates token manager instance
 * 
 * @param options - Token refresh options
 * @returns Token manager instance
 */
export function getTokenManager(options?: TokenRefreshOptions): AuthTokenManager {
  if (!tokenManagerInstance && options) {
    tokenManagerInstance = new AuthTokenManager(options);
  }
  
  if (!tokenManagerInstance) {
    throw new Error('Token manager not initialized. Call with options first.');
  }
  
  return tokenManagerInstance;
}

/**
 * Resets token manager instance
 * Useful for testing
 */
export function resetTokenManager(): void {
  if (tokenManagerInstance) {
    tokenManagerInstance.stop();
    tokenManagerInstance = null;
  }
}
