## Phase 2: Admin-Main App Integration - Action Plan

### Overview
**Goal:** Connect the admin app (products, inventory, orders) to the main customer app (cart, checkout, orders).
**Scope:** Share Supabase database, sync inventory in real-time, verify orders created from main app appear in admin app.
**Estimated Time:** 7-9 hours
**Status:** In Progress

---

## Current State Analysis

### Main App ("Fabric Speaks")
- **Cart System:** useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem (with validation)
- **Orders:** verifyPaymentHandler creates orders → inventory adjustments needed
- **Auth:** Supabase auth, session-based
- **Database:** Shared Supabase instance (via DATABASE_URL)

### Admin App ("Fabric Speaks Admin")
- **Orders Page:** Reads from Supabase `orders` table with filtering, bulk operations
- **Inventory Page:** Reads from Supabase `products` table, manages stock
- **Products Page:** CRUD on products
- **Auth:** Separate auth via Supabase

### Integration Points
1. **Shared Database:** Both apps use same Supabase instance ✅ (already connected)
2. **Inventory Sync:** Main app checkout decreases inventory → admin app shows updates ❌ (needs implementation)
3. **Orders Visibility:** Admin app sees orders from main app ✅ (already querying same table)
4. **Real-time Updates:** Admin app gets real-time inventory/order changes ⚠️ (partially implemented)

---

## Work Breakdown

### Phase 2.1: Inventory Sync on Order Creation (Main App → Admin App)
**Time:** 2-3 hours

#### 2.1.1 Decrease Inventory on Order Payment
- **File:** `server/orders.ts` → `verifyPaymentHandler`
- **Task:** After order creation, decrease `products.inventory_quantity` for each order item
- **Implementation:**
  1. Loop through `order.items`
  2. For each item, call Supabase to decrease `products.inventory_quantity` by item quantity
  3. Handle race conditions (use transactions or locks if needed)
  4. Emit real-time event or log for admin app subscription

#### 2.1.2 Test Inventory Update Flow
- **Tests:** Create order in main app → verify inventory decreased in Supabase → admin app reflects change
- **Files:** New test `server/__tests__/inventory-sync.test.ts`

### Phase 2.2: Real-Time Inventory Updates (Admin App ← Supabase)
**Time:** 1-2 hours

#### 2.2.1 Add Supabase Real-Time Subscription to Admin Inventory Hook
- **File:** `Fabric Speaks Admin/src/hooks/useInventory.ts`
- **Task:** Subscribe to `products` table changes, invalidate/refetch on updates
- **Implementation:**
  1. After query fetch, set up Supabase channel for `postgres_changes` on `products` table
  2. On change event, invalidate query cache
  3. Cleanup subscription on unmount

#### 2.2.2 Add Inventory Update Notification
- **File:** `Fabric Speaks Admin/src/pages/Inventory.tsx`
- **Task:** Show toast when inventory updates in real-time
- **Implementation:** Display "Inventory updated by {user}" or "Stock decreased by main app"

### Phase 2.3: Order Visibility & Syncing
**Time:** 1-2 hours

#### 2.3.1 Verify Admin App Orders Hook Works
- **File:** `Fabric Speaks Admin/src/hooks/useOrders.ts`
- **Task:** Confirm orders created from main app appear in admin app
- **Steps:**
  1. Create order in main app
  2. Check Supabase `orders` table
  3. Verify admin app `useOrders` fetches it
  4. Add real-time subscription if not present

#### 2.3.2 Add Order Created Notifications
- **File:** `Fabric Speaks Admin/src/hooks/useNotifications.ts` (if not present, create)
- **Task:** Real-time alert when new order arrives from main app
- **Implementation:**
  1. Subscribe to `orders` table `INSERT` events
  2. Show toast: "New order #{orderId} from {customer}"

### Phase 2.4: Cross-App Data Consistency
**Time:** 1-2 hours

#### 2.4.1 Sync Product Prices
- **Task:** When admin changes product price, cart validation in main app reflects it
- **Current State:** Validation already detects price changes (warning)
- **Verify:** Cart shows "Price has changed from X to Y" after admin updates

#### 2.4.2 Sync Product Availability
- **Task:** When admin marks product inactive, main app prevents adding to cart
- **Current State:** Validation checks `product.status === "active"`
- **Verify:** Can't add inactive product, shows "Product not available"

#### 2.4.3 Handle Order Status Updates from Admin
- **Task:** When admin changes order status, send email to customer (email integration complete)
- **Implementation:** Call `sendOrderStatusUpdateEmail` on admin order status update
- **Files:** Update `Fabric Speaks Admin/src/hooks/useBulkOperations.ts`

### Phase 2.5: Testing & Documentation
**Time:** 1-2 hours

#### 2.5.1 Integration Tests
- **File:** `server/__tests__/admin-integration.test.ts`
- **Tests:**
  1. Create order in main app → inventory decreases
  2. Admin updates order status → customer gets email
  3. Admin marks product inactive → main app can't add to cart
  4. Real-time subscription works both ways

#### 2.5.2 Documentation
- Create `ADMIN_INTEGRATION.md` with:
  - Architecture diagram (main app ↔ Supabase ↔ admin app)
  - Data flow: orders, inventory, products
  - Real-time event handling
  - Deployment checklist

---

## Implementation Sequence

### Step 1: Decrease Inventory on Order (30 min - 1 hour)
```typescript
// server/orders.ts → verifyPaymentHandler
After order creation, add:
for (const item of order.items) {
  await supabase.from('products')
    .update({ inventory_quantity: db.raw('inventory_quantity - ?', [item.quantity]) })
    .eq('id', item.product_id);
}
```

### Step 2: Add Real-Time Inventory Subscription to Admin (1-2 hours)
```typescript
// Fabric Speaks Admin/src/hooks/useInventory.ts
Set up Supabase channel subscription on mount
Listen for postgres_changes on products table
Invalidate React Query cache on change
```

### Step 3: Verify Order Sync Works (30 min)
- Confirm admin app `useOrders` fetches orders from main app
- Add real-time subscription if missing

### Step 4: Add Order Status → Email (1-2 hours)
- Update admin bulk operations to call email service
- Test status change triggers customer email

### Step 5: Cross-App Validation Tests (1-2 hours)
- Write tests for inventory sync, price changes, product availability
- Document integration flow

---

## Success Criteria

✅ Inventory decreases in Supabase when order created in main app
✅ Admin app sees inventory change in real-time (via subscription)
✅ Admin app sees orders created from main app
✅ Admin sees new orders in real-time (toast notification)
✅ Admin can update order status and customer gets email
✅ Main app validates against live product data (prices, availability, stock)
✅ All changes bidirectional: main app updates → admin sees, admin updates → main app validates

---

## Dependencies

- Supabase real-time subscriptions (already enabled)
- Email service (nodemailer, configured)
- React Query (both apps use it)
- Transaction support in Supabase (for inventory consistency)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Race condition: multiple orders decrease same product stock | Inventory goes negative | Use Supabase transactions or row-level locks |
| Real-time subscription fails silently | Admin doesn't see updates | Add error logging and retry logic |
| Email fails on status update | Customer not notified | Already best-effort (won't block request) |
| Network latency: order appears in admin before inventory updates | Inconsistent state | Accept eventual consistency (< 5s) |

---

## Deployment Checklist

- [ ] Inventory sync code added to `server/orders.ts`
- [ ] Real-time subscription added to admin `useInventory.ts`
- [ ] Order notifications implemented
- [ ] Email on order status update working
- [ ] All tests passing
- [ ] Integration tests added
- [ ] Documentation updated
- [ ] Staging environment tested
- [ ] Production deployment ready

---

## Next Immediate Actions

1. **Now:** Add inventory decrease logic to `verifyPaymentHandler` in `server/orders.ts`
2. **Next:** Add real-time subscription to admin inventory hook
3. **Then:** Test full flow end-to-end (main app order → inventory update → admin sees it)
