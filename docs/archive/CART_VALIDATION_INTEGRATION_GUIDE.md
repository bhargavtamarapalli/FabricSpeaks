# Cart Validation Integration Guide

**Status:** Ready for integration  
**Estimated Time:** 0.5 hours  
**Priority:** High (blocks Task 1.5)

---

## Overview

This guide shows how to integrate the cart validation system into the existing cart workflow.

---

## 1. Update useCart Hook

**File:** `client/src/hooks/useCart.ts`

### Add Validation Import
```typescript
import { useValidateItemAddition, useCartValidation } from './useCartValidation';
```

### Update useAddToCart Mutation
```typescript
// Before
const useAddToCart = () => {
  return useMutation({
    mutationFn: async (input) => {
      // Add directly to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert(input);
      // ...
    },
  });
};

// After
const useAddToCart = () => {
  const validateItemAddition = useValidateItemAddition();

  return useMutation({
    mutationFn: async (input) => {
      // Validate first
      const validation = await validateItemAddition.mutateAsync({
        product_id: input.product_id,
        quantity: input.quantity,
      });

      if (!validation.canAdd) {
        throw new Error(validation.message);
      }

      // Then add to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert(input);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
```

### Update useUpdateCartItem Mutation
```typescript
// Before
const useUpdateCartItem = () => {
  return useMutation({
    mutationFn: async ({ id, quantity }) => {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      // ...
    },
  });
};

// After
const useUpdateCartItem = () => {
  const validateItemAddition = useValidateItemAddition();

  return useMutation({
    mutationFn: async ({ id, productId, quantity }) => {
      // Validate new quantity
      const validation = await validateItemAddition.mutateAsync({
        product_id: productId,
        quantity,
      });

      if (!validation.canAdd && quantity > validation.availableQuantity) {
        // Adjust to available quantity
        throw new Error(
          `Only ${validation.availableQuantity} item(s) available. Adjusted quantity.`
        );
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
```

---

## 2. Update Cart Component

**File:** `client/src/pages/Cart.tsx` (or similar)

### Add Validation Banner
```typescript
import { CartValidationBanner } from '@/components/CartValidation';
import { useCartValidation } from '@/hooks/useCartValidation';

export const Cart: React.FC = () => {
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: validation, isLoading: validationLoading } = useCartValidation(
    cart || undefined
  );

  return (
    <div className="container mx-auto py-8">
      {/* Validation Banner */}
      <CartValidationBanner
        errors={validation?.errors}
        warnings={validation?.warnings}
        isLoading={validationLoading}
        isValid={validation?.isValid ?? true}
      />

      {/* Rest of cart content */}
      {/* ... */}
    </div>
  );
};
```

---

## 3. Update Cart Item Component

**File:** Update cart item display component

### Add Stock Status Badge
```typescript
import { CartItemStockStatus } from '@/components/CartValidation';
import { useProductStock } from '@/hooks/useCartValidation';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { data: stock, isLoading: stockLoading } = useProductStock(
    item.product_id
  );

  return (
    <div className="flex items-center justify-between p-4 border rounded">
      {/* Product info */}
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-600">${item.unit_price}</p>
      </div>

      {/* Stock Status */}
      {stock && (
        <CartItemStockStatus
          itemId={item.id}
          productId={item.product_id}
          quantity={item.quantity}
          availableQuantity={stock.stock_quantity}
          unitPrice={item.unit_price}
          isValidating={stockLoading}
          onQuantityChange={onUpdateQuantity}
        />
      )}

      {/* Quantity and Actions */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-16 px-2 py-1 border rounded"
          disabled={stock?.stock_quantity === 0}
        />
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Update Product Page

**File:** `client/src/pages/Product.tsx` (or similar)

### Add Stock Badge
```typescript
import { StockStatusBadge } from '@/components/CartValidation';
import { useProductStock } from '@/hooks/useCartValidation';

export const Product: React.FC<{ productId: string }> = ({ productId }) => {
  const { data: stock } = useProductStock(productId);

  return (
    <div className="container mx-auto py-8">
      {/* Product details */}

      {/* Stock Status */}
      {stock && (
        <div className="my-4">
          <StockStatusBadge
            status={stock.is_available ? 
              (stock.stock_quantity <= stock.low_stock_threshold ? 'low_stock' : 'in_stock') :
              'out_of_stock'
            }
            quantity={stock.stock_quantity}
            compact={false}
          />
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!stock?.is_available}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {stock?.is_available ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};
```

---

## 5. Update Checkout Flow

**File:** `client/src/pages/Checkout.tsx` (or similar)

### Validate Before Checkout
```typescript
import { useCartValidation } from '@/hooks/useCartValidation';

export const Checkout: React.FC = () => {
  const { data: cart } = useCart();
  const { data: validation, isLoading: validationLoading } =
    useCartValidation(cart || undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCheckout = async () => {
    if (!validation?.isValid) {
      toast.error('Please fix cart issues before checkout');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: validation?.adjustedCart || cart,
        }),
      });

      if (!response.ok) throw new Error('Checkout failed');

      toast.success('Order placed successfully!');
      // Redirect to order confirmation
    } catch (error) {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Validation Banner */}
      <CartValidationBanner
        errors={validation?.errors}
        warnings={validation?.warnings}
        isLoading={validationLoading}
        isValid={validation?.isValid ?? true}
      />

      {/* Order Summary */}
      {/* ... */}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={!validation?.isValid || isSubmitting || validationLoading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
};
```

---

## 6. Backend Integration (Already Done ✅)

### Validation Endpoints Ready
- ✅ POST /api/cart/validate
- ✅ POST /api/products/validate-stock
- ✅ GET /api/products/:id/stock

### Integration Points
- ✅ useCartValidation queries already call endpoints
- ✅ useValidateItemAddition already validates
- ✅ useProductStock already fetches stock info

---

## 7. Testing Integration

### Run Tests
```bash
# Frontend validation tests
npm run test -- client/src/hooks/__tests__/useCartValidation.test.ts

# Backend validation tests
npm run test -- server/__tests__/cartValidation.test.ts

# UI component tests
npm run test -- client/src/components/__tests__/CartValidation.test.tsx
```

### Test Checklist
- [ ] Can add items with available stock
- [ ] Cannot add items without stock
- [ ] Quantity adjusts to available stock
- [ ] Cart validates before checkout
- [ ] Validation banner shows errors
- [ ] Stock status badge displays correctly
- [ ] Real-time stock updates work
- [ ] Performance is acceptable

---

## 8. Deployment Checklist

- [ ] All tests passing (55+ test cases)
- [ ] Frontend validation hooks integrated
- [ ] Backend endpoints tested
- [ ] UI components displaying correctly
- [ ] Real-time updates working
- [ ] Error messages clear and helpful
- [ ] Performance acceptable
- [ ] Accessibility verified

---

## Quick Reference

### Key Functions

**Frontend:**
```typescript
// Validate entire cart
const { data: validation } = useCartValidation(cart);

// Validate before adding item
const { mutateAsync: validateItemAddition } = useValidateItemAddition();
const validation = await validateItemAddition({ product_id, quantity });

// Get product stock
const { data: stock } = useProductStock(productId);
```

**UI Components:**
```typescript
// Show validation feedback
<CartValidationBanner 
  errors={validation?.errors}
  warnings={validation?.warnings}
/>

// Show item status
<CartItemStockStatus 
  itemId={item.id}
  productId={item.product_id}
  quantity={item.quantity}
  availableQuantity={stock.stock_quantity}
/>

// Show product status
<StockStatusBadge 
  status={stockStatus}
  quantity={stock}
/>
```

---

## Troubleshooting

### Validation not triggering
- Check that useCartValidation hook is being called
- Verify cart object is passed correctly
- Check React Query devtools for query status

### Stock status not updating
- Verify Supabase subscriptions are working
- Check React Query cache invalidation
- Test in browser devtools network tab

### Performance issues
- Check React Query stale time (should be 5 seconds)
- Verify batch operations are being used
- Profile with React DevTools

---

## Next Steps After Integration

1. ✅ Complete Task 1.4 integration (0.5 hours)
2. → Start Task 1.5: Order Email Notifications (2-3 hours)
3. → Start Phase 2: Admin-Main App Integration (7-9 hours)
4. → Start Phase 4: Testing & Documentation (9-12 hours)
5. → Deploy to production

---

## Support

Refer to:
- `PHASE_1_TASK_1_4_COMPLETION_SUMMARY.md` - Full implementation details
- `DEVELOPMENT_ROADMAP.md` - Overall project timeline
- Code comments in implementation files
