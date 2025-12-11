import { z } from "zod";

// Checkout Step Types
export type CheckoutStep = "shipping" | "payment" | "review";

// Address Schema
export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type AddressData = z.infer<typeof addressSchema>;

export type SavedAddress = AddressData & { id: string };

// Shipping Info (extends address with shipping specifics)
export const shippingInfoSchema = addressSchema.extend({
  sameAsBilling: z.boolean().optional(),
});

export type ShippingInfo = z.infer<typeof shippingInfoSchema>;

// Billing Info
export const billingInfoSchema = addressSchema.omit({ email: true, phone: true });

export type BillingInfo = z.infer<typeof billingInfoSchema>;

// Payment Info
export const paymentInfoSchema = z.object({
  method: z.enum(["razorpay"]),
});

export type PaymentInfo = z.infer<typeof paymentInfoSchema>;

// Order Summary Data
export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderSummary = {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

// Checkout Form Data
export const checkoutFormSchema = z.object({
  shipping: shippingInfoSchema,
  billing: billingInfoSchema.optional(),
  payment: paymentInfoSchema,
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Checkout State
export interface CheckoutState {
  currentStep: CheckoutStep;
  shipping: Partial<ShippingInfo>;
  billing: Partial<BillingInfo>;
  payment: PaymentInfo;
  orderSummary: OrderSummary | null;
  isValid: Record<CheckoutStep, boolean>;
  isSubmitting: boolean;
  errors: string[];
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Checkout Context Type
export interface CheckoutContextType {
  state: CheckoutState;
  actions: {
    updateShipping: (data: Partial<ShippingInfo>) => void;
    updateBilling: (data: Partial<BillingInfo>) => void;
    updatePayment: (data: PaymentInfo) => void;
    validateStep: (step: CheckoutStep) => boolean;
    nextStep: () => void;
    prevStep: () => void;
    placeOrder: () => Promise<void>;
    reset: () => void;
  };
}
