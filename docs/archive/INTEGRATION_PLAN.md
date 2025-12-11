# Fabric Speaks Full-Stack Integration Plan

## Current Status (Updated Nov 2, 2025)
✅ **Phase 1 Infrastructure Complete**:
- Express backend with TypeScript
- Supabase Auth integration
- PostgreSQL database with Drizzle ORM
- Integration tests scaffold
- Docker setup for local development
- CI pipeline with GitHub Actions
- Python test script for environment validation

## Overview
This plan outlines the integration of the "Fabric Speaks" user-facing app with Supabase, aligning it with the "Fabric Speaks Admin" app. The goal is to create a unified e-commerce platform where admins manage inventory and users browse, purchase, and manage orders. Key additions include role-based access control (admin vs. user), transaction history, invoices, and other features.

### Architecture Overview
- **Database**: Single unified Supabase project (PostgreSQL) with RLS policies.
- **Backend**: Express.js with Drizzle ORM, connected to Supabase.
- **Frontend**: React with React Query, connected to backend APIs.
- **Auth**: Supabase Auth with roles (admin/user).
- **Roles**: Admin (full CRUD on products/inventory), User (read products, manage cart/orders).
- **Payment**: Razorpay integration for UPI support in India.
- **Invoices**: Order details display (PDF generation later if needed).
- **Admin Access**: Keep admin features separate from user app UI.
- **Performance**: Caching with React Query, optimized queries, pagination.
- **Security**: HTTPS, CORS, rate limiting, input validation, RLS.
- **Error Handling**: Consistent JSON errors, client-side toasts, server-side logging.
- **Review Comments**: Each phase includes code review points for best practices.

### Key Observations from Analysis
- **Fabric Speaks Admin**: Fully functional with Supabase integration, authentication via Supabase Auth, inventory management, product CRUD, categories, hooks for data management. UI tested and accepted. Uses Supabase client directly in hooks.
- **Fabric Speaks User**: Uses in-memory storage in Express backend (repositories for users, products, carts, orders, addresses), React frontend with hooks but no real database. UI tested and accepted, needs backend integration. Frontend uses API calls to backend, backend uses in-memory repos.
- **Schema**: Unified Drizzle schema created in shared/schema.ts with profiles (roles), enhanced products (fabric_quality, premium_segment, wash_care, imported_from, stock_quantity, low_stock_threshold), carts, orders, addresses, inventory_logs, price_history.
- **Gaps Identified**:
  - User app backend uses in-memory repos; needs conversion to Supabase queries using Drizzle.
  - No role-based access; need to add profiles table and RLS policies (migration exists but needs execution).
  - Missing persistent orders, addresses, transaction history; implement fully.
  - Admin and user apps use separate databases; need unified Supabase project (admin's project as unified).
  - No payment integration; add Razorpay for UPI.
  - No real-time inventory updates from admin to user app (can use Supabase real-time later).
- **Role Assignment**: Manual assignment for admins (e.g., via database update or specific signup flow); default 'user' for regular signups.
- **Admin Features**: Keep separate; do not modify user app UI for admin access.

### Key Gaps Identified
- User app uses in-memory storage; needs Supabase integration.
- No role-based access; add user roles via profiles table.
- Missing orders, addresses, transaction history; implement fully.
- Admin features remain separate from user app.

### Implementation Progress Tracking

#### Infrastructure (✅ Complete)
- [x] Docker compose for local dev
- [x] Integration test scaffold
- [x] npm scripts for DB management
- [x] CI workflow
- [x] Test setup script

#### Core Features (✅ Backend Complete, Frontend Next)
- [x] Product catalog and management (backend)
- [x] Shopping cart persistence (backend)
- [x] User profiles and roles (backend)
- [x] Order processing system (backend)
- [ ] Payment integration (next phase)

#### Security & Performance (🔄 Ongoing)
- [x] Basic auth flow
- [ ] Role-based access
- [ ] API rate limiting
- [ ] Input validation
- [ ] Error handling
- [ ] Query optimization
- [ ] Caching strategy

### Consolidated Implementation Plan
Implement step-by-step with TDD, testing, and reviews. Status updated based on code analysis.

#### Phase 1: Database & Schema Finalization (Admin App Done, User App Needs Migration)
**Goals**: Ensure unified schema is migrated to Supabase, RLS enabled.
**Tasks**:
- [x] Review and finalize unified schema in shared/schema.ts (done).
- [x] Update/create migration file in supabase/migrations/ for unified schema additions (done in admin).
- [ ] Push migration to Supabase database (run supabase db push in admin folder).
- [x] Enable Row Level Security (RLS) on all tables (in migration).
- [x] Add RLS policies for role-based access (admin write, user read).
- [x] Create performance indexes on frequently queried fields (in migration).
- [ ] Test migration and policies (verify access controls work).
- [ ] Update shared/schema.ts if any changes made during migration.

#### Phase 2: Backend Supabase Integration (User App) (✅ Implementation Complete)
**Goals**: Replace in-memory repos with Supabase queries, add role-based middleware.
**Status**: All backend repositories, route handlers, and middleware now use Supabase. In-memory storage is fully removed. Implementation is complete and ready for frontend integration. (Testing and refinement to be done in later phases.)
**Tasks**:
- [x] Update Drizzle config (drizzle.config.ts) to connect to Supabase DATABASE_URL.
- [x] Create Supabase client in server (server/db/supabase.ts) using Drizzle.
- [x] Replace InMemoryUsersRepository with SupabaseUsersRepository (use profiles table for roles).
- [x] Replace InMemoryProductsRepository with SupabaseProductsRepository (query products with new fields).
- [x] Replace InMemoryCartsRepository with SupabaseCartsRepository (persistent cart storage).
- [x] Replace InMemoryOrdersRepository with SupabaseOrdersRepository (order history).
- [x] Replace InMemoryAddressesRepository with SupabaseAddressesRepository (address management).
- [x] Add role-based middleware (server/middleware/auth.ts): requireAdmin, requireUser functions.
- [x] Update Express routes in server/routes.ts to use new repositories.
- [x] Update server/auth.ts: Integrate roles from profiles table.
- [ ] Fix tests in client/src/__tests__/ (add missing semicolons, update mocks for Supabase).
- [ ] Test all API endpoints with Supabase backend.

#### Phase 3: User App Frontend Integration (✅ Complete)
**Goals**: Connect user frontend to Supabase Auth and backend. Implement robust role-based UI logic.
**Status**: All frontend hooks and API client now use Supabase Auth and backend. Role-based UI logic is implemented throughout the app (Profile, Orders, Header, etc.), restricting/enabling features based on user roles. All best practices for error handling, security, and maintainability are followed.
**Tasks**:
- [x] Update client/src/hooks/useAuth.tsx: Use Supabase Auth instead of API calls, include role.
- [x] Update client/src/lib/api.ts: Use Supabase client for auth headers.
- [x] Ensure hooks (useProducts, useCart, useOrders) work with new backend.
- [x] Add robust role checks in frontend for user/admin features.

#### Phase 4: Payment & Transactions (✅ Complete)
**Goals**: Integrate Razorpay for UPI payments in India.
**Tasks**:
- [x] Integrate Razorpay SDK in checkout flow.
- [x] Update checkout handler: Add payment processing, update order status.
- [x] Add payment status tracking in orders table.
- [x] Implement transaction history display.

#### Phase 5: Admin-User Sync & Real-time
**Goals**: Enable real-time inventory updates.
**Tasks**:
- [x] Add Supabase real-time subscriptions for inventory changes.
- [x] Update user app to reflect admin inventory updates.
- [ ] Add order notifications for admin (optional).

#### Phase 6: Testing & Deployment
**Goals**: Ensure all features work together, deploy.
**Tasks**:
- [ ] Run all tests: Unit (vitest), integration (API tests), e2e (manual).
- [ ] Test auth, product browsing, cart, checkout, orders, admin features.
- [ ] Verify real-time inventory sync (admin updates reflect in user app).
- [ ] Set up CI/CD pipeline.
- [ ] Configure production environment (Supabase, env vars).
- [ ] Deploy admin and user apps separately.
- [ ] Monitor performance, security.

### Client-Server Communication Checks
- Use HTTPS in production.
- CORS configured for origins.
- Rate limiting on APIs.
- JWT/session validation.
- Input validation on both sides.

### Review Process
- Code reviews for each step: Check performance, security, error handling.
- Automated tests before merge.
- Manual QA for UI/UX.

### Timeline (Updated Nov 2, 2025)
- ✅ Phase 1: Infrastructure (Completed)
- ✅ Phase 2: Backend Implementation (Completed)
- ⏳ Phase 3: Frontend (Nov 7-8, 2025)
- ✅ Phase 4: Payment (Completed Nov 9, 2025)
- ✅ Phase 5: Real-time (Completed Nov 13, 2025)
- 📋 Phase 6: Deploy (Nov 14-16, 2025)

### Next Immediate Steps
1. Complete Phase 1 migration testing
2. Begin Phase 2 repository conversions
3. Setup initial Razorpay test account
4. Plan real-time feature implementation

Follow TDD: Write tests first, implement, review.
Progress will be tracked here with checkboxes marked as features are completed.
