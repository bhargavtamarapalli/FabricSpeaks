/**
 * Cart Handlers
 * 
 * Express route handlers for cart operations.
 * Refactored with:
 * - Server-side price lookup (never trust client)
 * - Proper error handling with user-friendly messages
 * - Support for both authenticated and guest users
 * 
 * @module cart
 */

import type { Request, Response, NextFunction } from "express";
import { SupabaseCartsRepository } from "./db/repositories/supabase-carts";
import { requireAuth } from "./middleware/auth";
import { cartService } from "./services/cartService";
import { CartError, isCartError } from "./utils/cartErrors";
import { CartConfig } from "../shared/config/cart.config";

export const cartsRepo = new SupabaseCartsRepository();
export const requireAuthMw = requireAuth;

/**
 * Helper to get user ID or session ID from request
 */
function getIdentity(req: Request): { userId: string | null; sessionId: string | null } {
  const userId = (req as any).user?.user_id as string | null || null;
  const sessionId = req.headers['x-session-id'] as string | null || null;
  return { userId, sessionId };
}

/**
 * GET /api/cart
 * Fetch user's cart or guest cart
 */
export async function getCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, sessionId } = getIdentity(req);

    console.log(`[CART] Get Cart - User: ${userId || 'GUEST'}, Session: ${sessionId || 'NONE'}`);

    if (userId) {
      const cart = await cartsRepo.getOrCreate(userId);
      console.log(`[CART] User Cart ${cart.id}: ${cart.items.length} items`);
      return res.json({ success: true, ...cart });
    }

    if (!sessionId) {
      throw new CartError('SESSION_REQUIRED');
    }

    const cart = await cartsRepo.getOrCreateBySession(sessionId);
    console.log(`[CART] Guest Cart ${cart.id}: ${cart.items.length} items`);
    return res.json({ success: true, ...cart });

  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cart/items
 * Add item to cart with server-side price validation
 */
export async function addCartItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, sessionId } = getIdentity(req);

    // Accept both snake_case and camelCase
    const productId = req.body.product_id || req.body.productId;
    const variantId = req.body.variant_id || req.body.variantId || null;
    const quantity = req.body.quantity;
    const size = req.body.size || null;
    const colour = req.body.colour || null;

    console.log(`[CART] Add Item Request:`, {
      userId: userId || 'GUEST',
      sessionId: sessionId || 'NONE',
      productId,
      variantId,
      quantity,
      size,
      colour,
      body: req.body
    });

    // Validate required fields
    if (!productId) {
      console.error('[CART] Missing productId');
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product ID is required',
          userAction: 'Please try again.'
        }
      });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      console.error('[CART] Invalid quantity:', quantity, typeof quantity);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Please select a valid quantity',
          userAction: 'Quantity must be at least 1.'
        }
      });
    }

    // Validate item can be added (stock, price, etc.)
    console.log('[CART] Validating item addition...');
    const validation = await cartService.validateItemAddition(productId, variantId, quantity);

    console.log('[CART] Validation result:', validation);

    if (!validation.valid) {
      console.log('[CART] Validation failed:', validation.error);
      const errorResponse = validation.error?.toJSON?.() || {
        code: 'VALIDATION_FAILED',
        message: 'Unable to add item to cart',
        userAction: 'Please try again.'
      };
      return res.status(validation.error?.status || 400).json({
        success: false,
        error: errorResponse
      });
    }

    // Get or create cart
    let cart;
    if (userId) {
      console.log('[CART] Getting user cart for:', userId);
      cart = await cartsRepo.getOrCreate(userId);
    } else {
      if (!sessionId) {
        console.error('[CART] No session ID for guest user');
        return res.status(400).json({
          success: false,
          error: {
            code: 'SESSION_REQUIRED',
            message: 'Unable to identify your session',
            userAction: 'Please refresh the page and try again.'
          }
        });
      }
      console.log('[CART] Getting guest cart for session:', sessionId);
      cart = await cartsRepo.getOrCreateBySession(sessionId);
    }

    console.log('[CART] Cart found/created:', cart.id, 'with', cart.items.length, 'items');

    // Check cart item limit
    if (cart.items.length >= CartConfig.MAX_ITEMS_PER_CART) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MAX_ITEMS_EXCEEDED',
          message: `Your cart has reached the maximum of ${CartConfig.MAX_ITEMS_PER_CART} items`,
          userAction: 'Please remove some items before adding more.'
        }
      });
    }

    // Add item with SERVER-SIDE PRICE (critical security fix)
    const serverPrice = validation.data!.currentPrice;
    console.log('[CART] Adding item with server price:', serverPrice);

    const updated = await cartsRepo.addItem(cart.id, productId, serverPrice, quantity, size, variantId, colour);

    console.log(`[CART] Success: Added ${validation.data!.productName} x${quantity} @ ₹${serverPrice}`);

    return res.json({
      success: true,
      ...updated,
      message: `Added ${validation.data!.productName} to cart`
    });

  } catch (error: any) {
    console.error('[CART] Unexpected error in addCartItemHandler:', error);

    // Handle CartError directly instead of passing to next()
    if (isCartError(error)) {
      return res.status(error.status).json(error.toResponse());
    }

    // Unknown error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        userAction: 'If the problem persists, please contact support.'
      }
    });
  }
}

/**
 * PUT /api/cart/items/:id
 * Update cart item quantity
 * Note: Ownership is validated by cartOwnership middleware
 */
export async function updateCartItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log(`[CART] Update Item ${id} - New Qty: ${quantity}`);

    if (typeof quantity !== 'number') {
      throw new CartError('INVALID_QUANTITY');
    }

    // Get current item for validation
    const cartItem = (req as any).cartItem;
    if (!cartItem) {
      throw new CartError('CART_ITEM_NOT_FOUND');
    }

    // Get item details for stock validation
    const existingItem = await cartsRepo.getCartItem(id);
    if (!existingItem) {
      throw new CartError('CART_ITEM_NOT_FOUND');
    }

    // Validate quantity change
    const validation = await cartService.validateQuantityUpdate(
      existingItem.product_id,
      existingItem.variant_id || null,
      quantity,
      existingItem.quantity
    );

    if (!validation.valid) {
      throw validation.error;
    }

    const updated = await cartsRepo.updateItemQuantity(id, quantity);

    console.log(`[CART] Updated item ${id} to qty ${quantity}`);

    return res.json({
      success: true,
      ...updated,
      message: 'Cart updated'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 * Note: Ownership is validated by cartOwnership middleware
 */
export async function removeCartItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    console.log(`[CART] Remove Item ${id}`);

    const updated = await cartsRepo.removeItem(id);

    return res.json({
      success: true,
      ...updated,
      message: 'Item removed from cart'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cart/merge
 * Merge guest cart into user cart on login
 */
export async function mergeGuestCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please log in to continue'
        }
      });
    }

    const sessionId = req.body.sessionId || req.body.session_id;

    if (!sessionId) {
      throw new CartError('SESSION_REQUIRED');
    }

    console.log(`[CART] Merging guest cart ${sessionId} into user ${userId}`);

    const mergedCart = await cartsRepo.mergeGuestCart(userId, sessionId);

    console.log(`[CART] Merge complete: ${mergedCart.items.length} items`);

    return res.json({
      success: true,
      ...mergedCart,
      message: 'Your cart items have been saved to your account'
    });

  } catch (error) {
    next(error);
  }
}
