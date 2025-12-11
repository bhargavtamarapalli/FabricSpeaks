/**
 * Admin Order Management Routes
 * Allows admin app to update order status and trigger notifications
 */

import { Router, Request, Response } from "express";
import { supabase } from "./db/supabase";
import { db } from "./db/supabase";
import { orders, users } from "../shared/schema";
import { eq, inArray, ilike, or, and, desc, sql, count } from "drizzle-orm";
import { sendOrderStatusUpdateEmail } from "./utils/email";
import { requireAdmin } from "./middleware/auth";
import { logAuditAction } from "./audit";

const router = Router();

/**
 * GET /api/admin/orders
 * List orders with filtering and search
 */
router.get("/orders", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus, 
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status as string));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.payment_status, paymentStatus as string));
    }

    if (search) {
      const searchStr = `%${search}%`;
      conditions.push(or(
        ilike(orders.id, searchStr),
        ilike(users.username, searchStr),
        ilike(users.email, searchStr),
        ilike(users.full_name, searchStr)
      ));
    }

    // Main query
    const results = await db
      .select({
        order: orders,
        user: {
          username: users.username,
          email: users.email,
          full_name: users.full_name
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.user_id, users.user_id))
      .where(and(...conditions))
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(orders.created_at));

    // Count query
    const countResult = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .leftJoin(users, eq(orders.user_id, users.user_id))
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Format response
    const formattedOrders = results.map(({ order, user }) => ({
      ...order,
      customer: user
    }));

    res.json({
      data: formattedOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("Error listing admin orders:", error);
    res.status(500).json({ error: "Failed to list orders" });
  }
});

/**
 * PUT /api/admin/orders/status
 * Update order status and send notification email to customer
 * Requires admin authentication
 */
router.put("/orders/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "orderIds array is required" });
    }

    if (!status || !["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    // Update order status in database
    await (db as any).update(orders)
      .set({
        status: status as any,
        updated_at: new Date()
      })
      .where(inArray(orders.id, orderIds));

    // Fetch updated orders with customer info to send emails
    const { data: updatedOrders, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        profiles (username, email)
      `)
      .in("id", orderIds);

    if (fetchError) throw fetchError;

    // Send status update email to each customer (best-effort)
    const emailPromises = (updatedOrders || []).map(async (order: any) => {
      try {
        const customerEmail = order.profiles?.email || `${order.profiles?.username}@fabric-speaks.local`;
        if (customerEmail) {
          await sendOrderStatusUpdateEmail({
            to: customerEmail,
            orderId: order.id,
            status: status.charAt(0).toUpperCase() + status.slice(1),
          });
        }
      } catch (emailErr) {
        console.error(`Failed to send status email for order ${order.id}:`, (emailErr as any)?.message || emailErr);
        // Don't fail the request if email fails
      }
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Updated status for ${orderIds.length} order(s) to ${status}`,
      updatedCount: orderIds.length,
    });

    // Audit Log
    await logAuditAction((req as any).user.user_id, 'update_order_status', 'order', 'bulk', { orderIds, status }, req);
  } catch (error: any) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      error: error?.message || "Failed to update order status",
    });
  }
});

/**
 * PUT /api/admin/orders/tracking
 * Update tracking numbers and notify customer
 * Requires admin authentication
 * OPTIMIZED: Uses batch operations instead of N+1 loop
 */
router.put("/orders/tracking", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderUpdates } = req.body; // Array of { orderId, trackingNumber }

    if (!orderUpdates || !Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      return res.status(400).json({ error: "orderUpdates array is required" });
    }

    // Validate all updates first
    for (const update of orderUpdates) {
      if (!update.orderId || !update.trackingNumber) {
        return res.status(400).json({ error: "Each update must have orderId and trackingNumber" });
      }
    }

    // OPTIMIZED: Batch update all orders in one query using SQL CASE
    const orderIds = orderUpdates.map((u: any) => u.orderId);
    
    // Update each order's tracking number (drizzle doesn't support CASE, so we do individual updates but in parallel)
    await Promise.all(orderUpdates.map((update: any) => 
      (db as any).update(orders)
        .set({
          tracking_number: update.trackingNumber,
          updated_at: new Date()
        })
        .where(eq(orders.id, update.orderId))
    ));

    // OPTIMIZED: Single batch fetch for all orders with customer info
    const { data: ordersWithProfiles, error: fetchError } = await supabase
      .from("orders")
      .select("id, tracking_number, profiles(username, email)")
      .in("id", orderIds);

    if (fetchError) throw fetchError;

    // Create a map for quick lookup
    const trackingMap = new Map(orderUpdates.map((u: any) => [u.orderId, u.trackingNumber]));

    // Send tracking notification emails (best-effort, in parallel)
    const emailPromises = (ordersWithProfiles || []).map(async (order: any) => {
      if (order?.profiles) {
        try {
          const customerEmail = order.profiles.email || `${order.profiles.username}@fabric-speaks.local`;
          const trackingNumber = trackingMap.get(order.id);
          if (customerEmail && trackingNumber) {
            await sendOrderStatusUpdateEmail({
              to: customerEmail,
              orderId: order.id,
              status: `Shipped - Tracking: ${trackingNumber}`,
            });
          }
        } catch (emailErr) {
          console.error(`Failed to send tracking email for order ${order.id}:`, (emailErr as any)?.message || emailErr);
        }
      }
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Updated tracking for ${orderUpdates.length} order(s)`,
      updatedCount: orderUpdates.length,
    });

    // Audit Log
    await logAuditAction((req as any).user.user_id, 'update_order_tracking', 'order', 'bulk', { orderUpdates }, req);
  } catch (error: any) {
    console.error("Error updating tracking numbers:", error);
    res.status(500).json({
      error: error?.message || "Failed to update tracking numbers",
    });
  }
});

export default router;
