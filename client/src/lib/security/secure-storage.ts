/**
 * Secure Token Storage
 * 
 * AES-256 encrypted storage for sensitive data.
 * Prevents token theft from localStorage.
 * 
 * Day 15: Security Hardening (CRITICAL C4)
 * 
 * @module lib/security/secure-storage
 */

import { logger } from '@/lib/utils/logger';
import CryptoJS from 'crypto-js';

// ============================================================================
// Types
// ============================================================================

export interface SecureStorageOptions {
  key: string;
  enableLogging?: boolean;
}

// ============================================================================
// Encryption Key
// ============================================================================

const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_KEY || 'fallback-key-change-in-production-32chars';

if (ENCRYPTION_KEY === 'fallback-key-change-in-production-32chars') {
  console.warn('[SECURITY] Using fallback encryption key! Set VITE_STORAGE_KEY in production!');
}

// ============================================================================
// Secure Storage Implementation
// ============================================================================

/**
 * Encrypts and stores data in localStorage
 * 
 * @param key - Storage key
 * @param value - Data to store
 */
export function setSecure<T = unknown>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(serialized, ENCRYPTION_KEY).toString();
    
    localStorage.setItem(key, encrypted);
    
    logger.debug('Secure storage set', { key });
  } catch (error) {
    logger.error('Failed to set secure storage', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Retrieves and decrypts data from localStorage
 * 
 * @param key - Storage key
 * @returns Decrypted value or null
 */
export function getSecure<T = unknown>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key);
    
    if (!encrypted) {
      return null;
    }
    
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
   if (!decrypted) {
      logger.warn('Failed to decrypt secure storage', { key });
      return null;
    }
    
    const value = JSON.parse(decrypted) as T;
    
    logger.debug('Secure storage retrieved', { key });
    
    return value;
  } catch (error) {
    logger.error('Failed to get secure storage', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Removes encrypted data from localStorage
 * 
 * @param key - Storage key
 */
export function removeSecure(key: string): void {
  try {
    localStorage.removeItem(key);
    logger.debug('Secure storage removed', { key });
  } catch (error) {
    logger.error('Failed to remove secure storage', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clears all secure storage
 */
export function clearSecure(): void {
  try {
    localStorage.clear();
    logger.info('Secure storage cleared');
  } catch (error) {
    logger.error('Failed to clear secure storage', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Checks if key exists in secure storage
 * 
 * @param key - Storage key
 * @returns True if key exists
 */
export function hasSecure(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

// ============================================================================
// Secure Storage Class (Alternative API)
// ============================================================================

export class SecureStorage {
  private readonly key: string;
  private readonly enableLogging: boolean;

  constructor(options: SecureStorageOptions) {
    this.key = options.key;
    this.enableLogging = options.enableLogging ?? false;
  }

  set<T = unknown>(value: T): void {
    setSecure(this.key, value);
    
    if (this.enableLogging) {
      logger.info('Secure value stored', { key: this.key });
    }
  }

  get<T = unknown>(): T | null {
    const value = getSecure<T>(this.key);
    
    if (this.enableLogging) {
      logger.info('Secure value retrieved', { 
        key: this.key, 
        found: value !== null,
      });
    }
    
    return value;
  }

  remove(): void {
    removeSecure(this.key);
    
    if (this.enableLogging) {
      logger.info('Secure value removed', { key: this.key });
    }
  }

  has(): boolean {
    return hasSecure(this.key);
  }
}
