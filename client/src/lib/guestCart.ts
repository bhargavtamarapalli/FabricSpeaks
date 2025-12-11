/**
 * Guest Cart Utilities
 * 
 * Manages guest session identification for server-side cart storage.
 * Refactored to use cryptographically secure session IDs.
 * 
 * Note: Cart data is now stored server-side, not in localStorage.
 * This file only handles session identification.
 * 
 * @module lib/guestCart
 */

import { CartConfig } from '../../../shared/config/cart.config';

/**
 * Generate a cryptographically secure session ID for guest users
 * Uses Web Crypto API for secure random values
 */
export function generateSessionId(): string {
  if (typeof window === 'undefined' || !window.crypto) {
    // Fallback for SSR or old browsers (still more random than before)
    const timestamp = Date.now().toString(36);
    const randomPart = Array.from(
      { length: 16 }, 
      () => Math.random().toString(36).charAt(2)
    ).join('');
    return `${CartConfig.SESSION_ID_PREFIX}${timestamp}_${randomPart}`;
  }

  // Use cryptographically secure random values
  const array = new Uint8Array(CartConfig.SESSION_ID_LENGTH / 2);
  window.crypto.getRandomValues(array);
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `${CartConfig.SESSION_ID_PREFIX}${hex}`;
}

/**
 * Get existing session ID or create a new one
 * Session ID is stored in localStorage and persists across page refreshes
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    let sessionId = localStorage.getItem(CartConfig.SESSION_STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(CartConfig.SESSION_STORAGE_KEY, sessionId);
      console.log('[Session] New guest session created');
    }
    
    return sessionId;
  } catch (error) {
    // localStorage might be disabled
    console.warn('[Session] localStorage unavailable, using temporary session');
    return generateSessionId();
  }
}

/**
 * Clear the guest session
 * Called after successful login/registration to clean up
 */
export function clearGuestSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CartConfig.SESSION_STORAGE_KEY);
    localStorage.removeItem(CartConfig.GUEST_CART_STORAGE_KEY);
    console.log('[Session] Guest session cleared');
  } catch (error) {
    console.warn('[Session] Error clearing session:', error);
  }
}

/**
 * Check if there's an existing guest session
 */
export function hasGuestSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return !!localStorage.getItem(CartConfig.SESSION_STORAGE_KEY);
  } catch {
    return false;
  }
}
