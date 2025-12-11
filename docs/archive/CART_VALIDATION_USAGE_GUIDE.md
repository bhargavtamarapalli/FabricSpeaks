# Cart Validation Usage Guide

## For Frontend Developers

### 1. Using Pre-Checkout Validation

```typescript
import { useCheckoutValidation } from "@/hooks/useCheckoutValidation";
import { useCart } from "@/hooks/useCart";

export function CheckoutButton() {
  const { data: cart } = useCart();
  const { mutate: validateCheckout, isPending, isError, error } = useCheckoutValidation();

  const handleCheckout = async () => {
    validateCheckout(cart!, {
      onSuccess: (result) => {
        if (result.isValid) {
          // Proceed to payment
          proceedToPayment();
        } else {
          // Show errors to user
          result.errors.forEach(err => {
            toast.error(err.message);
          });
          
          // Show warnings
          result.warnings.forEach(warn => {
            toast.warn(warn.message);
          });
        }
      },
      onError: (err) => {
        toast.error("Validation failed: " + err.message);
      }
    });
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={isPending}
    >
      {isPending ? "Validating..." : "Proceed to Checkout"}
    </button>
  );
}
```

### 2. Using Existing useCheckout Hook

The `useCheckout` hook now includes validation:

```typescript
import { useCheckout } from "@/hooks/useOrders";

export function PaymentFlow() {
  const { mutate: checkout, isPending, error } = useCheckout();
  const { data: cart } = useCart();

  const handlePayment = () => {
    checkout({ cart }, {
      onSuccess: (razorpayOrder) => {
        // Razorpay order created successfully
        initiateRazorpayPayment(razorpayOrder);
      },
      onError: (err) => {
        // Validation or checkout failed
        if (err.message.includes("Cart validation failed")) {
          // Show detailed validation errors
        } else {
          toast.error(err.message);
        }
      }
    });
  };

  return (
    <>
      {error && (
        <div className="error">
          {error.message}
        </div>
      )}
      <button onClick={handlePayment} disabled={isPending}>
        Pay ₹{cart?.subtotal}
      </button>
    </>
  );
}
```

### 3. Real-Time Cart Updates

The cart automatically updates when admin changes stock:

```typescript
import { useCart } from "@/hooks/useCart";

export function CartDisplay() {
  const { data: cart, isLoading } = useCart();

  // The hook automatically subscribes to:
  // 1. Cart changes in database
  // 2. Product inventory changes
  // When a product in cart has inventory updated, cart re-validates

  if (isLoading) return <div>Loading cart...</div>;

  return (
    <div>
      {cart?.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### 4. Add to Cart with Validation

Already handled by `useAddToCart`:

```typescript
import { useAddToCart } from "@/hooks/useCart";

export function ProductCard({ product }) {
  const { mutate: addToCart, isPending } = useAddToCart();

  const handleAdd = () => {
    addToCart(
      {
        product_id: product.id,
        unit_price: product.sale_price || product.price,
        quantity: 1,
        size: selectedSize
      },
      {
        onError: (err) => {
          // Shows validation error (e.g., out of stock)
          toast.error(err.message);
        }
      }
    );
  };

  return (
    <button onClick={handleAdd} disabled={isPending}>
      Add to Cart
    </button>
  );
}
```

## For Backend Developers

### 1. Checkout Validation

The checkout endpoint (`POST /api/orders/checkout`) now validates:

```typescript
// Request
POST /api/orders/checkout
{
  "cart": {
    "id": "cart-123",
    "items": [
      {
        "id": "item-1",
        "product_id": "prod-1",
        "quantity": 2,
        "unit_price": 1000
      }
    ],
    "subtotal": 2000
  }
}

// Success Response (200)
{
  "razorpayOrder": {
    "id": "order_12345",
    "amount": 200000,
    "receipt": "receipt_order_1234567890"
  }
}

// Validation Failed Response (400)
{
  "error": {
    "code": "CART_VALIDATION_FAILED",
    "message": "Cart items are no longer available or prices have changed",
    "details": [
      {
        "product_id": "prod-1",
        "error": "INSUFFICIENT_STOCK",
        "message": "Only 5 items available. You requested 10.",
        "available": 5,
        "requested": 10
      }
    ]
  }
}
```

### 2. Pre-Checkout Validation Endpoint

Use this endpoint before calling checkout to validate without creating an order:

```typescript
// Request
POST /api/cart/validate-for-checkout
{
  "cart": {
    "id": "cart-123",
    "items": [...],
    "subtotal": 2000
  }
}

// Response
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "product_id": "prod-1",
      "product_name": "Cotton Shirt",
      "type": "low_stock",
      "message": "Only 3 items left in stock.",
      "available_quantity": 3
    }
  ],
  "recalculatedTotal": 2000
}
```

### 3. Item Addition Validation

```typescript
// Request
POST /api/cart/validate-item-addition
{
  "product_id": "prod-1",
  "quantity": 2,
  "size": "M"
}

// Response (Valid)
{
  "valid": true,
  "message": "Item can be added",
  "availableQuantity": 10
}

// Response (Invalid)
{
  "valid": false,
  "message": "Only 5 items available. You requested 10.",
  "availableQuantity": 5
}
```

## Error Handling Best Practices

### Frontend

```typescript
import { AxiosError } from "axios";

export function useCheckoutWithErrorHandling() {
  const { mutate: checkout } = useCheckout();

  const handleCheckout = (cart: Cart) => {
    checkout({ cart }, {
      onError: (error: AxiosError<any>) => {
        const errorCode = error.response?.data?.error?.code;
        const errorDetails = error.response?.data?.error?.details;

        switch (errorCode) {
          case "CART_VALIDATION_FAILED":
            if (errorDetails) {
              errorDetails.forEach((detail: any) => {
                if (detail.error === "INSUFFICIENT_STOCK") {
                  showToast(`${detail.product_id}: Only ${detail.available} available`, "warning");
                } else if (detail.error === "PRODUCT_NOT_FOUND") {
                  showToast(`Product removed from inventory`, "error");
                }
              });
            }
            break;
          case "RAZORPAY_NOT_CONFIGURED":
            showToast("Payment service unavailable", "error");
            break;
          default:
            showToast("Checkout failed. Please try again.", "error");
        }
      }
    });
  };

  return { handleCheckout };
}
```

### Backend

```typescript
// In order handler
try {
  // Validate
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: {
        code: "CART_VALIDATION_FAILED",
        message: "Validation failed",
        details: validationErrors
      }
    });
  }

  // Proceed
  // ...
} catch (error) {
  console.error("Checkout error:", error);
  return handleRouteError(error, res, "Checkout");
}
```

## Testing

### E2E Test Example

```typescript
test("Should validate cart before checkout", async ({ page }) => {
  await page.goto(BASE_URL);
  await loginUser(page);

  // Add item to cart
  await addProductToCart(page, "product-1", 1);

  // Navigate to checkout
  await page.click('button:has-text("Checkout")');

  // Validation runs automatically
  await expect(page.locator('[data-testid="validation-spinner"]')).toBeHidden();

  // Should either show checkout success or validation errors
  const hasError = await page.locator('[data-testid="validation-error"]').isVisible();
  const hasSuccess = await page.locator('[data-testid="razorpay-button"]').isVisible();

  expect(hasError || hasSuccess).toBe(true);
});
```

### Integration Test Example

```typescript
test("should prevent checkout with insufficient stock", async () => {
  const response = await fetch(
    "http://localhost:5000/api/orders/checkout",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: {
          items: [
            {
              product_id: "out-of-stock-product",
              quantity: 100,
              unit_price: 1000
            }
          ]
        }
      })
    }
  );

  const data = await response.json();
  expect(response.status).toBe(400);
  expect(data.error.code).toBe("CART_VALIDATION_FAILED");
});
```

## Troubleshooting

### Issue: Validation errors not showing

**Solution:** Check that:
1. useCheckout hook is being used
2. Error component is rendering error details
3. Cart state is properly loaded

### Issue: Cart not updating when admin changes inventory

**Solution:** Ensure:
1. Supabase real-time is enabled
2. useCart hook is mounted and subscribed
3. Browser console shows successful subscription

### Issue: Price validation warning but not preventing checkout

**Solution:** Price changes show as warnings, not errors. This is intentional - user sees new price and can confirm or cancel. Use errors for blocking checkout (out of stock, deleted product).

## Migration from Old Code

If you had direct `/api/orders/checkout` calls, update to use the `useCheckout` hook which now includes validation automatically. No other changes needed - backward compatible.

```typescript
// Old (still works, but validation happens server-side)
const response = await api.post("/api/orders/checkout", { cart });

// New (recommended - cleaner error handling)
const { mutate: checkout } = useCheckout();
checkout({ cart });
```
