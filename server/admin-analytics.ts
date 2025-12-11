import { Request, Response } from "express";
import { db } from "./db/supabase";
import { orders, orderItems, products, addresses, categories } from "../shared/schema";
import { sql, eq, and, desc, count, sum } from "drizzle-orm";

/* -------------------------------------------------------------------------
   1. Revenue Chart (Last 30 Days)
-------------------------------------------------------------------------- */
export async function getRevenueAnalyticsHandler(req: Request, res: Response) {
  try {
    console.log('[ANALYTICS] Revenue request received');
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        SUM(total_amount) as revenue,
        COUNT(id) as orders
      FROM ${orders}
      WHERE payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    console.log('[ANALYTICS] Revenue query successful, rows:', result.length);

    // Format for Recharts
    const data = result.map((row: any) => ({
      name: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(row.revenue),
      orders: Number(row.orders)
    }));

    console.log('[ANALYTICS] Revenue data formatted, returning', data.length, 'items');
    return res.json(data);
  } catch (error) {
    console.error("[ANALYTICS] Revenue Error:", error);
    console.error("[ANALYTICS] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: "Failed to fetch revenue data" });
  }
}

/* -------------------------------------------------------------------------
   2. Top Products
-------------------------------------------------------------------------- */
export async function getTopProductsHandler(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as sales,
        SUM(oi.total_price) as revenue
      FROM ${orderItems} oi
      JOIN ${products} p ON oi.product_id = p.id
      JOIN ${orders} o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY p.id, p.name
      ORDER BY sales DESC
      LIMIT 5
    `);

    const data = result.map((row: any) => ({
      id: row.id,
      name: row.name,
      sales: Number(row.sales),
      revenue: Number(row.revenue),
      growth: 0 // Placeholder: would require comparing with previous period
    }));

    return res.json(data);
  } catch (error) {
    console.error("Top Products Error:", error);
    return res.status(500).json({ message: "Failed to fetch top products" });
  }
}

/* -------------------------------------------------------------------------
   3. Customer Growth
-------------------------------------------------------------------------- */
export async function getCustomerGrowthHandler(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(user_id) as customers
      FROM profiles
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    const data = result.map((row: any) => ({
      name: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      customers: Number(row.customers)
    }));

    return res.json(data);
  } catch (error) {
    console.error("Customer Growth Error:", error);
    return res.status(500).json({ message: "Failed to fetch customer growth" });
  }
}

/* -------------------------------------------------------------------------
   4. Sales by Region
-------------------------------------------------------------------------- */
export async function getSalesByRegionHandler(req: Request, res: Response) {
  try {
    // Get total sales first for percentage calculation
    const totalResult = await db.execute(sql`
      SELECT SUM(total_amount) as total
      FROM ${orders}
      WHERE payment_status = 'paid'
    `);
    const totalSales = Number(totalResult[0]?.total || 0);

    const result = await db.execute(sql`
      SELECT 
        a.city as region,
        SUM(o.total_amount) as sales
      FROM ${orders} o
      JOIN ${addresses} a ON o.shipping_address_id = a.id
      WHERE o.payment_status = 'paid'
      GROUP BY a.city
      ORDER BY sales DESC
      LIMIT 5
    `);

    const data = result.map((row: any) => ({
      region: row.region,
      sales: Number(row.sales),
      percentage: totalSales > 0 ? Math.round((Number(row.sales) / totalSales) * 100) : 0
    }));

    return res.json(data);
  } catch (error) {
    console.error("Sales by Region Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales by region" });
  }
}

/* -------------------------------------------------------------------------
   5. Sales by Category (Aliased as getCategoryPerformanceHandler)
-------------------------------------------------------------------------- */
export async function getCategoryPerformanceHandler(req: Request, res: Response) {
  try {
    console.log('[ANALYTICS] Sales by category request received');
    const result = await db.execute(sql`
      SELECT 
        c.name as category,
        SUM(oi.total_price) as sales
      FROM ${orderItems} oi
      JOIN ${products} p ON oi.product_id = p.id
      JOIN ${categories} c ON p.category_id = c.id
      JOIN ${orders} o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY c.name
      ORDER BY sales DESC
      LIMIT 5
    `);

    console.log('[ANALYTICS] Sales by category query successful, rows:', result.length);

    // Define colors for categories (can be dynamic or fixed)
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

    const data = result.map((row: any, index: number) => ({
      category: row.category,
      value: Number(row.sales),
      color: colors[index % colors.length]
    }));

    console.log('[ANALYTICS] Sales by category data formatted, returning', data.length, 'items');
    return res.json(data);
  } catch (error) {
    console.error("[ANALYTICS] Sales by Category Error:", error);
    console.error("[ANALYTICS] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ message: "Failed to fetch sales by category" });
  }
}

// Alias for compatibility
export const getSalesByCategoryHandler = getCategoryPerformanceHandler;

/* -------------------------------------------------------------------------
   6. Sales Overview (Recent Orders)
-------------------------------------------------------------------------- */
export async function getSalesOverviewHandler(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT 
        o.id,
        p.full_name as customer,
        o.total_amount as amount,
        o.status,
        o.created_at as date
      FROM ${orders} o
      LEFT JOIN profiles p ON o.user_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    const data = result.map((row: any) => ({
      id: row.id,
      customer: row.customer || 'Guest',
      amount: Number(row.amount),
      status: row.status,
      date: row.date
    }));

    return res.json(data);
  } catch (error) {
    console.error("Sales Overview Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales overview" });
  }
}

/* -------------------------------------------------------------------------
   7. Export Report
-------------------------------------------------------------------------- */
export async function exportReportHandler(req: Request, res: Response) {
  try {
    // For now, just return a success message as this would typically generate a CSV/PDF
    // This is a placeholder for the actual export implementation
    return res.json({ message: "Export functionality coming soon" });
  } catch (error) {
    console.error("Export Report Error:", error);
    return res.status(500).json({ message: "Failed to export report" });
  }
}
