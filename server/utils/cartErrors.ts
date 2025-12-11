/**
 * Cart Error Utilities
 * 
 * Standardized error codes and user-friendly messages for cart operations.
 * All cart-related errors should use these constants for consistency.
 * 
 * @module utils/cartErrors
 */

import { CartConfig } from '../../shared/config/cart.config';

/**
 * Cart error definitions with user-friendly messages
 */
export const CartErrors = {
  // Product/Variant errors
  PRODUCT_NOT_FOUND: {
    code: 'PRODUCT_NOT_FOUND',
    status: 404,
    message: 'This product is no longer available.',
    userAction: 'Please remove this item from your cart.'
  },
  VARIANT_NOT_FOUND: {
    code: 'VARIANT_NOT_FOUND',
    status: 404,
    message: 'The selected size/color is no longer available.',
    userAction: 'Please select a different option or remove this item.'
  },
  PRODUCT_INACTIVE: {
    code: 'PRODUCT_INACTIVE',
    status: 400,
    message: 'This product is currently unavailable for purchase.',
    userAction: 'Check back later or browse similar items.'
  },

  // Stock errors
  OUT_OF_STOCK: {
    code: 'OUT_OF_STOCK',
    status: 400,
    message: 'Sorry, this item is currently out of stock.',
    userAction: 'We can notify you when it\'s back in stock.'
  },
  INSUFFICIENT_STOCK: {
    code: 'INSUFFICIENT_STOCK',
    status: 400,
    messageTemplate: (available: number) => `Only ${available} item(s) available.`,
    userAction: 'Please reduce the quantity or check back later.'
  },

  // Cart errors
  CART_NOT_FOUND: {
    code: 'CART_NOT_FOUND',
    status: 404,
    message: 'Your shopping cart could not be found.',
    userAction: 'Please refresh the page to continue shopping.'
  },
  CART_ITEM_NOT_FOUND: {
    code: 'CART_ITEM_NOT_FOUND',
    status: 404,
    message: 'This item is no longer in your cart.',
    userAction: 'Please refresh the page.'
  },
  CART_EMPTY: {
    code: 'CART_EMPTY',
    status: 400,
    message: 'Your cart is empty.',
    userAction: 'Add some items to continue.'
  },

  // Validation errors
  INVALID_QUANTITY: {
    code: 'INVALID_QUANTITY',
    status: 400,
    message: 'Please enter a valid quantity.',
    userAction: 'Quantity must be between 1 and 99.'
  },
  MAX_QUANTITY_EXCEEDED: {
    code: 'MAX_QUANTITY_EXCEEDED',
    status: 400,
    message: 'Maximum quantity per item is 99.',
    userAction: 'For bulk orders, please contact our sales team.'
  },
  MAX_ITEMS_EXCEEDED: {
    code: 'MAX_ITEMS_EXCEEDED',
    status: 400,
    message: 'Your cart has reached the maximum number of items.',
    userAction: 'Please remove some items before adding more.'
  },

  // Price errors
  PRICE_CHANGED: {
    code: 'PRICE_CHANGED',
    status: 400,
    message: 'The price of this item has changed.',
    userAction: 'Please review the updated price before continuing.'
  },

  // Authorization errors
  FORBIDDEN: {
    code: 'FORBIDDEN',
    status: 403,
    message: 'You don\'t have permission to modify this cart.',
    userAction: null
  },
  SESSION_REQUIRED: {
    code: 'SESSION_REQUIRED',
    status: 400,
    message: 'Unable to identify your shopping session.',
    userAction: 'Please refresh the page and try again.'
  },

  // Generic errors
  OPERATION_FAILED: {
    code: 'OPERATION_FAILED',
    status: 500,
    message: 'Something went wrong with your cart.',
    userAction: 'Please try again. If the problem persists, contact support.'
  }
} as const;

export type CartErrorCode = keyof typeof CartErrors;

/**
 * Cart Error class for structured error handling
 */
export class CartError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly userMessage: string;
  public readonly userAction: string | null;
  public readonly details: Record<string, any>;
  public readonly isOperational: boolean = true;

  constructor(
    type: CartErrorCode,
    details?: Record<string, any>
  ) {
    const errorDef = CartErrors[type];
    const message = 'messageTemplate' in errorDef && details?.available !== undefined
      ? (errorDef as any).messageTemplate(details.available)
      : errorDef.message;
    
    super(message);
    
    this.code = errorDef.code;
    this.status = errorDef.status;
    this.userMessage = message;
    this.userAction = errorDef.userAction;
    this.details = details || {};
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, CartError.prototype);
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      userAction: this.userAction,
      ...(Object.keys(this.details).length > 0 && { details: this.details })
    };
  }

  /**
   * Create error response object
   */
  toResponse() {
    return {
      success: false,
      error: this.toJSON()
    };
  }
}

/**
 * Type guard to check if error is a CartError
 */
export function isCartError(error: unknown): error is CartError {
  return error instanceof CartError;
}

/**
 * Factory function to create CartError from error code
 */
export function createCartError(code: CartErrorCode, details?: Record<string, any>): CartError {
  return new CartError(code, details);
}
