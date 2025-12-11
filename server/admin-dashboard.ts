import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { orders, products, users, productVariants } from "../shared/schema";
import { sql, eq, count, sum, lte } from "drizzle-orm";
import { requireAdmin } from "./middleware/auth";

export async function getDashboardStatsHandler(req: Request, res: Response) {
  try {
    // 1. Revenue Stats
    const [revenueResult] = await db
      .select({
        total: sum(orders.total_amount)
      })
      .from(orders)
      .where(eq(orders.payment_status, 'paid'));

    // 2. Order Stats
    const [ordersResult] = await db
      .select({
        total: count(orders.id)
      })
      .from(orders);

    const [pendingOrders] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const [processingOrders] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(eq(orders.status, 'processing'));

    const [completedOrders] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(eq(orders.status, 'delivered')); // Assuming 'delivered' is completed

    const [cancelledOrders] = await db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(eq(orders.status, 'cancelled'));

    // 3. Product Stats
    const [productsResult] = await db
      .select({
        total: count(products.id)
      })
      .from(products);

    const [activeProducts] = await db
      .select({ count: count(products.id) })
      .from(products)
      .where(eq(products.status, 'active'));

    // Low stock - check variants with stock below threshold (using default of 10)
    const lowStockVariants = await db
      .select({
        count: count(productVariants.id)
      })
      .from(productVariants)
      .where(lte(productVariants.stock_quantity, 10));

    const outOfStockVariants = await db
      .select({
        count: count(productVariants.id)
      })
      .from(productVariants)
      .where(eq(productVariants.stock_quantity, 0));

    // 4. Customer Stats
    const [customersResult] = await db
      .select({
        total: count(users.user_id)
      })
      .from(users);

    // 5. Recent Orders (Last 5) - Kept for reference but not part of DashboardStats interface directly
    // The frontend fetches recent orders separately in a mock query currently, 
    // but we can return it if we want to update the frontend to use it.
    // For now, we stick to the DashboardStats interface.

    const totalRevenue = Number(revenueResult?.total || 0);
    const totalOrders = Number(ordersResult?.total || 0);

    const stats = {
      revenue: {
        total: totalRevenue,
        trend: 0, // TODO: Calculate trend
        previousPeriod: 0
      },
      orders: {
        total: totalOrders,
        trend: 0,
        pending: Number(pendingOrders?.count || 0),
        processing: Number(processingOrders?.count || 0),
        completed: Number(completedOrders?.count || 0),
        cancelled: Number(cancelledOrders?.count || 0)
      },
      customers: {
        total: Number(customersResult?.total || 0),
        trend: 0,
        new: 0, // TODO: Calculate new customers
        returning: 0,
        retentionRate: 0
      },
      products: {
        total: Number(productsResult?.total || 0),
        active: Number(activeProducts?.count || 0),
        lowStock: Number(lowStockVariants[0]?.count || 0),
        outOfStock: Number(outOfStockVariants[0]?.count || 0)
      },
      averageOrderValue: {
        value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        trend: 0
      },
      conversionRate: {
        value: 0, // Needs visitor tracking
        trend: 0
      },
      inventoryValue: 0 // Needs cost price
    };

    return res.json(stats);

  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch dashboard stats" 
    });
  }
}
