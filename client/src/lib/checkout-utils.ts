import type { OrderSummary, OrderItem } from "@/types/checkout";

/**
 * Calculates order totals from cart items
 */
export function calculateOrderTotals(items: any[]): OrderSummary {
  if (!items || items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      shipping: 20,
      tax: 0,
      total: 20
    };
  }

  const orderItems: OrderItem[] = items.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: Number(item.unitPrice) * item.quantity
  }));

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shipping = 20; // Fixed shipping cost
  const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
  const total = subtotal + shipping + tax;

  return {
    items: orderItems,
    subtotal,
    shipping,
    tax,
    total
  };
}

/**
 * Formats currency values for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Validates that cart items are present and valid
 */
export function validateCartItems(items: unknown[]): boolean {
  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  return items.every(item => {
    return item &&
           typeof item === 'object' &&
           'id' in item &&
           'productId' in item &&
           'name' in item &&
           'quantity' in item &&
           'unitPrice' in item &&
           typeof (item as any).quantity === 'number' &&
           (item as any).quantity > 0 &&
           typeof (item as any).unitPrice === 'number' &&
           (item as any).unitPrice > 0;
  });
}

/**
 * Gets a summary of checkout validation issues
 */
export function getCheckoutValidationSummary(
  cartValidation: any,
  addressValidation: any,
  paymentValidation: any
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Cart validation issues
  if (cartValidation?.errors?.length > 0) {
    errors.push(...cartValidation.errors.map((e: any) => e.message));
  }

  if (cartValidation?.warnings?.length > 0) {
    warnings.push(...cartValidation.warnings.map((w: any) => w.message));
  }

  // Address validation issues
  if (addressValidation?.errors?.length > 0) {
    errors.push(...addressValidation.errors);
  }

  // Payment validation issues
  if (paymentValidation?.errors?.length > 0) {
    errors.push(...paymentValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasBlockingIssues: errors.length > 0
  };
}

/**
 * Determines if checkout can proceed
 */
export function canProceedToCheckout(
  cartItems: unknown[],
  validationSummary: ReturnType<typeof getCheckoutValidationSummary>
): boolean {
  return validateCartItems(cartItems) && !validationSummary.hasBlockingIssues;
}

/**
 * Creates a checkout progress indicator state
 */
export function getCheckoutStepStatus(
  currentStep: string,
  completedSteps: Set<string>
): Record<string, 'completed' | 'current' | 'upcoming'> {
  const steps = ['shipping', 'payment', 'review'];
  const status: Record<string, 'completed' | 'current' | 'upcoming'> = {};

  steps.forEach((step, index) => {
    if (completedSteps.has(step)) {
      status[step] = 'completed';
    } else if (step === currentStep) {
      status[step] = 'current';
    } else {
      status[step] = 'upcoming';
    }
  });

  return status;
}

/**
 * Sanitizes address data for API submission
 */
export function sanitizeAddressForAPI(address: any) {
  return {
    type: address.type,
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company || null,
    address_line_1: address.addressLine1,
    address_line_2: address.addressLine2 || null,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country,
    phone: address.phone || null,
    is_default: address.isDefault || false
  };
}

/**
 * Formats address for display
 */
export function formatAddressForDisplay(address: any): string {
  if (!address) return '';

  const parts = [
    address.first_name + ' ' + address.last_name,
    address.company,
    address.address_line_1,
    address.address_line_2,
    address.city + ', ' + address.state + ' ' + address.postal_code,
    address.country,
    address.phone ? 'Phone: ' + address.phone : null
  ].filter(Boolean);

  return parts.join('\n');
}
