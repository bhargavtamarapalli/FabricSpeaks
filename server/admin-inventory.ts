import { Request, Response } from "express";
import { db } from "./db/supabase";
import { products, productVariants, inventoryLogs } from "../shared/schema";
import { eq, sql, and, or, ilike, gt, lte } from "drizzle-orm";
import { z } from "zod";
import { inventoryIntelligenceService } from "./services/inventory-intelligence";

/* -------------------------------------------------------------------------
   GET /api/admin/inventory
   Returns a list of all product variants with their current stock quantity.
-------------------------------------------------------------------------- */
export async function getInventoryHandler(req: Request, res: Response) {
  try {
    const { status, search } = req.query;

    const conditions = [];

    if (search) {
      const searchStr = `%${search}%`;
      conditions.push(or(
        ilike(products.name, searchStr),
        ilike(products.sku, searchStr)
      ));
    }

    if (status === 'out-of-stock') {
      conditions.push(eq(productVariants.stock_quantity, 0));
    } else if (status === 'low-stock') {
      conditions.push(and(
        gt(productVariants.stock_quantity, 0),
        lte(productVariants.stock_quantity, sql`COALESCE(${products.low_stock_threshold}, 10)`)
      ));
    } else if (status === 'in-stock') {
      conditions.push(gt(productVariants.stock_quantity, sql`COALESCE(${products.low_stock_threshold}, 10)`));
    }

    const variants = await db
      .select({
        variantId: productVariants.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        size: productVariants.size,
        color: productVariants.colour,
        stockQuantity: productVariants.stock_quantity,
        lowStockThreshold: products.low_stock_threshold,
        price: products.price,
        colorImages: products.color_images,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.product_id, products.id))
      .where(and(...conditions))
      .orderBy(products.name);

    const items = variants.map(v => {
      // Extract image
      let imageUrl = null;
      if (v.colorImages && typeof v.colorImages === 'object') {
        const colorKey = Object.keys(v.colorImages).find(k => k.toLowerCase() === v.color?.toLowerCase());
        if (colorKey && Array.isArray((v.colorImages as any)[colorKey])) {
           imageUrl = (v.colorImages as any)[colorKey][0];
        }
      }
      if (!imageUrl) {
         imageUrl = 'https://placehold.co/400x400/1e293b/94a3b8?text=No+Image';
      }

      return {
        id: v.variantId, // Use variant ID as the inventory item ID
        productId: v.productId,
        product: {
          id: v.productId,
          name: v.productName,
          sku: v.productSku,
          imageUrl: imageUrl
        },
        variantId: v.variantId,
        variant: {
          id: v.variantId,
          size: v.size,
          color: v.color
        },
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold || 10,
        status: v.stockQuantity === 0 ? 'out-of-stock' : v.stockQuantity <= (v.lowStockThreshold || 10) ? 'low-stock' : 'in-stock',
        value: Number(v.price) * v.stockQuantity
      };
    });

    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("[admin-inventory] fetch error:", err);
    return res
      .status(500)
      .json({ code: "INTERNAL_ERROR", message: "Failed to fetch inventory" });
  }
}

/* -------------------------------------------------------------------------
   POST /api/admin/inventory/adjust
   Payload: { variantId: string, adjustment: number, reason?: string }
   Adjusts stock_quantity of a variant and writes an audit log.
-------------------------------------------------------------------------- */
const adjustSchema = z.object({
  variantId: z.string().uuid(),
  adjustment: z.number().int(),
  reason: z.string().optional(),
});

export async function adjustInventoryHandler(req: Request, res: Response) {
  const parse = adjustSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: "INVALID_PAYLOAD", message: parse.error.message });
  }
  const { variantId, adjustment, reason } = parse.data;

  try {
    // Get current quantity
    const variant = await db
      .select({ 
        stock_quantity: productVariants.stock_quantity,
        product_id: productVariants.product_id 
      })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (!variant[0]) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Variant not found" });
    }

    const previous = variant[0].stock_quantity ?? 0;
    const newQty = previous + adjustment;

    if (newQty < 0) {
        return res.status(400).json({ code: "INVALID_OPERATION", message: "Stock cannot be negative" });
    }

    // Update variant stock
    await db
      .update(productVariants)
      .set({ stock_quantity: newQty, updated_at: new Date() })
      .where(eq(productVariants.id, variantId));

    // Insert audit log
    await db.insert(inventoryLogs).values({
      product_id: variant[0].product_id,
      // variant_id: variantId, // Removed as it is not in the schema
      adjustment_amount: adjustment,
      reason: reason ?? "",
      previous_quantity: previous,
      new_quantity: newQty,
    });

    return res.status(200).json({ 
      variant_id: variantId, 
      previous_quantity: previous, 
      new_quantity: newQty 
    });
  } catch (err) {
    console.error("[admin-inventory] adjust error:", err);
    return res
      .status(500)
      .json({ code: "INTERNAL_ERROR", message: "Failed to adjust inventory" });
  }
}

/* -------------------------------------------------------------------------
   GET /api/admin/inventory/intelligence
   Returns inventory health report with predictions.
-------------------------------------------------------------------------- */
export async function getInventoryHealthHandler(req: Request, res: Response) {
  try {
    const report = await inventoryIntelligenceService.getInventoryHealth();
    return res.json(report);
  } catch (err) {
    console.error("[admin-inventory] health report error:", err);
    return res
      .status(500)
      .json({ code: "INTERNAL_ERROR", message: "Failed to generate inventory health report" });
  }
}
