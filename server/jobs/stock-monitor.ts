/**
 * Stock Monitor Background Job
 * Checks for stock changes and sends notifications to users who requested alerts
 */

import { db } from "../db/supabase";
import { stockNotifications, products, productVariants } from "../../shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendBackInStockEmail } from "../utils/email";

/**
 * Check for products that are back in stock and send notifications
 */
export async function checkStockAndNotify() {
  try {
    console.log("[StockMonitor] Checking for products back in stock...");
    if (!process.env.DATABASE_URL) {
      console.error("[StockMonitor] DATABASE_URL is not defined");
      return { success: false, error: "DATABASE_URL missing" };
    }
    // Log masked URL for debugging
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log(`[StockMonitor] Using DB URL: ${maskedUrl}`);
    
    // Get all pending notifications (not yet notified)
    const pendingNotifications = await db
      .select({
        id: stockNotifications.id,
        user_id: stockNotifications.user_id,
        product_id: stockNotifications.product_id,
        variant_id: stockNotifications.variant_id,
        email: stockNotifications.email,
        product_name: products.name,
        product_price: products.price,
        product_sale_price: products.sale_price,
        product_images: products.color_images,
      })
      .from(stockNotifications)
      .leftJoin(products, eq(stockNotifications.product_id, products.id))
      .where(eq(stockNotifications.notified, false));
    
    console.log(`[StockMonitor] Found ${pendingNotifications.length} pending notifications`);
    
    let notifiedCount = 0;
    
    for (const notification of pendingNotifications) {
      // Check if product is now in stock
      let isInStock = false;
      
      if (notification.variant_id) {
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, notification.variant_id));
          
        if (variant && variant.stock_quantity > 0) {
          isInStock = true;
        }
      } else {
        // If no specific variant, check if any variant is in stock
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.product_id, notification.product_id));
          
        if (variants.some(v => v.stock_quantity > 0)) {
          isInStock = true;
        }
      }

      if (isInStock) {
        try {
          // Send email notification
          const productPrice = notification.product_sale_price || notification.product_price;
          // Use color_images which is a JSON object/array
          const images = notification.product_images as any;
          let productImage = null;
          
          if (Array.isArray(images) && images.length > 0) {
            productImage = images[0];
          } else if (typeof images === 'object' && images !== null) {
            // Handle color_images structure (e.g. { "Red": ["url1", "url2"] })
            const firstColor = Object.keys(images)[0];
            if (firstColor && Array.isArray(images[firstColor]) && images[firstColor].length > 0) {
              productImage = images[firstColor][0];
            }
          }
          
          const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/products/${notification.product_id}`;
          
          await sendBackInStockEmail({
            to: notification.email,
            productName: notification.product_name || 'Product',
            productId: notification.product_id,
            productImage: productImage || undefined,
            productPrice: productPrice ? parseFloat(productPrice.toString()) : undefined,
            productUrl,
          });
          
          // Mark notification as sent
          await db
            .update(stockNotifications)
            .set({
              notified: true,
              notified_at: new Date(),
            })
            .where(eq(stockNotifications.id, notification.id));
          
          notifiedCount++;
          console.log(`[StockMonitor] Sent notification for product: ${notification.product_name} to ${notification.email}`);
        } catch (error) {
          console.error(`[StockMonitor] Failed to send notification for ${notification.id}:`, error);
        }
      }
    }
    
    console.log(`[StockMonitor] Sent ${notifiedCount} notifications`);
    return { success: true, notifiedCount };
  } catch (error) {
    console.error("[StockMonitor] Error checking stock:", error);
    return { success: false, error };
  }
}

/**
 * Clean up old notified records (optional - run periodically)
 * Removes notifications that were sent more than 30 days ago
 */
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db
      .delete(stockNotifications)
      .where(
        and(
          eq(stockNotifications.notified, true),
          // @ts-ignore - drizzle type issue
          gt(stockNotifications.notified_at, thirtyDaysAgo)
        )
      );
    
    console.log(`[StockMonitor] Cleaned up old notifications`);
    return { success: true };
  } catch (error) {
    console.error("[StockMonitor] Error cleaning up notifications:", error);
    return { success: false, error };
  }
}
