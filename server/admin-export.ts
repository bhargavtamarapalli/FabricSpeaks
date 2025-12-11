import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { profiles, orders, products, orderItems } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Export Admin Data Handler
 * Exports various admin data types to CSV format
 */
export async function exportDataHandler(req: Request, res: Response) {
  try {
    const { type, format = 'csv' } = req.query;

    console.log('[EXPORT] Export request:', { type, format });

    if (format !== 'csv') {
      return res.status(400).json({ error: "Only CSV format is supported" });
    }

    let csvData: string;
    let filename: string;

    switch (type) {
      case 'customers':
        csvData = await exportCustomers();
        filename = `customers_${Date.now()}.csv`;
        break;

      case 'orders':
        csvData = await exportOrders();
        filename = `orders_${Date.now()}.csv`;
        break;

      case 'products':
        csvData = await exportProducts();
        filename = `products_${Date.now()}.csv`;
        break;

      default:
        return res.status(400).json({ error: "Invalid export type" });
    }

    console.log('[EXPORT] CSV generated, size:', csvData.length, 'bytes');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

  } catch (error) {
    console.error('[EXPORT] Error:', error);
    return res.status(500).json({ error: "Failed to export data" });
  }
}

/**
 * Export customers to CSV
 */
async function exportCustomers(): Promise<string> {
  console.log('[EXPORT] Fetching customers...');

  const customers = await db
    .select({
      user_id: profiles.user_id,
      username: profiles.username,
      email: profiles.email,
      phone: profiles.phone,
      role: profiles.role,
      created_at: profiles.created_at,
      total_orders: sql<number>`(
        SELECT COUNT(*) 
        FROM ${orders} 
        WHERE ${orders.user_id} = ${profiles.user_id}
      )`,
      total_spent: sql<number>`(
        SELECT COALESCE(SUM(${orders.total_amount}), 0)
        FROM ${orders}
        WHERE ${orders.user_id} = ${profiles.user_id}
        AND ${orders.payment_status} = 'paid'
      )`,
      last_order_date: sql<string>`(
        SELECT MAX(${orders.created_at})
        FROM ${orders}
        WHERE ${orders.user_id} = ${profiles.user_id}
      )`,
    })
    .from(profiles);

  console.log('[EXPORT] Customers fetched:', customers.length);

  // CSV headers
  const headers = [
    'User ID',
    'Username',
    'Email',
    'Phone',
    'Role',
    'Registration Date',
    'Total Orders',
    'Total Spent',
    'Last Order Date'
  ];

  // CSV rows
  const rows = customers.map(customer => [
    customer.user_id,
    customer.username || '',
    customer.email || '',
    customer.phone || '',
    customer.role,
    customer.created_at ? new Date(customer.created_at).toISOString() : '',
    customer.total_orders || 0,
    customer.total_spent || 0,
    customer.last_order_date ? new Date(customer.last_order_date).toISOString() : ''
  ]);

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ];

  return csvLines.join('\n');
}

/**
 * Export orders to CSV
 */
async function exportOrders(): Promise<string> {
  console.log('[EXPORT] Fetching orders...');

  const ordersList = await db
    .select({
      order_id: orders.order_id,
      user_id: orders.user_id,
      username: profiles.username,
      email: profiles.email,
      total_amount: orders.total_amount,
      status: orders.status,
      payment_status: orders.payment_status,
      payment_method: orders.payment_method,
      created_at: orders.created_at,
    })
    .from(orders)
    .leftJoin(profiles, eq(orders.user_id, profiles.user_id))
    .orderBy(orders.created_at);

  console.log('[EXPORT] Orders fetched:', ordersList.length);

  const headers = [
    'Order ID',
    'User ID',
    'Username',
    'Email',
    'Total Amount',
    'Status',
    'Payment Status',
    'Payment Method',
    'Order Date'
  ];

  const rows = ordersList.map(order => [
    order.order_id,
    order.user_id,
    order.username || '',
    order.email || '',
    order.total_amount,
    order.status,
    order.payment_status,
    order.payment_method || '',
    order.created_at ? new Date(order.created_at).toISOString() : ''
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ];

  return csvLines.join('\n');
}

/**
 * Export products to CSV
 */
async function exportProducts(): Promise<string> {
  console.log('[EXPORT] Fetching products...');

  const productsList = await db
    .select()
    .from(products);

  console.log('[EXPORT] Products fetched:', productsList.length);

  const headers = [
    'Product ID',
    'Name',
    'Description',
    'Price',
    'Category',
    'Fabric Type',
    'Status',
    'Stock',
    'Created At'
  ];

  const rows = productsList.map(product => [
    product.id,
    product.name,
    product.description || '',
    product.price,
    product.category || '',
    product.fabric_type || '',
    product.status,
    product.stock || 0,
    product.created_at ? new Date(product.created_at).toISOString() : ''
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ];

  return csvLines.join('\n');
}
