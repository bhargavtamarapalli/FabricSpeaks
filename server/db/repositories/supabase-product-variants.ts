import { db } from "../supabase";
import { productVariants, type InsertProductVariant, type ProductVariant } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

export interface ProductVariantsRepository {
  list(productId: string): Promise<ProductVariant[]>;
  getById(id: string): Promise<ProductVariant | null>;
  create(variant: InsertProductVariant): Promise<ProductVariant>;
  update(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant>;
  delete(id: string): Promise<void>;
  bulkUpdate(productId: string, variants: Array<{ id?: string } & Partial<InsertProductVariant>>): Promise<ProductVariant[]>;
  getByProductAndAttributes(productId: string, size?: string, colour?: string): Promise<ProductVariant | null>;
}

export class SupabaseProductVariantsRepository implements ProductVariantsRepository {
  async list(productId: string): Promise<ProductVariant[]> {
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.product_id, productId));
    
    return variants;
  }

  async getById(id: string): Promise<ProductVariant | null> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
      .limit(1);
    
    return variant || null;
  }

  async create(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db
      .insert(productVariants)
      .values(variant)
      .returning();
    
    if (!newVariant) {
      throw new Error("Failed to create product variant");
    }
    
    return newVariant;
  }

  async update(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant> {
    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        ...variant,
        updated_at: new Date(),
      })
      .where(eq(productVariants.id, id))
      .returning();
    
    if (!updatedVariant) {
      throw new Error("Product variant not found");
    }
    
    return updatedVariant;
  }

  async delete(id: string): Promise<void> {
    await db
      .delete(productVariants)
      .where(eq(productVariants.id, id));
  }

  /**
   * Bulk update variants for a product
   * This is the key feature for Phase 3 Admin UI
   */
  async bulkUpdate(
    productId: string,
    variants: Array<{ id?: string } & Partial<InsertProductVariant>>
  ): Promise<ProductVariant[]> {
    const results: ProductVariant[] = [];

    for (const variant of variants) {
      if (variant.id) {
        // Update existing variant
        const updated = await this.update(variant.id, variant);
        results.push(updated);
      } else {
        // Create new variant
        const created = await this.create({
          product_id: productId,
          size: variant.size,
          colour: variant.colour,
          stock_quantity: variant.stock_quantity ?? 0,
          sku: variant.sku,
          price_adjustment: variant.price_adjustment,
          status: variant.status ?? "active",
        });
        results.push(created);
      }
    }

    return results;
  }

  /**
   * Find a variant by product ID and attributes (size, colour)
   * Used when adding items to cart
   */
  async getByProductAndAttributes(
    productId: string,
    size?: string,
    colour?: string
  ): Promise<ProductVariant | null> {
    let query = db
      .select()
      .from(productVariants)
      .where(eq(productVariants.product_id, productId));

    // Build dynamic where clause based on provided attributes
    const conditions = [eq(productVariants.product_id, productId)];
    
    if (size !== undefined) {
      conditions.push(eq(productVariants.size, size));
    }
    
    if (colour !== undefined) {
      conditions.push(eq(productVariants.colour, colour));
    }

    const [variant] = await db
      .select()
      .from(productVariants)
      .where(and(...conditions))
      .limit(1);
    
    return variant || null;
  }
}

export const productVariantsRepository = new SupabaseProductVariantsRepository();
