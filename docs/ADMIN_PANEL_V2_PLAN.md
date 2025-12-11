# Admin Panel V2 - Implementation Plan

## 1. Goal Description

Transform the current "POC-level" Admin Dashboard into a production-ready "Version 2" system. This involves fixing fundamental architectural flaws (theming, search), implementing missing core features (persistence, pagination), and removing technical debt.

## 2. Phasing & Roadmap

### Phase 1: Core Architecture & Theming (Foundation)
**Objective:** Establish a stable, theme-aware foundation.
- [ ] **Infrastructure:** Create a global `ThemeProvider` context.
- [ ] **Refactoring:** Replace all hardcoded admin colors (e.g., `from-slate-950`, `bg-slate-900`) with semantic Tailwind variables (`bg-background`, `bg-card`).
- [ ] **Cleanup:** Remove duplicate theme logic from `AdminHeader.tsx`.
- [ ] **Components:** Create reusable `AdminPageHeader` and `AdminDataTable` components to reduce code duplication.

### Phase 2: Data & Search (Intelligence)
**Objective:** Make the admin panel actually useful for finding and managing data.
- [ ] **Search:** Implement a robust Global Search hook (`useAdminSearch`).
- [ ] **API:** Create a unified search endpoint `GET /api/admin/search?q=...`.
- [ ] **UI:** Wire up the Header Search bar to the new API.
- [ ] **Data Generation:** Execute seed scripts to populate 200+ orders and 50+ customers.
- [ ] **Pagination:** Add server-side pagination to Orders, Products, and Customers APIs.

### Phase 3: Feature Remediation (Functionality)
**Objective:** Fix broken or incomplete pages.
- [ ] **Settings:** Replace mock API calls with real endpoints for Profile, Security, and Team settings.
- [ ] **Orders:** Implement the "Date Range" filter logic in the backend.
- [ ] **Analytics:** Remove hardcoded trend data; implement real comparison logic (Current vs Previous Period).
- [ ] **Products:** Implement "Bulk Actions" (Delete, Status Change) UI.

### Phase 4: Polish & Performance (Quality)
**Objective:** Ensure reliability and speed.
- [ ] **Error Handling:** Wrap distinct page sections (charts, tables) in granular `ErrorBoundaries`.
- [ ] **UX:** Replace `window.confirm()` with custom ShadCN Dialogs.
- [ ] **Cleanup:** Global grep and remove of all `console.log` statements.
- [ ] **SEO:** Verify `noIndex` is present on all admin routes.

## 3. Technical Specifications

### 3.1 New Hooks
*   `useAdminTheme`: Unified access to theme state.
*   `useAdminSearch`: Debounced global search.
*   `useAdminFilters`: Shared logic for URL-based filtering and pagination.

### 3.2 Component Abstractions
```tsx
// Example: Reusable Data Table
<AdminDataTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  pagination={pagination}
  onPageChange={setPage}
  bulkActions={[...]}
/>
```

## 4. Verification Plan

### 4.1 Automated Tests
*   **Unit:** Test `transformProductData` for correct snake_case conversion.
*   **Integration:** Verify `GET /admin/search` returns mixed results (products + orders).

### 4.2 Manual Verification
*   **Theming:** Toggle Dark/Light mode; verify NO slate-900 hardcodes remain.
*   **Search:** Type "Shirt" in header; verify results appear in dropdown/modal.
*   **Pagination:** Go to Orders; verify "Next Page" loads new data without page reload.
