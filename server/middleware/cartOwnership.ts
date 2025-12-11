/**
 * Cart Ownership Middleware
 * 
 * Validates that the requesting user/session owns the cart item being modified.
 * Prevents users from modifying other users' carts (critical security fix).
 * 
 * @module middleware/cartOwnership
 */

import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/supabase';
import { cartItems, carts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { CartError } from '../utils/cartErrors';

/**
 * Validates cart item ownership before allowing modification
 * 
 * Checks:
 * 1. Cart item exists
 * 2. Cart item belongs to a cart
 * 3. Cart belongs to the requesting user (if authenticated) or session (if guest)
 * 
 * @throws CartError CART_ITEM_NOT_FOUND if item doesn't exist
 * @throws CartError FORBIDDEN if user/session doesn't own the cart
 */
export async function validateCartOwnership(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const itemId = req.params.id;
    const userId = (req as any).user?.user_id as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;

    // Must have either userId or sessionId
    if (!userId && !sessionId) {
      throw new CartError('SESSION_REQUIRED');
    }

    // Fetch cart item with its parent cart
    const items = await db
      .select({
        itemId: cartItems.id,
        cartId: cartItems.cart_id,
        cartUserId: carts.user_id,
        cartSessionId: carts.session_id,
      })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cart_id, carts.id))
      .where(eq(cartItems.id, itemId))
      .limit(1);

    if (items.length === 0) {
      throw new CartError('CART_ITEM_NOT_FOUND');
    }

    const item = items[0];

    // Validate ownership
    const isOwner = userId
      ? item.cartUserId === userId  // Authenticated user must match
      : item.cartSessionId === sessionId;  // Guest session must match

    if (!isOwner) {
      console.warn(`[CART_SECURITY] Ownership violation: user=${userId}, session=${sessionId}, cartUser=${item.cartUserId}, cartSession=${item.cartSessionId}`);
      throw new CartError('FORBIDDEN');
    }

    // Attach cart info to request for downstream handlers
    (req as any).cartItem = {
      id: item.itemId,
      cartId: item.cartId
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates cart ownership (not item) for bulk operations
 * Use this for operations that work on the entire cart
 */
export async function validateCartAccess(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const cartId = req.params.cartId || req.body.cartId;
    const userId = (req as any).user?.user_id as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;

    if (!cartId) {
      throw new CartError('CART_NOT_FOUND');
    }

    if (!userId && !sessionId) {
      throw new CartError('SESSION_REQUIRED');
    }

    const cartResult = await db
      .select({
        id: carts.id,
        userId: carts.user_id,
        sessionId: carts.session_id,
      })
      .from(carts)
      .where(eq(carts.id, cartId))
      .limit(1);

    if (cartResult.length === 0) {
      throw new CartError('CART_NOT_FOUND');
    }

    const cart = cartResult[0];

    const isOwner = userId
      ? cart.userId === userId
      : cart.sessionId === sessionId;

    if (!isOwner) {
      throw new CartError('FORBIDDEN');
    }

    (req as any).cart = cart;
    next();
  } catch (error) {
    next(error);
  }
}
