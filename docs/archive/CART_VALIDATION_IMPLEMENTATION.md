# Cart Validation Implementation - Phase 1, Task 1

## Overview
Comprehensive cart validation system that prevents users from checking out with invalid items, ensures stock availability, detects price changes, and provides real-time inventory updates.

## Implementation Details

### 1. Backend Enhancements

#### A. Updated Checkout Handler (`server/orders.ts:27-152`)
**Changes:**
- Added stock validation before creating Razorpay order
- Validates each cart item against current database state
- Checks for:
  - Product existence
  - Product active status
  - Sufficient inventory quantity
  - Price match with current pricing
  - Cart total amount accuracy

**Validation Flow:**
```typescript
1. Fetch all products referenced in cart
2. For each item:
   - Check product exists
   - Check product is active
   - Check stock >= requested quantity
   - Check price hasn't changed
3. Recalculate total with current prices
4. If any validation fails → return 400 with detailed errors
5. If all valid → proceed to create Razorpay order
```

**Error Response Format:**
```json
{
  "error": {
    "code": "CART_VALIDATION_FAILED",
    "message": "Cart items are no longer available or prices have changed",
    "details": [
      {
        "product_id": "...",
        "error": "INSUFFICIENT_STOCK",
        "message": "Only 5 items available. You requested 10.",
        "available": 5,
        "requested": 10
      }
    ]
  }
}
```

#### B. New Checkout Validation Endpoint (`server/cartValidation.ts:364-478`)
**Route:** `POST /api/cart/validate-for-checkout`

**Purpose:** Pre-checkout validation that can be called before initiating Razorpay payment

**Validates:**
- Product availability (exists and active)
- Stock levels
- Price changes
- Low stock warnings
- Cart total calculations

**Response Format:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "product_id": "...",
      "type": "price_changed",
      "message": "Price changed from ₹1000 to ₹1200",
      "old_price": 1000,
      "new_price": 1200
    }
  ],
  "recalculatedTotal": 5000
}
```

### 2. Frontend Enhancements

#### A. Enhanced useCheckout Hook (`client/src/hooks/useOrders.ts:80-105`)
**Changes:**
- Added pre-checkout validation call
- Validates cart before calling `/api/orders/checkout`
- Returns detailed error messages to user
- Prevents invalid checkouts at client level

**Flow:**
```typescript
1. User clicks "Checkout" button
2. Hook calls `/api/cart/validate-for-checkout`
3. If validation fails → show errors to user
4. If validation passes → proceed to Razorpay
```

#### B. New useCheckoutValidation Hook (`client/src/hooks/useCheckoutValidation.ts`)
**Purpose:** Dedicated hook for checkout validation

**Export:**
```typescript
export function useCheckoutValidation()
export type CheckoutValidationResult
export type CheckoutValidationError
export type CheckoutValidationWarning
```

**Usage:**
```typescript
const { mutate: validate, isPending } = useCheckoutValidation();

validate(cart, {
  onSuccess: (result) => {
    if (!result.isValid) {
      // Show errors to user
    }
  }
});
```

#### C. Real-Time Stock Updates (`client/src/hooks/useCart.ts:60-90`)
**New Subscription:**
- Monitors `products` table for inventory changes
- When a product in cart has stock changes:
  - Invalidates cart-validation query
  - Invalidates cart query
  - Triggers fresh validation

**Implementation:**
```typescript
// Subscribe to product inventory changes
useEffect(() => {
  if (!query.data?.items || query.data.items.length === 0) return;

  const channel = supabase
    .channel("products_inventory_changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "products",
      },
      (payload: any) => {
        const updatedProduct = payload.new;
        const affectsCart = query.data?.items?.some(
          (item) => item.product_id === updatedProduct.id
        );

        if (affectsCart) {
          // Trigger fresh validation
          queryClient.invalidateQueries({ queryKey: ["cart-validation"] });
          queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [query.data?.items, queryClient]);
```

### 3. Validation Error Types

| Error Code | Cause | User Impact |
|-----------|-------|------------|
| `PRODUCT_NOT_FOUND` | Product deleted | Item removed from checkout |
| `PRODUCT_UNAVAILABLE` | Product status not "active" | Item removed from checkout |
| `INSUFFICIENT_STOCK` | Requested qty > available | Qty reduced or item removed |
| `PRICE_CHANGED` | Current price ≠ cart price | Warning shown, total updated |
| `OUT_OF_STOCK` | Available qty = 0 | Item removed from checkout |
| `LOW_STOCK` | Available qty < 5 | Warning shown |
| `CART_VALIDATION_FAILED` | Multiple items invalid | Checkout prevented |
| `AMOUNT_MISMATCH` | Cart total mismatch | Checkout prevented |

### 4. Test Coverage

#### E2E Tests (`tests/e2e/cart-validation.spec.ts`)
- 11 comprehensive test cases
- Covers:
  - Out-of-stock prevention
  - Quantity validation
  - Price change detection
  - Checkout flow validation
  - Error messaging
  - Edge cases

#### Integration Tests (`tests/integration/cart-validation.test.ts`)
- 10 integration test cases
- API endpoint testing
- Product inventory validation
- Cart validation endpoint testing

### 5. API Endpoints

#### Existing Endpoints (Enhanced)
- `POST /api/orders/checkout` - Now validates before creating order
- `POST /api/cart/validate-item-addition` - For add-to-cart validation
- `POST /api/cart/validate-quantity` - For quantity update validation

#### New Endpoints
- `POST /api/cart/validate-for-checkout` - Pre-checkout validation
- `GET /api/cart/products/:id/stock` - Get product stock info (existing)

### 6. Real-Time Features

#### Auto-Update Cart on Stock Changes
- ✅ Subscribes to product inventory changes
- ✅ Invalidates cart validation when relevant product changes
- ✅ Updates cart display in real-time
- ✅ Re-validates before allowing checkout

#### Stock Synchronization
- Server: Updates inventory after successful payment
- Admin: Can adjust inventory, changes propagate to customer carts
- Real-time: WebSocket subscriptions keep cart in sync

### 7. User Experience Flow

#### Normal Checkout:
```
1. User adds items to cart
   ↓
2. Cart validates stock after each add (via useAddToCart)
   ↓
3. User views cart
   ↓
4. Real-time updates reflect any admin changes
   ↓
5. User clicks "Checkout"
   ↓
6. System validates entire cart one more time (validate-for-checkout)
   ↓
7. If valid → Razorpay order created
   ↓
8. If invalid → Detailed errors shown, user can fix cart
```

#### Error Scenarios:
```
Add to Cart:
- Out of stock? → Show error, prevent add
- Valid? → Add with optimistic update

Checkout:
- Item deleted? → Show error, offer removal
- Stock insufficient? → Show available qty, suggest reduce
- Price changed? → Show new price, confirm
- Multiple issues? → List all, let user decide
```

### 8. Database Queries

#### Product Fetch for Validation:
```sql
SELECT id, price, sale_price, inventory_quantity, status, name
FROM products
WHERE id = ANY($1)
```

#### Inventory Update (after payment):
```sql
UPDATE products
SET inventory_quantity = inventory_quantity - $1
WHERE id = $2
AND inventory_quantity > 0
```

### 9. Configuration

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### 10. Breaking Changes

None. All changes are backward compatible:
- Existing checkout flow continues to work
- New validations are additional safety layers
- Error responses include detailed information for handling

### 11. Performance Considerations

- Validation happens in parallel (batch product fetch)
- Real-time subscriptions use Supabase replication (efficient)
- Client-side invalidations are targeted (only affected queries)
- No additional database indexes needed

### 12. Security

- ✅ Stock checking happens server-side (cart validation handlers)
- ✅ Price verification server-side (before payment)
- ✅ Stock deduction only after successful payment
- ✅ User authentication required for checkout
- ✅ No client-side can bypass validation

## Summary

This implementation provides:
1. **Stock Validation** - Prevents overselling
2. **Price Accuracy** - Ensures correct charges
3. **Real-time Sync** - Admin changes reflect immediately
4. **Clear Errors** - Users know why checkout failed
5. **Seamless UX** - Errors don't break the flow
6. **Production Ready** - Comprehensive error handling and testing

All requirements met:
- ✅ Validate stock before add-to-cart
- ✅ Validate stock + price before checkout
- ✅ Prevent invalid checkout
- ✅ Auto-update cart on stock changes
