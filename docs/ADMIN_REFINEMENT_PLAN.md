# Admin Refinement & Enhancement Plan

**Objective**: To transition the Admin Frontend from "Prototype" to "Production Ready" by addressing critical gaps, integrating real backend logic, and adding requested advanced features.

---

## 📅 Phase 1: Foundation, Performance & UX (Immediate)
**Goal**: Ensure the app is stable, performant, and easy to navigate before adding complex logic.

### 1.1 Global Error Handling
- **Task**: Create a global `ErrorBoundary` component to catch React rendering errors.
- **Task**: Implement a centralized **API Error Interceptor** in `api.ts`.
  - Handle `401 Unauthorized` (Auto-logout).
  - Handle `403 Forbidden` (Permission denied).
  - Handle `500 Server Error` (Generic toast).

### 1.2 Performance Optimization
- **Task**: Implement **Code Splitting** for all Admin Routes.
  - Use `React.lazy()` and `Suspense` to load admin pages only when accessed.
  - This reduces the initial bundle size for regular store visitors.

### 1.3 Command Palette (Cmd+K) 🆕
- **Task**: Implement a global search modal accessible via `Ctrl+K` / `Cmd+K`.
- **Features**:
  - Quick navigation to pages (Products, Orders, Settings).
  - Search products by name/SKU.
  - Search orders by ID.
  - Quick actions (e.g., "Create New Product").

---

## 📅 Phase 2: Inventory Bulk Operations
**Goal**: Enable efficient management of product variants.

### 2.1 Backend Implementation
- **Task**: Create `POST /api/admin/inventory/bulk-update` endpoint.
- **Logic**: Accept an array of updates and execute them in a single **Database Transaction** to ensure data integrity.
- **Schema**: No schema changes expected, but need to verify `variants` table structure supports atomic updates.

### 2.2 Frontend Implementation
- **Task**: Create `BulkInventoryMatrix` component.
  - **Visual**: A grid view with Sizes as columns and Colors as rows.
  - **Interaction**: Tab through cells to quickly input stock numbers.
- **Task**: Integrate into the `Inventory` page (e.g., "Bulk Edit" button).

---

## 📅 Phase 3: Real-Time Updates (WebSockets)
**Goal**: Make the admin panel "live" for Orders and Notifications.

### 3.1 Backend WebSocket Setup
- **Task**: Initialize `Socket.io` (or similar) on the Express server.
- **Events**: Define events for `order:created`, `order:updated`, `inventory:low`, `notification:new`.

### 3.2 Frontend Integration
- **Task**: Create `useSocket` hook and `SocketProvider`.
- **Task**: Update `OrderTable` to listen for `order:updated` and refresh data automatically.
- **Task**: Update `NotificationBadge` to increment count on `notification:new`.

---

## 📅 Phase 4: Analytics & Reporting Engine
**Goal**: Replace mock data with real business intelligence.

### 4.1 Backend Aggregation Service
- **Task**: Create `StatsService` in backend.
- **Endpoints**:
  - `GET /api/admin/stats/revenue` (Grouped by day/month).
  - `GET /api/admin/stats/top-products` (Aggregated order items).
  - `GET /api/admin/stats/customer-growth`.
  - `GET /api/admin/stats/regional-sales`.

### 4.2 Frontend Integration
- **Task**: Update `client/src/lib/admin/api.ts` to use these real endpoints.
- **Task**: Refactor `Analytics.tsx` to consume real data.

---

## 📅 Phase 5: Advanced Settings & Security
**Goal**: Secure the platform and manage the team.

### 5.1 Two-Factor Authentication (2FA)
- **Task**: Backend: Implement TOTP (Time-based One-Time Password) logic using `speakeasy` or similar.
  - Endpoints: `/generate-2fa`, `/verify-2fa`, `/validate-2fa`.
- **Task**: Frontend: Update `SecuritySettings` to show QR code and verify token.

### 5.2 Team Management
- **Task**: Backend: Implement invite logic (send email with registration link).
- **Task**: Frontend: Connect `TeamSettings` "Invite" form to the backend.

---

## 📅 Phase 6: Final Polish & Verification
**Goal**: Ensure everything works as expected.

### 6.1 API Verification
- **Task**: Systematically test every admin endpoint.
- **Task**: Run integration tests.

### 6.2 Deployment Prep
- **Task**: Environment variable audit.
- **Task**: Build verification.

---

**Ready to Start?**
We can begin with **Phase 1** immediately to establish the foundation.
