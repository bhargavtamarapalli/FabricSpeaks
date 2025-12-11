/**
 * Cart Validation Types
 */

export type CartValidationError = {
  item_id: string;
  product_id: string;
  type: "out_of_stock" | "quantity_exceeded" | "product_deleted";
  message: string;
  available_quantity?: number;
  requested_quantity: number;
};

export type CartValidationWarning = {
  item_id: string;
  product_id: string;
  type: "low_stock" | "price_changed";
  message: string;
  current_value?: string | number;
  previous_value?: string | number;
};

export type CartValidationResult = {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
  adjustedCart?: any; // Cart with adjusted quantities
  totalInvalidItems: number;
};

export type ProductStock = {
  product_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
};
