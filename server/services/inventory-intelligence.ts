import { db } from "../db/supabase";
import { products, productVariants, orderItems, orders, suppliers, productSuppliers } from "../../shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface InventoryHealth {
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  currentStock: number;
  salesVelocity: number; // Avg units sold per day (last 30 days)
  daysUntilStockout: number;
  status: 'healthy' | 'low_stock' | 'critical' | 'overstocked';
  recommendedReorderDate: Date | null;
  recommendedReorderQuantity: number;
  supplier?: {
    id: string;
    name: string;
    leadTime: number;
  };
}

export const inventoryIntelligenceService = {
  /**
   * Calculate sales velocity and predict stockouts for all products
   */
  async getInventoryHealth(): Promise<InventoryHealth[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get all active products and variants
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stock: products.stock_quantity,
        lowStockThreshold: products.low_stock_threshold,
      })
      .from(products)
      .where(eq(products.status, 'active'));

    // 2. Get sales data for last 30 days
    const salesData = await db
      .select({
        productId: orderItems.product_id,
        quantity: sql<number>`sum(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(and(
        gte(orders.created_at, thirtyDaysAgo),
        eq(orders.payment_status, 'paid')
      ))
      .groupBy(orderItems.product_id);

    const salesMap = new Map(salesData.map(s => [s.productId, Number(s.quantity)]));

    // 3. Get supplier info (lead times)
    const supplierData = await db
      .select({
        productId: productSuppliers.product_id,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        leadTime: suppliers.lead_time_days,
      })
      .from(productSuppliers)
      .innerJoin(suppliers, eq(productSuppliers.supplier_id, suppliers.id))
      .where(eq(productSuppliers.is_preferred, true));

    const supplierMap = new Map(supplierData.map(s => [s.productId, s]));

    // 4. Calculate metrics
    const healthReport: InventoryHealth[] = allProducts.map(product => {
      const totalSold = salesMap.get(product.id) || 0;
      const salesVelocity = totalSold / 30; // Units per day
      
      let daysUntilStockout = 999;
      if (salesVelocity > 0) {
        daysUntilStockout = product.stock / salesVelocity;
      }

      const supplier = supplierMap.get(product.id);
      const leadTime = supplier?.leadTime || 7; // Default 7 days if no supplier

      // Determine status
      let status: InventoryHealth['status'] = 'healthy';
      if (product.stock === 0) {
        status = 'critical';
      } else if (daysUntilStockout <= leadTime + 2) { // Buffer of 2 days
        status = 'critical';
      } else if (daysUntilStockout <= leadTime + 7) {
        status = 'low_stock';
      } else if (daysUntilStockout > 90) { // More than 3 months stock
        status = 'overstocked';
      }

      // Reorder recommendation
      let recommendedReorderDate: Date | null = null;
      let recommendedReorderQuantity = 0;

      if (status === 'critical' || status === 'low_stock') {
        const today = new Date();
        // We should have ordered (Lead Time - Days Until Stockout) days ago
        // Or if we have stock, we should order such that it arrives before stockout
        const daysToOrder = Math.max(0, daysUntilStockout - leadTime);
        recommendedReorderDate = new Date(today);
        recommendedReorderDate.setDate(today.getDate() + Math.floor(daysToOrder));

        // Reorder enough for 30 days + lead time buffer
        const targetStock = salesVelocity * (30 + leadTime);
        recommendedReorderQuantity = Math.ceil(Math.max(0, targetStock - product.stock));
      }

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        salesVelocity: Number(salesVelocity.toFixed(2)),
        daysUntilStockout: Math.floor(daysUntilStockout),
        status,
        recommendedReorderDate,
        recommendedReorderQuantity,
        supplier: supplier ? {
          id: supplier.supplierId,
          name: supplier.supplierName,
          leadTime: supplier.leadTime || 7
        } : undefined
      };
    });

    // Sort by urgency (critical first)
    return healthReport.sort((a, b) => {
      const statusPriority = { critical: 0, low_stock: 1, healthy: 2, overstocked: 3 };
      return statusPriority[a.status] - statusPriority[b.status];
    });
  }
};
