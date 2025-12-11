# FABRIC SPEAKS - UNIFIED IMPLEMENTATION PLAN
## Production Roadmap for E-commerce App + Admin Panel

**Version**: 3.0 (Post-Audit)  
**Last Updated**: November 21, 2025  
**Status**: Phase 4 Complete ✅ | Phase 5 (Testing & Scalability) In Progress 🔄

---

## 📊 CURRENT STATUS

### **Completed Phases** ✅
- ✅ **Phase 1**: Core E-commerce (Products, Cart, Checkout)
- ✅ **Phase 2**: Product Variants & Inventory
- ✅ **Phase 3**: Wishlist, Reviews, Search, Admin Bulk Variants

### **Production Readiness Scores**:
| Application | Security | Scalability | Features | Code Quality | Testing | Overall |
|-------------|----------|-------------|----------|--------------|---------|---------|
| E-commerce App | 30/100 🔴 | 40/100 🔴 | 60/100 🟡 | 50/100 🟠 | 25/100 🔴 | **35/100** ❌ |
| Admin Panel | 15/100 🔴 | 25/100 🔴 | 40/100 🟠 | 55/100 🟡 | 10/100 🔴 | **29/100** ❌ |

**Verdict**: NOT PRODUCTION READY ❌

---

## 🎯 REMAINING PHASES

### **Timeline Overview**:
```
Phase 4: Production Blockers    [2 weeks] 🔴 CRITICAL
Phase 5: Scalability            [2 weeks] 🟠 HIGH
Phase 6: Business Features      [3 weeks] 🟡 MEDIUM
Phase 7: Optimization           [1 week]  🟢 LOW
──────────────────────────────────────────
Total: 8 weeks (5 weeks minimum viable)
```

---

## 🔴 PHASE 4: PRODUCTION BLOCKERS (2 WEEKS)
**Priority**: P0 - CANNOT DEPLOY WITHOUT THESE  
**Team**: 2-3 developers + 1 QA  
**Goal**: Fix all critical security and data integrity issues

---

### **4.1: Database Transactions & Race Conditions** (3 days)
**Affects**: E-commerce App  
**Priority**: P0 - BLOCKER

#### **Tasks**:

**[E-COMM-4.1.1]** Add Transaction Support
- [ ] File: `server/db/supabase.ts`
- [ ] Create `withTransaction` wrapper function
- [ ] Test transaction rollback on error
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.1.2]** Refactor Order Creation with Transactions
- [ ] File: `server/orders.ts` (lines 260-309)
- [ ] Wrap in transaction:
  - Create order
  - Deduct inventory with optimistic locking
  - Clear cart
  - Update payment status
- [ ] Add `SELECT FOR UPDATE` for stock checks
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.1.3]** Add Payment Idempotency
- [ ] Migration: `supabase/migrations/20251121_add_payment_idempotency.sql`
- [ ] Add `orders.razorpay_payment_id UNIQUE` constraint
- [ ] Update `verifyPaymentHandler` to check for duplicate payments
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.1.4]** Fix Variant Stock Tracking
- [ ] File: `server/orders.ts`
- [ ] Update checkout to check `product_variants.stock_quantity` instead of `products.stock_quantity`
- [ ] Add variant stock deduction in transaction
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Testing**:
- [ ] Unit test: Transaction rollback on error
- [ ] Integration test: Race condition (2 users, 1 item in stock)
- [ ] E2E test: Full checkout flow with stock validation
- [ ] Load test: 100 concurrent checkouts

#### **Acceptance Criteria**:
- [ ] All multi-step operations use transactions
- [ ] Cannot oversell products (race condition test passes)
- [ ] Duplicate payment IDs rejected
- [ ] Variant stock correctly tracked

---

### **4.2: Security Hardening - E-commerce App** (2 days)
**Affects**: E-commerce App  
**Priority**: P0 - BLOCKER

#### **Tasks**:

**[E-COMM-4.2.1]** Remove Secrets from Git
- [ ] Run: `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.local"`
- [ ] Add `.env.local` to `.gitignore`
- [ ] Rotate ALL exposed secrets (Supabase keys, session secret, Razorpay keys)
- [ ] Document all env vars in `.env.example`
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.2.2]** Implement Rate Limiting
- [ ] File: `server/routes.ts`
- [ ] Add rate limiters:
  - Checkout: 5 requests / 15 min
  - Auth: 10 requests / 15 min
  - Payment: 3 requests / 15 min
- [ ] Test rate limit enforcement
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.2.3]** Add CSRF Protection
- [ ] File: `server/index.ts`
- [ ] Enable CSRF middleware for state-changing operations
- [ ] Update frontend to include CSRF tokens
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.2.4]** Add Content Security Policy
- [ ] File: `server/index.ts`
- [ ] Configure Helmet CSP headers
- [ ] Test CSP doesn't break functionality
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Testing**:
- [ ] Security scan with OWASP ZAP
- [ ] Rate limit test (100 requests/second)
- [ ] CSRF token validation test

#### **Acceptance Criteria**:
- [ ] No secrets in git history
- [ ] All env vars from secure vault (AWS Secrets Manager / HashiCorp Vault)
- [ ] Rate limiting active on critical endpoints
- [ ] CSRF protection enabled
- [ ] CSP headers present

---

### **4.3: Security Hardening - Admin Panel** (3 days)
**Affects**: Admin Panel  
**Priority**: P0 - BLOCKER (MORE CRITICAL THAN E-COMM)

#### **Tasks**:

**[ADMIN-4.3.1]** Implement Role-Based Access Control (RBAC)
- [ ] Migration: `supabase/migrations/20251121_add_admin_roles.sql`
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
  CREATE INDEX idx_profiles_role ON profiles(role);
  UPDATE profiles SET role = 'super_admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'bhargav1999.t@gmail.com');
  ```
- [ ] File: `Fabric Speaks Admin/src/components/ProtectedRoute.tsx`
- [ ] Add role check:
  ```typescript
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return <Navigate to="/unauthorized" />;
  }
  ```
- [ ] Create `/unauthorized` page
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.3.2]** Add Audit Logging
- [ ] Migration: `supabase/migrations/20251121_create_audit_logs.sql`
  ```sql
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
  CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
  ```
- [ ] File: `Fabric Speaks Admin/src/lib/auditLog.ts`
- [ ] Create audit logging utility
- [ ] Add audit calls to all CRUD operations
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.3.3]** Remove Hardcoded Admin Email
- [ ] File: `Fabric Speaks Admin/src/contexts/AuthContext.tsx`
- [ ] Remove `CORE_ADMIN_EMAIL` constant
- [ ] Use database `profiles.role` instead
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.3.4]** Create Admin Invitation System
- [ ] Backend: `server/admin-users.ts`
- [ ] API: `POST /api/admin/invite` (super_admin only)
- [ ] Frontend: `Fabric Speaks Admin/src/pages/AdminUsers.tsx`
- [ ] Email invitation with secure token
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.3.5]** Separate Supabase Credentials (Optional but Recommended)
- [ ] Create separate Supabase project for admin
- [ ] OR use service role key (server-side only)
- [ ] Update admin app to use separate credentials
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Testing**:
- [ ] Test: Non-admin cannot access admin panel
- [ ] Test: Audit log created on product delete
- [ ] Test: Admin invitation flow
- [ ] Test: Multiple admin roles (super_admin, admin, moderator)

#### **Acceptance Criteria**:
- [ ] RBAC enforced on all admin routes
- [ ] Audit logs capture all admin actions
- [ ] No hardcoded admin email
- [ ] Can invite multiple admins
- [ ] Audit log viewer page created

---

### **4.4: Type Safety - Remove All `any`** (3 days)
**Affects**: E-commerce App (70+ instances), Admin App (9 instances)  
**Priority**: P0 - BLOCKER

#### **Tasks**:

**[BOTH-4.4.1]** E-commerce App - Fix `any` Types
- [ ] File: `server/orders.ts` - Define `RazorpayOrder`, `CartItem` interfaces
- [ ] File: `server/db/supabase.ts` - Type `db` and `supabase` properly
- [ ] File: `server/db/repositories/*.ts` - Replace all `any` with proper types
- [ ] File: `server/utils/errors.ts` - Type error handlers
- [ ] File: `client/src/hooks/*.ts` - Type React Query responses
- [ ] Run `npm run check` - must pass with 0 errors
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-4.4.2]** Admin App - Fix `any` Types
- [ ] File: `src/pages/BulkVariants.tsx` - Type product map
- [ ] File: `src/hooks/useAnalytics.ts` - Type order items
- [ ] File: `src/components/VariantBulkEditor.tsx` - Type value parameter
- [ ] File: `src/components/charts/*.tsx` - Type chart data
- [ ] Run `npm run build` - must pass with 0 errors
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-4.4.3]** Enable TypeScript Strict Mode
- [ ] File: `tsconfig.json` (both apps)
- [ ] Set `"strict": true`
- [ ] Fix all new errors
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Testing**:
- [ ] `npm run check` passes with 0 errors (E-commerce)
- [ ] `npm run build` passes with 0 errors (Admin)
- [ ] No `@ts-ignore` or `@ts-expect-error` comments

#### **Acceptance Criteria**:
- [ ] Zero `any` types in both codebases
- [ ] TypeScript strict mode enabled
- [ ] All interfaces exported from `shared/schema.ts`

---

### **4.5: Logging & Monitoring** (2 days)
**Affects**: Both Apps  
**Priority**: P0 - BLOCKER

#### **Tasks**:

**[BOTH-4.5.1]** Structured Logging
- [ ] Install: `winston` or `pino`
- [ ] File: `server/utils/logger.ts`
- [ ] Configure log levels (error, warn, info, debug)
- [ ] Add request logging middleware
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-4.5.2]** Error Tracking - Backend
- [ ] Install: `@sentry/node`
- [ ] File: `server/index.ts`
- [ ] Configure Sentry with DSN
- [ ] Test error reporting
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-4.5.3]** Error Tracking - Frontend (E-commerce)
- [ ] Install: `@sentry/react`
- [ ] File: `client/src/main.tsx`
- [ ] Configure Sentry
- [ ] Add error boundary
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-4.5.4]** Error Tracking - Frontend (Admin)
- [ ] Install: `@sentry/react`
- [ ] File: `Fabric Speaks Admin/src/main.tsx`
- [ ] Configure Sentry
- [ ] Add error boundary
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Testing**:
- [ ] Trigger error, verify Sentry alert
- [ ] Check logs for structured JSON
- [ ] Test log rotation

#### **Acceptance Criteria**:
- [ ] All errors logged to Sentry
- [ ] All API requests logged with duration
- [ ] Logs searchable by user_id, endpoint
- [ ] Error boundaries catch React crashes

---

### **4.6: Critical Test Coverage** (2 days)
**Affects**: Both Apps  
**Priority**: P0 - BLOCKER

#### **Tasks**:

**[E-COMM-4.6.1]** Payment Flow E2E Test
- [ ] File: `tests/e2e/payment-flow.spec.ts`
- [ ] Test: Login → Add to cart → Checkout → Mock payment → Verify order
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.6.2]** Race Condition Test
- [ ] File: `tests/integration/race-condition.test.ts`
- [ ] Test: 2 users buy last item simultaneously
- [ ] Expected: 1 succeeds, 1 gets "out of stock"
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.6.3]** Inventory Sync Test
- [ ] File: `tests/integration/inventory-sync.test.ts`
- [ ] Test: Order → Stock update → Admin sees change
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.6.4]** Load Test
- [ ] Tool: k6 or Artillery
- [ ] File: `tests/load/checkout.k6.js`
- [ ] Target: 1000 concurrent users
- [ ] Metric: <500ms p95 latency
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.6.5]** Admin RBAC Test
- [ ] File: `Fabric Speaks Admin/tests/rbac.test.ts`
- [ ] Test: Non-admin cannot access admin routes
- [ ] Test: Admin can access admin routes
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-4.6.6]** Audit Log Test
- [ ] File: `Fabric Speaks Admin/tests/audit-log.test.ts`
- [ ] Test: Product delete creates audit log
- [ ] Test: Audit log contains correct data
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] Payment E2E test passes
- [ ] Race condition test passes
- [ ] Load test: <500ms p95 latency
- [ ] Test coverage >80% on critical paths
- [ ] Admin RBAC test passes
- [ ] Audit log test passes

---

### **4.7: Cart Validation Improvements** (1 day)
**Affects**: E-commerce App  
**Priority**: P1 - HIGH

#### **Tasks**:

**[E-COMM-4.7.1]** Validate Stock When Adding to Cart
- [ ] File: `server/cart.ts`
- [ ] Add stock check to `addCartItemHandler`
- [ ] Return error if out of stock
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-4.7.2]** Periodic Cart Validation
- [ ] File: `client/src/hooks/useCart.ts`
- [ ] Add periodic validation (every 5 minutes)
- [ ] Show warning if price/stock changed
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] Cannot add out-of-stock items to cart
- [ ] Cart shows warnings for price changes
- [ ] Periodic validation runs every 5 minutes

---

### **Phase 4 Completion Checklist**:
- [ ] All 17 critical issues resolved (E-commerce)
- [ ] All 10 critical issues resolved (Admin)
- [ ] Security audit passes (OWASP ZAP)
- [ ] Load test passes (1000 users)
- [ ] Zero TypeScript errors
- [ ] Test coverage >80%
- [ ] Sentry configured and tested
- [ ] All secrets rotated and in vault

**Phase 4 Exit Criteria**: Security score >80, All critical tests pass

---

## 🟠 PHASE 5: SCALABILITY (2 WEEKS)
**Priority**: P1 - Should do before launch  
**Goal**: Handle 100k+ products and 1000+ concurrent users

---

### **5.1: Pagination** (2 days)
**Affects**: E-commerce App

#### **Tasks**:

**[E-COMM-5.1.1]** Backend Cursor Pagination
- [ ] File: `server/products.ts`
- [ ] Implement cursor-based pagination
- [ ] Interface: `{ limit: number, cursor?: string }`
- [ ] Return: `{ products: [], nextCursor: string | null }`
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-5.1.2]** Frontend Infinite Scroll
- [ ] File: `client/src/hooks/useProducts.ts`
- [ ] Use React Query infinite queries
- [ ] Add infinite scroll component
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] Products API returns max 50 items per page
- [ ] Cursor pagination works correctly
- [ ] Frontend has smooth infinite scroll

---

### **5.2: Caching Layer** (3 days)
**Affects**: Both Apps

#### **Tasks**:

**[BOTH-5.2.1]** Setup Redis
- [ ] File: `docker-compose.yml`
- [ ] Add Redis service
- [ ] File: `server/cache/redis.ts`
- [ ] Create Redis client
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.2.2]** Cache Product Catalog
- [ ] File: `server/middleware/cache.ts`
- [ ] Cache product listing (1 hour TTL)
- [ ] Invalidate on product update
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.2.3]** Move Sessions to Redis
- [ ] File: `server/index.ts`
- [ ] Use `connect-redis` for session store
- [ ] Test session persistence
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.2.4]** Cache Cart Data
- [ ] Cache cart for 15 minutes
- [ ] Invalidate on cart update
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] Product listing cached
- [ ] Cache hit rate >80%
- [ ] Sessions in Redis (not memory)
- [ ] Cache invalidation works

---

### **5.3: Image Optimization** (2 days)
**Affects**: Both Apps

#### **Tasks**:

**[BOTH-5.3.1]** Integrate Cloudinary
- [ ] File: `server/utils/cloudinary.ts`
- [ ] Configure Cloudinary SDK
- [ ] Create upload function with transformations
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.3.2]** Update Product Upload
- [ ] File: `server/admin.ts` (E-commerce)
- [ ] File: `Fabric Speaks Admin/src/components/ProductForm.tsx`
- [ ] Upload images to Cloudinary
- [ ] Store Cloudinary URLs in database
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.3.3]** Frontend Lazy Loading
- [ ] Add `loading="lazy"` to all images
- [ ] Implement progressive image loading
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] Images served from CDN
- [ ] Auto WebP conversion
- [ ] Lazy loading on product grid
- [ ] Image load time <500ms

---

### **5.4: Database Optimization** (3 days)
**Affects**: Both Apps

#### **Tasks**:

**[BOTH-5.4.1]** Add Composite Indexes
- [ ] Migration: `supabase/migrations/20251122_add_composite_indexes.sql`
  ```sql
  CREATE INDEX idx_orders_user_status ON orders(user_id, status);
  CREATE INDEX idx_products_category_status ON products(category_id, status);
  CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
  CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
  ```
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.4.2]** Query Optimization
- [ ] Add `EXPLAIN ANALYZE` to slow queries
- [ ] Optimize N+1 queries (use joins)
- [ ] Add database connection pooling
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-5.4.3]** Setup Read Replicas (Production Only)
- [ ] Configure Supabase read replicas
- [ ] Route read queries to replicas
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Acceptance Criteria**:
- [ ] All queries <100ms
- [ ] No N+1 queries
- [ ] Indexes on all foreign keys
- [ ] Connection pool configured

---

### **5.5: Full-Text Search** (3 days)
**Affects**: E-commerce App

#### **Tasks**:

**[E-COMM-5.5.1]** PostgreSQL Full-Text Search
- [ ] Migration: `supabase/migrations/20251122_add_fts.sql`
  ```sql
  ALTER TABLE products ADD COLUMN search_vector tsvector;
  CREATE INDEX idx_products_search_vector ON products USING gin(search_vector);
  CREATE TRIGGER products_search_vector_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, brand);
  ```
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-5.5.2]** Update Search API
- [ ] File: `server/products.ts`
- [ ] Use `to_tsquery` for search
- [ ] Add ranking by relevance
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-5.5.3]** Frontend Search UI
- [ ] File: `client/src/components/FilterSidebar.tsx`
- [ ] Add search suggestions
- [ ] Add typo tolerance
- **Assignee**: ___________
- **Status**: ⬜ Not Started

#### **Alternative: Algolia** (Recommended for >50k products)
- [ ] Sync products to Algolia on create/update
- [ ] Use Algolia InstantSearch on frontend
- [ ] Add faceted search (category, price, brand)

#### **Acceptance Criteria**:
- [ ] Search returns results in <200ms
- [ ] Typo tolerance works
- [ ] Faceted search available

---

### **Phase 5 Completion Checklist**:
- [ ] Product listing <200ms
- [ ] Image load time <500ms
- [ ] Cache hit rate >80%
- [ ] All queries <100ms
- [ ] Search <200ms

**Phase 5 Exit Criteria**: Can handle 100k products, 1000 concurrent users

---

## 🟡 PHASE 6: BUSINESS FEATURES (3 WEEKS)
**Priority**: P2 - Nice to have  
**Goal**: Complete e-commerce feature set

---

### **6.1: Order Management** (1 week)
**Affects**: Both Apps

#### **Features**:

**[BOTH-6.1.1]** Order Cancellation
- [ ] API: `POST /api/orders/:id/cancel`
- [ ] Restore inventory on cancellation
- [ ] Send cancellation email
- [ ] Admin: View cancelled orders
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-6.1.2]** Refund Handling
- [ ] Integrate Razorpay refunds API
- [ ] Track refund status in database
- [ ] Admin: Process refunds
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-6.1.3]** Order Tracking
- [ ] Add `tracking_number` to orders
- [ ] Integrate with shipping provider API
- [ ] Customer: Track order page
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

### **6.2: Inventory Management** (1 week)
**Affects**: Admin Panel

#### **Features**:

**[ADMIN-6.2.1]** Low Stock Alerts
- [ ] Cron job: Check stock every hour
- [ ] Email admin if stock < threshold
- [ ] Admin: Low stock dashboard
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-6.2.2]** Inventory Adjustment Logs
- [ ] Table: `inventory_adjustments`
- [ ] Track: who, when, reason, quantity
- [ ] Admin: View adjustment history
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[ADMIN-6.2.3]** Bulk Product Import
- [ ] Upload CSV with products
- [ ] Validate and import
- [ ] Show import progress
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

### **6.3: Customer Features** (1 week)
**Affects**: E-commerce App

#### **Features**:

**[E-COMM-6.3.1]** Guest Checkout
- [ ] Allow checkout without registration
- [ ] Collect email for order confirmation
- [ ] Convert guest to user option
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-6.3.2]** Order History
- [ ] Filter by status, date range
- [ ] Reorder functionality
- [ ] Download invoice
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-6.3.3]** Product Recommendations
- [ ] "Customers also bought"
- [ ] Based on order history
- [ ] Recently viewed products
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

### **Phase 6 Completion Checklist**:
- [ ] Order cancellation works
- [ ] Refunds processed
- [ ] Order tracking available
- [ ] Low stock alerts sent
- [ ] Bulk import works
- [ ] Guest checkout available

---

## 🟢 PHASE 7: OPTIMIZATION (1 WEEK)
**Priority**: P3 - Future  
**Goal**: Performance and SEO

---

### **7.1: Performance** (3 days)

**[E-COMM-7.1.1]** Code Splitting
- [ ] Implement route-based code splitting
- [ ] Lazy load heavy components
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-7.1.2]** Service Worker
- [ ] Add service worker for offline support
- [ ] Cache static assets
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-7.1.3]** CDN Setup
- [ ] Configure CloudFront
- [ ] Serve static assets from CDN
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

### **7.2: SEO** (2 days)

**[E-COMM-7.2.1]** Sitemap Generation
- [ ] Generate `sitemap.xml`
- [ ] Submit to Google Search Console
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-7.2.2]** Structured Data
- [ ] Add Schema.org markup
- [ ] Product, Review, Organization schemas
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[E-COMM-7.2.3]** Meta Tags
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

### **7.3: Analytics** (2 days)

**[BOTH-7.3.1]** Google Analytics 4
- [ ] Install GA4
- [ ] Track page views, events
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-7.3.2]** Conversion Tracking
- [ ] Track add to cart
- [ ] Track checkout steps
- [ ] Track purchases
- **Assignee**: ___________
- **Status**: ⬜ Not Started

**[BOTH-7.3.3]** Heatmaps
- [ ] Install Hotjar or similar
- [ ] Analyze user behavior
- **Assignee**: ___________
- **Status**: ⬜ Not Started

---

## 📊 PROGRESS TRACKING

### **Overall Progress**:
```
Phase 1: ████████████████████ 100% ✅
Phase 2: ████████████████████ 100% ✅
Phase 3: ████████████████████ 100% ✅
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0% ⬜
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0% ⬜
Phase 6: ░░░░░░░░░░░░░░░░░░░░   0% ⬜
Phase 7: ░░░░░░░░░░░░░░░░░░░░   0% ⬜
──────────────────────────────────
Total:   ███████░░░░░░░░░░░░░  37.5%
```

### **Task Status Legend**:
- ⬜ Not Started
- 🟦 In Progress
- ✅ Complete
- ⚠️ Blocked
- ❌ Failed

---

## 🚨 RISK REGISTER

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Database transaction deadlocks | HIGH | MEDIUM | Implement retry logic, optimize queries | _____ |
| Razorpay API downtime | HIGH | LOW | Implement circuit breaker, fallback | _____ |
| Admin RBAC bypass | CRITICAL | MEDIUM | Security audit, penetration testing | _____ |
| Redis cache failure | MEDIUM | LOW | Graceful degradation, cache warming | _____ |
| Load test failure | HIGH | MEDIUM | Horizontal scaling, CDN | _____ |

---

## 📋 DEPLOYMENT CHECKLIST

### **Before Production Deployment**:

#### **Infrastructure**:
- [ ] Staging environment set up
- [ ] Production environment set up
- [ ] Database backups automated (daily)
- [ ] Redis cluster configured
- [ ] CDN configured (CloudFront)
- [ ] SSL certificates installed
- [ ] Domain DNS configured

#### **Security**:
- [ ] All secrets in vault (AWS Secrets Manager)
- [ ] Secrets rotated
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] CSP headers configured
- [ ] RBAC tested
- [ ] Audit logging verified

#### **Monitoring**:
- [ ] Sentry configured
- [ ] Logging configured (Winston/Pino)
- [ ] Monitoring dashboards (Grafana/DataDog)
- [ ] Alerts configured (PagerDuty/Opsgenie)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)

#### **Testing**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Load test passes (1000 users)
- [ ] Security scan passes (OWASP ZAP)
- [ ] Accessibility audit passes (WCAG 2.1)

#### **Documentation**:
- [ ] API documentation (Swagger/Postman)
- [ ] Deployment runbook
- [ ] Incident response plan
- [ ] On-call rotation defined
- [ ] User documentation

#### **Legal/Compliance**:
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Cookie consent
- [ ] GDPR compliance
- [ ] PCI-DSS compliance (if storing cards)

---

## 🎯 SUCCESS METRICS

### **Phase 4 (Production Blockers)**:
| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Security Score | 30/100 | 90/100 | ___ |
| Test Coverage | 25% | 80% | ___ |
| TypeScript Errors | 70+ | 0 | ___ |
| Load Test p95 | N/A | <500ms | ___ |
| Admin Security Score | 15/100 | 90/100 | ___ |

### **Phase 5 (Scalability)**:
| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Product Listing Time | 5s | <200ms | ___ |
| Image Load Time | 3s | <500ms | ___ |
| Cache Hit Rate | 0% | 80% | ___ |
| Query Time | 1s | <100ms | ___ |

### **Phase 6 (Business Features)**:
| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Order Cancellation Rate | N/A | <5% | ___ |
| Cart Abandonment | N/A | <30% | ___ |
| Reorder Rate | N/A | >10% | ___ |

---

## 📞 ESCALATION PATH

### **Blockers**:
- **Database Issues** → Escalate to DBA
- **Razorpay API Issues** → Contact Razorpay support
- **Performance Issues** → Add caching, optimize queries
- **Security Issues** → Immediate team meeting, security audit

### **Daily Standup**:
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

### **Weekly Review**:
- Review progress against plan
- Update risk register
- Adjust timeline if needed

---

## 📚 RESOURCES

### **Documentation**:
- Drizzle ORM: https://orm.drizzle.team/docs/transactions
- Razorpay: https://razorpay.com/docs/
- Sentry: https://docs.sentry.io/platforms/node/
- Supabase: https://supabase.com/docs
- React Query: https://tanstack.com/query/latest

### **Tools**:
- OWASP ZAP: https://www.zaproxy.org/
- k6 Load Testing: https://k6.io/
- Cloudinary: https://cloudinary.com/documentation

---

**Plan Version**: 3.0 (Unified)  
**Last Updated**: November 21, 2025  
**Next Review**: After Phase 4 completion  
**Maintained By**: Development Team
