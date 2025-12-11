import { db } from "../db/supabase";
import { inventoryLogs, products, productVariants } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { whatsappService } from "./whatsapp-notifications";
import { formatNotification } from "./notification-templates";

export async function logInventoryChange(
  productId: string,
  adjustmentAmount: number,
  reason: string,
  previousQuantity?: number,
  newQuantity?: number
) {
  try {
    await db.insert(inventoryLogs).values({
      product_id: productId,
      adjustment_amount: adjustmentAmount,
      reason: reason,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      created_at: new Date()
    });
  } catch (error) {
    console.error("Failed to log inventory change:", error);
  }
}

export async function updateProductStock(
  id: string,
  adjustmentAmount: number,
  reason: string,
  isVariant: boolean = false
) {
  try {
    let currentStock = 0;
    let newStock = 0;
    let productName = 'Unknown Product';
    let variantName = '';
    let threshold = 10;
    let productId = id;

    if (isVariant) {
      // Update Variant Stock
      const [variant] = await db
        .select({ 
          stock_quantity: productVariants.stock_quantity,
          product_id: productVariants.product_id,
          size: productVariants.size,
          colour: productVariants.colour,
        })
        .from(productVariants)
        .where(eq(productVariants.id, id));

      if (!variant) throw new Error(`Variant ${id} not found`);

      productId = variant.product_id;
      currentStock = variant.stock_quantity || 0;
      variantName = `${variant.size || 'N/A'}, ${variant.colour || 'N/A'}`;

      // Get product details for notification
      const [product] = await db
        .select({
          name: products.name,
          low_stock_threshold: products.low_stock_threshold
        })
        .from(products)
        .where(eq(products.id, productId));
      
      productName = product?.name || 'Unknown Product';
      threshold = product?.low_stock_threshold || 10;

      newStock = currentStock + adjustmentAmount;

      await db.update(productVariants)
        .set({ stock_quantity: newStock })
        .where(eq(productVariants.id, id));

    } else {
      // Update Product Stock
      const [product] = await db
        .select({
          stock_quantity: products.stock_quantity,
          name: products.name,
          low_stock_threshold: products.low_stock_threshold
        })
        .from(products)
        .where(eq(products.id, id));

      if (!product) throw new Error(`Product ${id} not found`);

      currentStock = product.stock_quantity || 0;
      productName = product.name;
      threshold = product.low_stock_threshold || 10;
      
      newStock = currentStock + adjustmentAmount;

      await db.update(products)
        .set({ stock_quantity: newStock })
        .where(eq(products.id, id));
    }

    // Log change
    await logInventoryChange(productId, adjustmentAmount, reason, currentStock, newStock);

    // 🆕 Send inventory notifications
    try {
      // Out of stock notification (critical)
      if (newStock === 0 && currentStock > 0) {
        await whatsappService.send(formatNotification('inventory_out_of_stock', {
          product_name: productName,
          variant: variantName,
          last_sold: 'Just now',
          demand_level: 'Unknown'
        }));
      }
      // Low stock notification (important)
      else if (newStock <= threshold && newStock > 0 && currentStock > threshold) {
        await whatsappService.send(formatNotification('inventory_low_stock', {
          product_name: productName,
          variant: variantName,
          current_stock: newStock,
          threshold,
          weekly_sales: 0, 
          trend: 'Stable'
        }));
      }
      // Restocked notification (info)
      else if (newStock > threshold && currentStock <= threshold && adjustmentAmount > 0) {
        await whatsappService.send(formatNotification('inventory_restocked', {
          product_name: productName,
          variant: variantName,
          new_stock: newStock,
          added_quantity: adjustmentAmount,
          previous_stock: currentStock
        }));
      }
    } catch (notifError) {
      console.error('Failed to send inventory notification:', notifError);
    }

    return newStock;
  } catch (error) {
    console.error(`Failed to update stock for ${isVariant ? 'variant' : 'product'} ${id}:`, error);
    throw error;
  }
}
