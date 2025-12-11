/**
 * Cart Validation Utilities for Product Variants
 * Helper functions to validate cart items against variant stock
 */

import { supabase } from "../db/supabase";
import { productVariantsRepository } from "../db/repositories/supabase-product-variants";

/**
 * Get stock quantity for a cart item
 * Checks variant stock if variant_id exists, otherwise falls back to product stock
 */
export async function getItemStockQuantity(
  productId: string,
  variantId?: string | null
): Promise<number> {
  // If variant_id is provided, check variant stock
  if (variantId) {
    const variant = await productVariantsRepository.getById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    return variant.stock_quantity;
  }

  // Otherwise, check product stock (legacy behavior)
  const { data: productData, error } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();

  if (error || !productData) {
    throw new Error("Product not found");
  }

  const product = productData as any;
  return product.stock_quantity;
}

/**
 * Validate if a variant/product is available for purchase
 */
export async function validateItemAvailability(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<{
  valid: boolean;
  message: string;
  availableQuantity?: number;
}> {
  try {
    // Get the appropriate stock quantity
    const stockQuantity = await getItemStockQuantity(productId, variantId);

    if (stockQuantity <= 0) {
      return {
        valid: false,
        message: "Item is out of stock",
        availableQuantity: 0,
      };
    }

    if (quantity > stockQuantity) {
      return {
        valid: false,
        message: `Only ${stockQuantity} item(s) available`,
        availableQuantity: stockQuantity,
      };
    }

    return {
      valid: true,
      message: "Item is available",
      availableQuantity: stockQuantity,
    };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Decrement stock for a variant or product after order
 */
export async function decrementStock(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<void> {
  if (variantId) {
    // Decrement variant stock
    const variant = await productVariantsRepository.getById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }

    const newStock = variant.stock_quantity - quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await productVariantsRepository.update(variantId, {
      stock_quantity: newStock,
    });
  } else {
    // Decrement product stock (legacy)
    const { data: productData, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single();

    if (fetchError || !productData) {
      throw new Error("Product not found");
    }

    const product = productData as any;
    const newStock = product.stock_quantity - quantity;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", productId);

    if (updateError) {
      throw new Error("Failed to update stock");
    }
  }
}
