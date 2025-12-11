# Admin App Migration Plan

## Goal
Migrate the **Fabric Speaks Admin** application from a direct-to-database (Supabase Client) architecture to a secure, backend-driven (API) architecture. This ensures business logic consistency, proper validation, and centralized control.

## Phase 1: Preparation & Safety (Immediate)
**Objective:** Prevent data corruption and prepare the codebase for migration.

- [ ] **Sync Types:** Update `Fabric Speaks Admin/src/types/index.ts` to match `Fabric Speaks/shared/schema.ts`.
    - [ ] Add missing fields (`fabric_quality`, `wash_care`, `slug`).
    - [ ] Fix `images` type definition (Handle JSONB vs string array).
- [ ] **Standardize Images:** Create a utility in Admin App to convert between Frontend Image Array and Backend JSONB format.
- [ ] **Setup API Client:** Create `src/lib/api.ts` in Admin App using `axios` or `fetch`.
    - [ ] Configure base URL (`http://localhost:5000/api`).
    - [ ] Add Auth Interceptor (attach JWT token from AuthContext).

## Phase 2: Backend API Expansion
**Objective:** Ensure the Main App's Backend has all the endpoints required by the Admin App.

- [ ] **Dashboard API:**
    - [ ] Create `GET /api/admin/stats` to replace `Overview.tsx` queries.
- [ ] **Product Management APIs:**
    - [ ] Update `GET /api/admin/products` to support filtering/searching (currently in `listProductsHandler`).
    - [ ] Update `POST /api/admin/products` to use Zod validation and handle all fields.
    - [ ] Create `POST /api/admin/products/bulk-status` for bulk updates.
- [ ] **Variant Management APIs:**
    - [ ] Create `POST /api/admin/variants/bulk-stock` to handle the complex stock logic currently in `useVariants.ts`.
- [ ] **Inventory API:**
    - [ ] Create `GET /api/admin/inventory` for the Inventory page.

## Phase 3: Frontend Migration (Iterative)
**Objective:** Refactor Admin App components to use the new APIs.

- [ ] **Migrate Overview Page:**
    - [ ] Replace `supabase.from('orders')` & `products` counts with `useQuery(['adminStats'], fetchAdminStats)`.
- [ ] **Migrate Products Page:**
    - [ ] Replace `supabase.from('products').select('*')` with `useQuery(['products'], fetchAdminProducts)`.
    - [ ] Update `handleDelete` to use API.
    - [ ] Update `handleBulkStatusUpdate` to use API.
- [ ] **Migrate Product Form:**
    - [ ] Update `ProductForm.tsx` to submit to `POST /api/admin/products` or `PUT /api/admin/products/:id`.
    - [ ] Ensure image upload uses the `/api/upload` endpoint instead of direct Supabase Storage (if applicable) or standardizes the URL format.
- [ ] **Migrate Orders Page:**
    - [ ] Replace direct DB listeners with polling or just standard queries for now.
    - [ ] Use `PUT /api/admin/orders/status` for status updates (already exists!).

## Phase 4: Verification & Cleanup
**Objective:** Remove legacy code and verify system integrity.

- [ ] **Verify Flows:**
    - [ ] Create a Product -> Check Main App DB.
    - [ ] Update Order Status -> Check Email Sending (Main App logs).
- [ ] **Remove Supabase:**
    - [ ] Uninstall `@supabase/supabase-js` from Admin App.
    - [ ] Delete `src/lib/supabase.ts`.
    - [ ] Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.

## Execution Strategy
We will execute **Phase 1** immediately. Then we will alternate between **Phase 2** (Backend) and **Phase 3** (Frontend) feature by feature (e.g., "Fix Products" -> Backend + Frontend, then "Fix Orders" -> Backend + Frontend).
