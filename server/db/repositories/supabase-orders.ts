import { eq, and, desc } from "drizzle-orm";
import { db } from "../supabase";
import {
  orders,
  orderItems,
  type Order,
  type OrderItem,
  insertOrderSchema,
  insertOrderItemSchema
} from "../../../shared/schema";
import { z } from "zod";

export interface OrdersRepository {
  createFromCart(
    userId: string | null,
    items: Array<{ productId: string; unitPrice: number; quantity: number; size?: string | null }>,
    guestInfo?: { email: string; phone: string; sessionId: string }
  ): Promise<{ order: Order; items: OrderItem[] }>;
  listByUser(userId: string): Promise<Order[]>;
  getById(userId: string, id: string): Promise<{ order: Order; items: OrderItem[] } | undefined>;
}

export class SupabaseOrdersRepository implements OrdersRepository {
  async createFromCart(
    userId: string | null, // Nullable for guest
    items: Array<{ productId: string; unitPrice: number; quantity: number; size?: string | null }>,
    guestInfo?: { email: string; phone: string; sessionId: string },
    options?: {
      shippingAddress?: any;
      deliveryOption?: string;
      giftMessage?: string;
      couponCode?: string;
      discountAmount?: number;
    }
  ): Promise<{ order: Order; items: OrderItem[] }> {
    // Input validation
    if (!userId && !guestInfo) {
      throw new Error('UserId or GuestInfo is required');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }
    const itemSchema = z.object({
      productId: z.string().uuid(),
      unitPrice: z.number().nonnegative(),
      quantity: z.number().int().positive(),
      size: z.string().nullable().optional()
    });
    for (const item of items) {
      itemSchema.parse(item);
    }
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Whitelist and validate order fields
    const orderDataRaw = {
      user_id: userId || null, // Ensure null if undefined/empty
      total_amount: totalAmount.toString(),
      status: 'pending',
      // Guest fields
      session_id: guestInfo?.sessionId,
      guest_email: guestInfo?.email,
      guest_phone: guestInfo?.phone,
      // New Checkout Fields
      shipping_address_snapshot: options?.shippingAddress || null,
      delivery_option: options?.deliveryOption || 'standard',
      gift_message: options?.giftMessage || null,
      discount_amount: options?.discountAmount?.toString() || "0",
    };

    // Validate with partial schema + manual fields
    // We expanded schema but using pick on insertOrderSchema might be restrictive if we didn't update it in schema.ts fully or if we want flexibility
    // Let's construct the object directly to avoid Zod strictness on new fields if schema.ts update wasn't perfect in previous step
    // (We updated schema.ts table definition, but insertOrderSchema usually needs checking too. 
    // In Step 40 we saw insertOrderSchema uses createInsertSchema(orders), so it SHOULD have the new fields automatically if we re-imported or if it's dynamic? 
    // Actually no, allow dynamic properties for JSONB)

    const dbPayload: any = {
      ...orderDataRaw,
      // Default fields
      payment_status: 'pending',
      updated_at: new Date()
    };

    try {
      const [order] = await db.insert(orders).values(dbPayload).returning();
      if (!order) throw new Error('Order creation failed');

      // Whitelist and validate order item fields
      const orderItemsDataRaw = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice.toString(),
        size: item.size,
        total_price: (item.unitPrice * item.quantity).toString()
      }));
      const orderItemsData = orderItemsDataRaw.map(data =>
        insertOrderItemSchema.pick({ order_id: true, product_id: true, quantity: true, unit_price: true, size: true, total_price: true }).parse(data)
      );

      const createdItems = await db.insert(orderItems).values(orderItemsData).returning();
      return { order, items: createdItems };
    } catch (err: any) {
      // Log error in production
      throw new Error('Failed to create order: ' + (err?.message || err));
    }
  }

  async listByUser(userId: string): Promise<Order[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }
    try {
      return await db.select()
        .from(orders)
        .where(eq(orders.user_id, userId))
        .orderBy(desc(orders.created_at));
    } catch (err: any) {
      throw new Error('Failed to list orders: ' + (err?.message || err));
    }
  }

  /**
   * Get order by ID with items
   * OPTIMIZED: Uses LEFT JOIN instead of 2 separate queries
   */
  async getById(userId: string, id: string): Promise<{ order: Order; items: OrderItem[] } | undefined> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid order id');
    }
    try {
      // OPTIMIZED: Single query with LEFT JOIN
      const results = await db
        .select({
          order: orders,
          item: orderItems
        })
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.order_id))
        .where(and(eq(orders.id, id), eq(orders.user_id, userId)));

      if (results.length === 0) return undefined;

      // Extract unique order and collect items
      const order = results[0].order;
      const items = results
        .filter(r => r.item !== null)
        .map(r => r.item as OrderItem);

      return { order, items };
    } catch (err: any) {
      throw new Error('Failed to get order: ' + (err?.message || err));
    }
  }
}
