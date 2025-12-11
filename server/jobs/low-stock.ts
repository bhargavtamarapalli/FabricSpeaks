import { db } from "../db/supabase";
import { products, productVariants } from "../../shared/schema";
import { lt, eq } from "drizzle-orm";
import { sendLowStockAlertEmail } from "../utils/email";

export async function checkLowStock() {
  try {
    // Get all variants with their product's low stock threshold
    const variantsWithThreshold = await db
      .select({
        product_name: products.name,
        variant_id: productVariants.id,
        size: productVariants.size,
        colour: productVariants.colour,
        stock: productVariants.stock_quantity,
        threshold: products.low_stock_threshold
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.product_id, products.id))
      .where(lt(productVariants.stock_quantity, products.low_stock_threshold));

    if (variantsWithThreshold.length > 0) {
      console.log(`Found ${variantsWithThreshold.length} low stock variants. Sending alert...`);
      
      // Send to admin email (hardcoded or from env)
      const adminEmail = process.env.ADMIN_EMAIL || "admin@fabric-speaks.local";
      await sendLowStockAlertEmail({
        to: adminEmail,
        products: variantsWithThreshold.map(v => ({
          name: `${v.product_name} (${v.size}/${v.colour})`,
          stock: v.stock || 0,
          threshold: v.threshold || 10
        }))
      });
    }
  } catch (error) {
    console.error("Failed to check low stock:", error);
  }
}

