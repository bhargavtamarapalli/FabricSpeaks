/**
 * Cart Cleanup Job
 * 
 * Utility to clean up expired guest carts from the database.
 * Should be run as a scheduled job (e.g., daily cron).
 * 
 * @module jobs/cleanupCarts
 */

import { db } from '../db/supabase';
import { carts, cartItems } from '../../shared/schema';
import { lt, and, isNotNull, isNull, sql } from 'drizzle-orm';
import { CartConfig } from '../../shared/config/cart.config';

/**
 * Clean up expired guest carts
 * Guest carts without activity for GUEST_CART_EXPIRY_DAYS are deleted
 */
export async function cleanupExpiredCarts(): Promise<{ deletedCarts: number; deletedItems: number }> {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - CartConfig.GUEST_CART_EXPIRY_DAYS);

  console.log(`[CART_CLEANUP] Starting cleanup of carts older than ${expirationDate.toISOString()}`);

  try {
    // Find expired guest carts (session_id present, user_id null, old created_at)
    const expiredCarts = await db.select({ id: carts.id })
      .from(carts)
      .where(
        and(
          isNotNull(carts.session_id),
          isNull(carts.user_id),
          lt(carts.created_at, expirationDate)
        )
      );

    if (expiredCarts.length === 0) {
      console.log('[CART_CLEANUP] No expired carts found');
      return { deletedCarts: 0, deletedItems: 0 };
    }

    const cartIds = expiredCarts.map(c => c.id);
    console.log(`[CART_CLEANUP] Found ${cartIds.length} expired guest carts`);

    // Delete cart items first (due to foreign key constraint)
    const itemsResult = await db.delete(cartItems)
      .where(sql`${cartItems.cart_id} = ANY(${cartIds})`);
    
    // Delete the carts
    const cartsResult = await db.delete(carts)
      .where(sql`${carts.id} = ANY(${cartIds})`);

    console.log(`[CART_CLEANUP] Deleted ${cartIds.length} carts and their items`);

    return { 
      deletedCarts: cartIds.length, 
      deletedItems: 0  // Drizzle doesn't return count for delete
    };
  } catch (error) {
    console.error('[CART_CLEANUP] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Clean up abandoned carts for authenticated users
 * Carts with no items that haven't been updated in 30 days
 */
export async function cleanupAbandonedUserCarts(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log(`[CART_CLEANUP] Checking for abandoned user carts older than ${thirtyDaysAgo.toISOString()}`);

  try {
    // Find user carts with no items that are old
    const emptyOldCarts = await db.execute(sql`
      DELETE FROM carts 
      WHERE user_id IS NOT NULL 
        AND updated_at < ${thirtyDaysAgo}
        AND id NOT IN (SELECT DISTINCT cart_id FROM cart_items)
      RETURNING id
    `);

    const count = (emptyOldCarts as any).length || 0;
    console.log(`[CART_CLEANUP] Deleted ${count} abandoned user carts`);

    return count;
  } catch (error) {
    console.error('[CART_CLEANUP] Error cleaning abandoned user carts:', error);
    return 0;
  }
}

/**
 * Run all cleanup tasks
 */
export async function runCartCleanup(): Promise<void> {
  console.log('[CART_CLEANUP] Starting full cart cleanup...');
  
  const guestResult = await cleanupExpiredCarts();
  const userResult = await cleanupAbandonedUserCarts();
  
  console.log(`[CART_CLEANUP] Cleanup complete:`, {
    expiredGuestCarts: guestResult.deletedCarts,
    abandonedUserCarts: userResult
  });
}
