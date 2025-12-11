/**
 * Product Variants Hook
 * 
 * Provides React Query hooks for fetching and managing product variants.
 * Supports variant selection, stock validation, and price calculations.
 * 
 * @module hooks/useProductVariants
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Product Variant Interface
 * Represents a specific variation of a product (e.g., Red/Medium)
 */
export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string | null;
  colour?: string | null;
  stock_quantity: number;
  sku?: string | null;
  price_adjustment?: string | null;
  status: string;

  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Variant Availability Status
 * Used for UI feedback on stock status
 */
export interface VariantAvailability {
  available: boolean;
  stock: number;
  message: string;
}

/**
 * Hook to fetch all variants for a product
 * 
 * @param productId - The product ID to fetch variants for
 * @returns React Query result with variants array
 * 
 * @example
 * ```tsx
 * const { data: variants, isLoading } = useProductVariants(productId);
 * ```
 */
export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      
      const response = await api.get<{ items: ProductVariant[] }>(
        `/api/products/${productId}/variants`
      );
      
      return response.items || []; // Extract items from response
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}

/**
 * Hook to find a specific variant by attributes
 * Useful for direct variant lookup when size/colour are known
 * 
 * @param productId - The product ID
 * @param size - Optional size filter
 * @param colour - Optional colour filter
 * @returns React Query result with matching variant
 * 
 * @example
 * ```tsx
 * const { data: variant } = useFindVariant(productId, "M", "Red");
 * ```
 */
export function useFindVariant(
  productId: string | undefined,
  size?: string | null,
  colour?: string | null
) {
  return useQuery({
    queryKey: ["find-variant", productId, size, colour],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      
      const params = new URLSearchParams();
      if (size) params.append("size", size);
      if (colour) params.append("colour", colour);
      
      const response = await api.get<ProductVariant>(
        `/api/products/${productId}/variants/find?${params}`
      );
      
      return response; // api.get already returns the data
    },
    enabled: !!productId && (!!size || !!colour),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Utility: Get unique sizes from variants
 * Filters out null/undefined values and removes duplicates
 * 
 * @param variants - Array of product variants
 * @returns Array of unique size strings
 */
export function getUniqueSizes(variants: ProductVariant[] | undefined): string[] {
  if (!variants) return [];
  
  const sizes = variants
    .map(v => v.size)
    .filter((size): size is string => !!size);
  
  return Array.from(new Set(sizes));
}

/**
 * Utility: Get unique colours from variants
 * Filters out null/undefined values and removes duplicates
 * 
 * @param variants - Array of product variants
 * @returns Array of unique colour strings
 */
export function getUniqueColours(variants: ProductVariant[] | undefined): string[] {
  if (!variants) return [];
  
  const colours = variants
    .map(v => v.colour)
    .filter((colour): colour is string => !!colour);
  
  return Array.from(new Set(colours));
}

/**
 * Utility: Find matching variant by size and colour
 * 
 * @param variants - Array of product variants
 * @param size - Selected size
 * @param colour - Selected colour
 * @returns Matching variant or null
 */
export function findMatchingVariant(
  variants: ProductVariant[] | undefined,
  size: string | null,
  colour: string | null
): ProductVariant | null {
  if (!variants) return null;
  
  return variants.find(
    v => v.size === size && v.colour === colour && v.status === "active"
  ) || null;
}

/**
 * Utility: Calculate final price with variant adjustment
 * 
 * @param basePrice - Product base price
 * @param priceAdjustment - Variant price adjustment (can be positive or negative)
 * @returns Final price as number
 */
export function calculateVariantPrice(
  basePrice: number,
  priceAdjustment?: string | null
): number {
  if (!priceAdjustment) return basePrice;
  
  const adjustment = parseFloat(priceAdjustment);
  if (isNaN(adjustment)) return basePrice;
  
  return Math.max(0, basePrice + adjustment); // Ensure price never goes negative
}

/**
 * Utility: Check variant availability
 * 
 * @param variant - Product variant to check
 * @returns Availability status with user-friendly message
 */
export function checkVariantAvailability(
  variant: ProductVariant | null
): VariantAvailability {
  if (!variant) {
    return {
      available: false,
      stock: 0,
      message: "Please select a size and colour",
    };
  }
  
  if (variant.status !== "active") {
    return {
      available: false,
      stock: 0,
      message: "This variant is currently unavailable",
    };
  }
  
  if (variant.stock_quantity <= 0) {
    return {
      available: false,
      stock: 0,
      message: "Out of stock",
    };
  }
  
  if (variant.stock_quantity <= 5) {
    return {
      available: true,
      stock: variant.stock_quantity,
      message: `Only ${variant.stock_quantity} left in stock!`,
    };
  }
  
  return {
    available: true,
    stock: variant.stock_quantity,
    message: "In stock",
  };
}
