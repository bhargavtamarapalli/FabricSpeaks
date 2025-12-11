# PROJECT HEALTH AND TEST SPECIFICATION
**Version:** 1.0.0
**Status:** DRAFT
**Author:** Lead QA Architect (Agent)

---

## 1. Executive Summary
This document defines the "Automated Regression" model for the Fabric Speaks E-commerce and Admin applications. It unifies all testing layers under one umbrella, enforces strict environment checks, and establishes a non-negotiable data hygiene protocol to eliminate flakiness.

---

## Section A: Architecture & Granularity

We will adopt a **Pyramid Testing Architecture** with strict naming conventions to enable feature-specific execution.

### 1. Naming Conventions
To ensure granularity and clarity, we will standardize file names. This allows running tests for specific features (e.g., `npm run test --grep "cart"`) or layers.

| Layer | Scope | Naming Pattern | Location |
|-------|-------|----------------|----------|
| **Unit** | Individual functions/components in isolation. Mocks all dependencies. | `*.unit.test.ts` | `tests/unit/` |
| **Integration** | Interaction between API, DB, and Services. Real DB connection. | `*.integration.test.ts` | `tests/integration/` |
| **E2E** | Full user journeys in browser. Real Frontend + Backend + DB. | `*.e2e.spec.ts` | `tests/e2e/` |

### 2. Directory Structure
We will organize `tests/` to mirror the feature structure where possible, or keep the current layered structure but ensure filenames are descriptive.

```text
tests/
├── unit/
│   ├── auth.unit.test.ts
│   ├── cart.unit.test.ts
│   └── ...
├── integration/
│   ├── auth.integration.test.ts
│   ├── cart.integration.test.ts
│   └── ...
├── e2e/
│   ├── auth.e2e.spec.ts
│   ├── checkout.e2e.spec.ts
│   └── ...
└── fixtures/          # Shared test data/mocks
```

---

## Section B: Pre-Flight Logic (Environment Health Check)

**Protocol:** The test runner MUST abort immediately if the environment is not healthy.
**Script:** `scripts/check-test-environment.ts` (Existing script to be enhanced).

### Pseudo-Code Logic
```typescript
async function preFlightCheck() {
  console.log("🚀 Starting Pre-Flight Checks...");

  // 1. Check Dependencies
  if (!checkNodeModules()) abort("❌ node_modules missing. Run 'npm install'.");

  // 2. Check Ports
  if (!checkPort(5000)) abort("❌ Backend not running on :5000.");
  if (!checkPort(5173)) abort("❌ Frontend not running on :5173.");

  // 3. Check Database
  if (!checkDBConnection()) abort("❌ Database unreachable.");
  if (!checkDBSeeded()) abort("❌ Database is empty. Run 'npm run seed'.");

  // 4. Check Env Vars
  if (!checkEnvVars(['VITE_SUPABASE_URL', 'STRIPE_KEY'])) abort("❌ Missing ENV vars.");

  console.log("✅ Environment Healthy. Proceeding to tests.");
}
```

---

## Section C: Gap Analysis Report

Comparing current implementation against Industry Standard E-commerce MVPs.

| Feature Area | Current Status | Missing MVP Features (Critical) | Future Enhancements (Post-MVP) |
|--------------|----------------|---------------------------------|--------------------------------|
| **Cart** | Basic Add/Remove | **Stock Validation** (Prevent adding > stock), **Price Sync** (Warn if price changed) | Save for Later, Share Cart |
| **Checkout** | Happy Path | **Error Boundaries** (Payment Failures), **Address Validation**, **Guest Checkout** | One-click Checkout, Gift Wrapping |
| **Products** | Listing, Details | **Empty States** (No products found), **Loading Skeletons** | Advanced Filtering (Faceted Search), Recommendations |
| **Admin** | Basic CRUD | **RBAC** (Role Based Access), **Audit Logs** | Bulk Import/Export, Analytics Dashboard |
| **General** | - | **404 Pages**, **Network Error Handling** (Offline mode) | PWA Support, Dark Mode |

---

## Section D: The Full Test Matrix

This matrix defines the *mandatory* coverage for every feature.

### 1. Authentication (`auth`)
| Type | Scenario | Layer |
|------|----------|-------|
| **Positive** | User can sign up with valid email/password. | E2E |
| **Positive** | User can login and receive session token. | Integration |
| **Negative** | Login fails with incorrect password. | Integration |
| **Edge** | Login with unverified email (if applicable). | Integration |
| **Edge** | Session timeout handling. | E2E |

### 2. Shopping Cart (`cart`)
| Type | Scenario | Layer |
|------|----------|-------|
| **Positive** | Add item to cart, update quantity, remove item. | E2E |
| **Positive** | Cart total calculates correctly (Subtotal + Tax). | Unit |
| **Negative** | Add item with 0 stock (Should fail). | Integration |
| **Negative** | Add more quantity than available stock. | Integration |
| **Edge** | Add 100 different items (Performance). | Load |
| **Edge** | Concurrent updates (Race condition). | Integration |

### 3. Checkout & Payment (`checkout`)
| Type | Scenario | Layer |
|------|----------|-------|
| **Positive** | Guest checkout flow (if enabled). | E2E |
| **Positive** | Registered user checkout flow. | E2E |
| **Negative** | Payment gateway failure (Mocked). | E2E |
| **Negative** | Invalid shipping address. | E2E |
| **Edge** | Network timeout during payment processing. | E2E |
| **Responsive** | Checkout layout on Mobile (375x812). | E2E (Mobile) |

### 4. Product Catalog (`products`)
| Type | Scenario | Layer |
|------|----------|-------|
| **Positive** | Search returns relevant results. | Integration |
| **Positive** | Filter by Category/Price. | E2E |
| **Negative** | Search returns no results (Empty State). | E2E |
| **Edge** | Pagination (Page 1 -> 2). | E2E |

---

## Section E: Execution Strategy

### 1. Unified `package.json` Scripts
We will consolidate scripts to allow granular control.

```json
{
  "scripts": {
    "test": "npm run check-env && npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run tests/unit",
    "test:integration": "npm run check-env && vitest run tests/integration",
    "test:e2e": "npm run check-env && playwright test",
    "test:e2e:headless": "npm run check-env && playwright test --headed=false",
    "test:e2e:mobile": "npm run check-env && playwright test --project='Mobile Chrome'",
    "test:auth": "npm run check-env && vitest run tests/**/auth* && playwright test tests/e2e/*auth*",
    "check-env": "tsx scripts/check-test-environment.ts"
  }
}
```

### 2. Data Hygiene Protocol (Non-Negotiable)
To prevent flaky tests, we strictly control data state.

*   **Unit Tests:** **NO DB ACCESS.** Mock all repositories/services.
*   **Integration Tests:**
    *   **Setup:** Create unique, isolated data per test file (e.g., `User_${Timestamp}`).
    *   **Teardown:** Hard delete created data in `afterAll`.
*   **E2E Tests:**
    *   **Global Setup:** Wipe DB and Seed a "Known Good State" (Gold Master) before the suite runs.
    *   **Isolation:** Tests should not depend on data created by other tests.

### 3. Migration Plan
*   **Keep:** `tests/e2e/checkout.e2e.spec.ts` (Refactor to use new fixtures).
*   **Refactor:** `tests/integration/cart-validation-api.integration.test.ts` (Ensure strict teardown).
*   **Delete:** Any test that fails >3 times in a row without code changes (Flaky).

---
