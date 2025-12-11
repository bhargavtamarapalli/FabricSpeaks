import { Request, Response } from "express";
import { db } from "./db/supabase";
import { products, productVariants } from "../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

/* -------------------------------------------------------------------------
   Validation schemas
-------------------------------------------------------------------------- */
const variantBase = {
  product_id: z.string().uuid(),
  size: z.string().optional(),
  colour: z.string().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  price_adjustment: z.string().optional(),
};

const createSchema = z.object(variantBase);
const updateSchema = z.object({
  ...variantBase,
  id: z.string().uuid(),
});

/* -------------------------------------------------------------------------
   LIST variants for a product
-------------------------------------------------------------------------- */
export async function listVariantsHandler(req: Request, res: Response) {
  const { productId } = req.params;
  const list = await (db as any)
    .select()
    .from(productVariants)
    .where(eq(productVariants.product_id, productId));
  return res.status(200).json({ items: list });
}

/* -------------------------------------------------------------------------
   FIND a single variant (by query params)
-------------------------------------------------------------------------- */
export async function findVariantHandler(req: Request, res: Response) {
  const { productId } = req.params;
  const { size, colour } = req.query;
  const conditions: any[] = [eq(productVariants.product_id, productId)];
  if (size) conditions.push(eq(productVariants.size, String(size)));
  if (colour) conditions.push(eq(productVariants.colour, String(colour)));

  const variant = await (db as any)
    .select()
    .from(productVariants)
    .where(eq(productVariants.product_id, productId))
    .where(...conditions)
    .limit(1);

  if (!variant[0]) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Variant not found" });
  }
  return res.status(200).json(variant[0]);
}

/* -------------------------------------------------------------------------
   GET a variant by its ID
-------------------------------------------------------------------------- */
export async function getVariantHandler(req: Request, res: Response) {
  const { id } = req.params;
  const variant = await (db as any)
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);
  if (!variant[0]) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Variant not found" });
  }
  return res.status(200).json(variant[0]);
}

/* -------------------------------------------------------------------------
   CREATE a new variant
-------------------------------------------------------------------------- */
export async function createVariantHandler(req: Request, res: Response) {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: "INVALID_PAYLOAD", message: parse.error.message });
  }

  // Ensure the parent product exists
  const parent = await (db as any)
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, parse.data.product_id))
    .limit(1);
  if (!parent[0]) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Parent product not found" });
  }

  // Generate UUID and timestamps manually for SQLite compatibility
  const now = new Date().toISOString();
  const variantData = {
    id: randomUUID(),
    ...parse.data,
    created_at: now,
    updated_at: now
  };
  
  const result = await (db as any).insert(productVariants).values(variantData).returning();
  return res.status(201).json(result[0]);
}

/* -------------------------------------------------------------------------
   UPDATE a variant
-------------------------------------------------------------------------- */
export async function updateVariantHandler(req: Request, res: Response) {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: "INVALID_PAYLOAD", message: parse.error.message });
  }

  const { id, ...updates } = parse.data;
  const result = await (db as any)
    .update(productVariants)
    .set(updates)
    .where(eq(productVariants.id, id))
    .returning();

  if (!result[0]) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Variant not found" });
  }
  return res.status(200).json(result[0]);
}

/* -------------------------------------------------------------------------
   DELETE a variant
-------------------------------------------------------------------------- */
export async function deleteVariantHandler(req: Request, res: Response) {
  const { id } = req.params;
  await (db as any).delete(productVariants).where(eq(productVariants.id, id));
  return res.status(204).send();
}

/* -------------------------------------------------------------------------
   BULK UPDATE – e.g., price adjustments for many variants
-------------------------------------------------------------------------- */
const bulkSchema = z.object({
  productId: z.string().uuid(),
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      price_adjustment: z.string().optional(),
      stock_quantity: z.number().int().optional(),
    })
  ),
});

export async function bulkUpdateVariantsHandler(req: Request, res: Response) {
  const parse = bulkSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ code: "INVALID_PAYLOAD", message: parse.error.message });
  }

  const { productId, updates } = parse.data;
  
  try {
    // Use Drizzle's transaction API
    await (db as any).transaction(async (tx: any) => {
      for (const upd of updates) {
        // Prepare update object with only defined fields
        const updateData: any = {};
        if (upd.price_adjustment !== undefined) updateData.price_adjustment = upd.price_adjustment;
        if (upd.stock_quantity !== undefined) updateData.stock_quantity = upd.stock_quantity;
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length > 0) {
          await tx
            .update(productVariants)
            .set(updateData)
            .where(eq(productVariants.id, upd.id))
            // Ensure we only update variants belonging to the specified product for safety
            .where(eq(productVariants.product_id, productId));
        }
      }
    });

    return res.status(200).json({ updated: updates.length });
  } catch (error) {
    console.error('[bulk-update-variants] error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update variants' });
  }
}
