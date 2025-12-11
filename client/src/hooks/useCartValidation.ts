import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Cart, CartItem } from "./useCart";
import { useToast } from "@/hooks/use-toast";
import type { 
  CartValidationResult, 
  CartValidationError, 
  CartValidationWarning,
  ProductStock 
} from "@server/types/cartValidation";

/**
 * Validates cart items against current product inventory
 * Checks for:
 * - Out of stock items
 * - Quantity exceeding available stock
 * - Deleted products
 * - Low stock warnings
 * - Price changes
 */
export function useCartValidation(cart: Cart | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["cart-validation", cart?.id],
    queryFn: async (): Promise<CartValidationResult> => {
      if (!cart || cart.items.length === 0) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          totalInvalidItems: 0,
        };
      }

      try {
        const result = await api.post<CartValidationResult>(
          "/api/cart/validate",
          { cart },
          undefined,
          10000
        );
        return result;
      } catch (e: any) {
        throw new Error(e?.message || "Failed to validate cart");
      }
    },
    enabled: enabled && !!cart,
    staleTime: 5000, // Revalidate every 5 seconds for real-time stock info
    retry: 2,
  });
}

/**
 * Periodic cart validation with notifications
 * Automatically validates cart every 5 minutes and shows toast notifications
 * for stock changes, price changes, and out-of-stock items
 */
export function usePeriodicCartValidation(
  cart: Cart | undefined,
  enabled: boolean = true
) {
  const { toast } = useToast();
  const previousValidationRef = useRef<CartValidationResult | null>(null);
  const notificationShownRef = useRef<Set<string>>(new Set());

  const validation = useQuery({
    queryKey: ["periodic-cart-validation", cart?.id],
    queryFn: async (): Promise<CartValidationResult> => {
      if (!cart || cart.items.length === 0) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          totalInvalidItems: 0,
        };
      }

      try {
        const result = await api.post<CartValidationResult>(
          "/api/cart/validate",
          { cart },
          undefined,
          10000
        );
        return result;
      } catch (e: any) {
        console.error("Periodic cart validation failed:", e);
        return {
          isValid: false,
          errors: [],
          warnings: [],
          totalInvalidItems: 0,
        };
      }
    },
    enabled: enabled && !!cart && cart.items.length > 0,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: false,
    staleTime: 4 * 60 * 1000, // 4 minutes
    retry: 1,
  });

  // Show notifications when validation results change
  useEffect(() => {
    if (!validation.data || !previousValidationRef.current) {
      previousValidationRef.current = validation.data || null;
      return;
    }

    const current = validation.data;
    const previous = previousValidationRef.current;

    // Check for new errors
    const newErrors = current.errors.filter(
      (error) =>
        !previous.errors.some(
          (prevError) =>
            prevError.productId === error.productId &&
            prevError.type === error.type
        )
    );

    // Check for new warnings
    const newWarnings = current.warnings.filter(
      (warning) =>
        !previous.warnings.some(
          (prevWarning) =>
            prevWarning.productId === warning.productId &&
            prevWarning.type === warning.type
        )
    );

    // Show notifications for new errors
    newErrors.forEach((error) => {
      const notificationKey = `error-${error.productId}-${error.type}`;
      
      if (!notificationShownRef.current.has(notificationKey)) {
        toast({
          title: "Cart Item Issue",
          description: error.message,
          variant: "destructive",
        });
        notificationShownRef.current.add(notificationKey);
      }
    });

    // Show notifications for new warnings
    newWarnings.forEach((warning) => {
      const notificationKey = `warning-${warning.productId}-${warning.type}`;
      
      if (!notificationShownRef.current.has(notificationKey)) {
        toast({
          title: "Cart Item Update",
          description: warning.message,
          variant: "default",
        });
        notificationShownRef.current.add(notificationKey);
      }
    });

    // Clear old notifications after 10 minutes
    setTimeout(() => {
      notificationShownRef.current.clear();
    }, 10 * 60 * 1000);

    previousValidationRef.current = current;
  }, [validation.data, toast]);

  return validation;
}

/**
 * Check if a single item can be added to cart
 * Returns false if product is out of stock or quantity exceeds available
 */
export function useValidateItemAddition(product_id: string, quantity: number) {
  return useQuery({
    queryKey: ["validate-item-addition", product_id, quantity],
    queryFn: async (): Promise<{
      canAdd: boolean;
      availableQuantity: number;
      message: string;
    }> => {
      try {
        return await api.post(
          "/api/products/validate-stock",
          { product_id, quantity },
          undefined,
          5000
        );
      } catch (e: any) {
        throw new Error(e?.message || "Failed to validate item addition");
      }
    },
    enabled: !!product_id && quantity > 0,
  });
}

/**
 * Check stock availability for a product
 */
export function useProductStock(product_id: string) {
  return useQuery({
    queryKey: ["product-stock", product_id],
    queryFn: async (): Promise<ProductStock> => {
      try {
        return await api.get(
          `/api/products/${product_id}/stock`,
          undefined,
          5000
        );
      } catch (e: any) {
        throw new Error(e?.message || "Failed to fetch product stock");
      }
    },
    enabled: !!product_id,
    staleTime: 3000,
  });
}

/**
 * Utility function to check if cart item quantity is valid
 */
export function isCartItemValid(
  item: CartItem,
  availableStock: number
): { valid: boolean; message?: string } {
  if (availableStock <= 0) {
    return {
      valid: false,
      message: `Product is out of stock`,
    };
  }

  if (item.quantity > availableStock) {
    return {
      valid: false,
      message: `Only ${availableStock} item(s) available. Requested: ${item.quantity}`,
    };
  }

  return { valid: true };
}

/**
 * Utility function to get stock status
 */
export function getStockStatus(
  quantity: number,
  lowStockThreshold: number
): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}
