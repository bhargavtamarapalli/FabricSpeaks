import { db } from "../db/supabase";
import { reservations, products, productVariants } from "../../shared/schema";
import { eq, and, lt, sum, sql } from "drizzle-orm";

const RESERVATION_TIMEOUT_MINUTES = 15;

export class InventoryReservationService {
  /**
   * Reserve stock for a user
   */
  async reserveStock(
    userId: string | null,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    sessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Clean up expired reservations first
      await this.cleanupExpiredReservations();

      // 2. Check availability for all items
      for (const item of items) {
        const available = await this.getAvailableStock(item.productId, item.variantId);
        if (available < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for product ${item.productId}. Available: ${available}, Requested: ${item.quantity}`
          };
        }
      }

      // 3. Create reservations
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TIMEOUT_MINUTES);

      for (const item of items) {
        await db.insert(reservations).values({
          user_id: userId, // Can be null
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          expires_at: expiresAt,
          status: 'active',
          session_id: sessionId
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Reservation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm reservations (convert to permanent deduction)
   * This should be called after successful payment
   */
  async confirmReservation(userId: string | null, sessionId?: string): Promise<void> {
    let whereClause;
    if (userId) {
      whereClause = and(eq(reservations.user_id, userId), eq(reservations.status, 'active'));
    } else if (sessionId) {
      whereClause = and(eq(reservations.session_id, sessionId), eq(reservations.status, 'active'));
    } else {
      return;
    }

    await db
      .update(reservations)
      .set({ status: 'confirmed' })
      .where(whereClause);
  }

  /**
   * Release reservations (e.g., payment failed or cancelled)
   */
  async releaseReservation(userId: string | null, sessionId?: string): Promise<void> {
    let whereClause;
    if (userId) {
        whereClause = and(eq(reservations.user_id, userId), eq(reservations.status, 'active'));
    } else if (sessionId) {
        whereClause = and(eq(reservations.session_id, sessionId), eq(reservations.status, 'active'));
    } else {
        return;
    }

    await db.delete(reservations).where(whereClause);
  }

  /**
   * Get available stock (Total Stock - Active Reservations)
   */
  async getAvailableStock(productId: string, variantId?: string): Promise<number> {
    // Get total physical stock
    let totalStock = 0;
    
    if (variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, variantId)
      });
      totalStock = variant?.stock_quantity || 0;
    } else {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId)
      });
      totalStock = product?.stock_quantity || 0;
    }

    // Get active reserved quantity
    const reservedResult = await db
      .select({ total: sum(reservations.quantity) })
      .from(reservations)
      .where(and(
        eq(reservations.product_id, productId),
        variantId ? eq(reservations.variant_id, variantId) : sql`${reservations.variant_id} IS NULL`,
        eq(reservations.status, 'active'),
        sql`${reservations.expires_at} > NOW()`
      ));

    const reservedQuantity = Number(reservedResult[0]?.total) || 0;

    return Math.max(0, totalStock - reservedQuantity);
  }

  /**
   * Cleanup expired reservations
   */
  async cleanupExpiredReservations(): Promise<void> {
    await db
      .delete(reservations)
      .where(and(
        eq(reservations.status, 'active'),
        lt(reservations.expires_at, new Date())
      ));
  }
}

export const inventoryReservationService = new InventoryReservationService();
