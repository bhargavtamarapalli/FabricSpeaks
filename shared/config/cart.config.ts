/**
 * Cart Configuration
 * 
 * Centralized configuration for cart-related settings.
 * Shared between client and server.
 * 
 * @module config/cart.config
 */

export const CartConfig = {
  // =====================================
  // EXPIRATION SETTINGS
  // =====================================
  
  /** Number of days before guest cart expires */
  GUEST_CART_EXPIRY_DAYS: 7,
  
  // =====================================
  // QUANTITY LIMITS
  // =====================================
  
  /** Maximum number of unique items in a single cart */
  MAX_ITEMS_PER_CART: 50,
  
  /** Maximum quantity per item */
  MAX_QUANTITY_PER_ITEM: 99,
  
  /** Minimum quantity per item */
  MIN_QUANTITY_PER_ITEM: 1,
  
  // =====================================
  // SHIPPING SETTINGS
  // =====================================
  
  /** Order value threshold for free shipping (INR) */
  FREE_SHIPPING_THRESHOLD: 2000,
  
  /** Default shipping cost when below threshold (INR) */
  DEFAULT_SHIPPING_COST: 99,
  
  // =====================================
  // TAX SETTINGS
  // =====================================
  
  /** GST tax rate (18%) */
  TAX_RATE: 0.18,
  
  /** Tax display name */
  TAX_NAME: 'GST',
  
  // =====================================
  // CURRENCY SETTINGS
  // =====================================
  
  /** Currency symbol for display */
  CURRENCY_SYMBOL: '₹',
  
  /** ISO currency code */
  CURRENCY_CODE: 'INR',
  
  /** Number of decimal places for currency */
  CURRENCY_DECIMALS: 2,
  
  // =====================================
  // TIMEOUT SETTINGS
  // =====================================
  
  /** Cart operation timeout in milliseconds */
  CART_OPERATION_TIMEOUT_MS: 10000,
  
  /** Real-time subscription debounce time */
  REALTIME_DEBOUNCE_MS: 500,
  
  // =====================================
  // SESSION SETTINGS
  // =====================================
  
  /** Prefix for guest session IDs */
  SESSION_ID_PREFIX: 'guest_',
  
  /** Length of random session ID portion */
  SESSION_ID_LENGTH: 32,
  
  /** LocalStorage key for session ID */
  SESSION_STORAGE_KEY: 'fabricspeaks_session_id',
  
  /** LocalStorage key for guest cart (deprecated, now using server) */
  GUEST_CART_STORAGE_KEY: 'fabricspeaks_guest_cart',
  
} as const;

// Type exports for TypeScript
export type CartConfigType = typeof CartConfig;
