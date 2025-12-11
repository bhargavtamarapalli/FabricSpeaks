import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Cart } from "./useCart";

export type CheckoutValidationError = {
  product_id: string;
  product_name?: string;
  type:
    | "product_deleted"
    | "product_unavailable"
    | "out_of_stock"
    | "insufficient_stock";
  message: string;
  quantity_requested?: number;
  available_quantity?: number;
};

export type CheckoutValidationWarning = {
  product_id: string;
  product_name?: string;
  type: "price_changed" | "low_stock";
  message: string;
  old_price?: number;
  new_price?: number;
  available_quantity?: number;
};

export type CheckoutValidationResult = {
  isValid: boolean;
  errors: CheckoutValidationError[];
  warnings: CheckoutValidationWarning[];
  recalculatedTotal: number;
};

export function useCheckoutValidation() {
  return useMutation({
    mutationFn: async (cart: Cart): Promise<CheckoutValidationResult> => {
      const result = await api.post<CheckoutValidationResult>(
        "/api/cart/validate-for-checkout",
        { cart },
        undefined,
        10000
      );
      return result;
    },
  });
}
