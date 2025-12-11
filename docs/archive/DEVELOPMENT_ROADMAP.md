# 📋 FabricSpeaks Development Roadmap

**Updated:** November 17, 2025  
**Strategy:** Development & Testing Focus | Deployment Deferred to Final Phase  
**Total Development Time:** ~28-35 hours (3-4 days focused development)

---

## 🎯 Development Strategy

✅ **Completed:** Phase 0 (Analysis), Task 1 (Error Tracking), Task 2 (E2E Tests), Task 4 (Security & Performance)

⏳ **Current Focus:** Phase 1 Remaining + Phase 2 Data Integration

⏸️ **Deferred:** Phase 5 (Deployment) - Will activate after all development complete

**Principle:** Complete all development and testing → THEN focus on deployment infrastructure

---

## 📊 Development Phases

### 🔴 Phase 1 Remaining (CURRENT - 4-6 hours)

**Status:** In Progress | **Priority:** CRITICAL

#### Task 1.4: Cart Validation & Stock Checks (2-3 hours)
**What:** Ensure cart operations are safe and consistent

**Files to Modify:**
- `client/src/hooks/useCart.ts` - Add validation logic
- `client/src/pages/Cart.tsx` - Show stock status
- `server/cart.ts` - Add stock validation endpoint

**Implementation Checklist:**
- [ ] Check stock before adding item to cart
- [ ] Prevent adding out-of-stock items
- [ ] Validate total cart stock before checkout
- [ ] Show out-of-stock warnings in UI
- [ ] Handle partial availability gracefully
- [ ] Update cart items if stock changed
- [ ] Add toast notifications for stock issues
- [ ] Write comprehensive test cases

**Tests to Add:** 8-10 test cases
- Stock validation tests
- Out-of-stock handling tests
- Partial availability tests
- Concurrent update tests

---

#### Task 1.5: Order Email Notifications (2-3 hours)
**What:** Send email confirmations and status updates to customers

**Files to Modify/Create:**
- `server/orders.ts` - Add email sending logic
- `server/email.ts` - Email template functions (may exist)
- `supabase/migrations/` - If needed for email templates table

**Implementation Checklist:**
- [ ] Create order confirmation email template
- [ ] Send email on order creation
- [ ] Create order status update template
- [ ] Send email on order status change
- [ ] Create shipping notification email
- [ ] Add error handling for email failures
- [ ] Implement retry logic for failed emails
- [ ] Test email delivery
- [ ] Add email logging
- [ ] Create email preference settings (optional)

**Tests to Add:** 5-6 test cases
- Order confirmation email tests
- Status update email tests
- Error handling tests
- Retry logic tests

**Dependencies:** Email service already set up in Admin app

---

### ⏳ Phase 2: Admin-Main App Integration (HIGH PRIORITY - 7-9 hours)

**Status:** Not Started | **Priority:** HIGH  
**Start After:** Phase 1 Remaining complete

#### Task 2.1: Admin-Main App Data Flow Testing (3-4 hours)
**What:** Verify data flows seamlessly between admin and main apps

**Key Scenarios to Test:**
1. Admin creates product → Main app displays it immediately
2. Admin updates inventory → Main app shows updated stock
3. Admin updates order status → Customer sees new status
4. Admin creates category → Main app shows it
5. Concurrent updates don't cause conflicts
6. Real-time subscriptions are active and working

**Files to Create/Modify:**
- `tests/integration/admin-main-sync.test.ts` - New test file
- Database RLS policies - Verify correctness
- Supabase subscription setup - Verify all tables

**Tests to Add:** 10-12 test cases
- Product sync tests
- Inventory sync tests
- Order sync tests
- Category sync tests
- Real-time subscription tests
- Concurrent update tests

---

#### Task 2.2: Cart Merge on Login (2 hours)
**What:** Merge anonymous cart with logged-in user's cart

**Scenario:**
1. User adds items to cart (anonymous)
2. User logs in
3. App detects anonymous cart
4. App fetches user's existing cart
5. Merges items intelligently (highest quantity wins)
6. Removes anonymous cart
7. Shows merge confirmation to user

**Files to Modify:**
- `client/src/contexts/AuthContext.tsx` - Add merge trigger
- `client/src/hooks/useCart.ts` - Add merge function
- `server/routes.ts` - Add merge endpoint if needed

**Implementation Checklist:**
- [ ] Detect anonymous cart before login
- [ ] Fetch user cart after login
- [ ] Implement merge logic (qty handling)
- [ ] Remove anonymous cart after merge
- [ ] Show merge summary to user
- [ ] Handle edge cases (duplicate items, qty conflicts)
- [ ] Add comprehensive tests
- [ ] Log merge operations

**Tests to Add:** 6-8 test cases
- Merge with empty user cart
- Merge with existing user cart
- Quantity conflict resolution
- Duplicate item handling
- Edge cases (removed items, etc.)

---

#### Task 2.3: Real-Time Update Validation (2-3 hours)
**What:** Verify all real-time subscriptions work correctly

**Subscriptions to Validate:**
1. Products subscription (admin creates → main app sees)
2. Inventory subscription (admin updates → main app sees)
3. Orders subscription (order status changes → customer sees)
4. Categories subscription (admin creates → main app sees)
5. Cart subscription (multiple users concurrent updates)

**Files to Create:**
- `tests/integration/realtime-subscriptions.test.ts` - New test file

**Tests to Add:** 10-12 test cases
- Product update subscription tests
- Inventory update subscription tests
- Order update subscription tests
- Category update subscription tests
- Multiple concurrent subscriber tests
- Connection handling tests
- Disconnection/reconnection tests

---

### ⏳ Phase 4: Comprehensive Testing & Documentation (9-12 hours)

**Status:** Not Started | **Priority:** MEDIUM  
**Start After:** Phase 2 complete

#### Task 4.1: Frontend Unit Test Coverage (4-5 hours)
**What:** Expand unit test coverage for main app components to 60%+

**Current Coverage:** ~4 tests (low)  
**Target Coverage:** 60%+ of main app components

**Components to Test:**
- Product display components
- Cart components
- Checkout components
- Profile/address components
- Header/navigation components
- Product detail components
- Order components

**Tests to Add:** 25-30 new test cases
- Component rendering tests
- User interaction tests
- Props validation tests
- State management tests
- Hook integration tests

**Tools:** React Testing Library + Vitest (already configured)

---

#### Task 4.2: Admin Dashboard Component Tests (3-4 hours)
**What:** Add component tests for admin dashboard (50%+ coverage)

**Current Coverage:** Minimal (API tests exist)  
**Target Coverage:** 50%+ of admin components

**Components to Test:**
- Product CRUD components
- Inventory management components
- Order management components
- Category management components
- Dashboard/analytics components
- Alert/notification components

**Tests to Add:** 15-20 new test cases
- Component rendering tests
- Form submission tests
- CRUD operation tests
- Error handling tests
- Permission/auth tests

---

#### Task 4.3: Documentation (2-3 hours)
**What:** Create comprehensive documentation for maintainability

**Documents to Create:**
1. **API_DOCUMENTATION.md** (1 hour)
   - All endpoints documented
   - Request/response formats
   - Error handling
   - Authentication requirements

2. **DATABASE_SCHEMA.md** (1 hour)
   - Table structures
   - Relationships
   - RLS policies
   - Indexes

3. **SETUP_AND_TROUBLESHOOTING.md** (30 min)
   - Development setup
   - Common issues
   - Environment variables
   - Debugging tips

4. **ARCHITECTURE.md** (30 min)
   - System architecture
   - Data flow diagrams
   - Component hierarchy
   - State management strategy

---

### ⏸️ Phase 5: Deployment & Infrastructure (DEFERRED - 4-7 hours)

**Status:** Not Started | **Priority:** FINAL  
**Activate After:** Phase 4 complete

**Only activate when ready for production testing/deployment**

#### Task 5.1: Docker & Environment Setup (1-2 hours)
- Start Docker Supabase locally
- Configure test environment
- Install Playwright browsers
- Verify local setup

#### Task 5.2: E2E Test Execution (1-2 hours)
- Run all 40+ Playwright tests
- Generate test reports
- Verify all workflows

#### Task 5.3: CI/CD & Production Deployment (2-3 hours)
- Set up CI/CD pipeline
- Configure production environment
- Deploy to staging/production
- Verify production deployment

---

## 📈 Timeline & Milestones

```
Day 1 (Today):
├─ Phase 1 Remaining Start
└─ Checkpoint: Identify exact tasks and files

Day 2:
├─ Complete Phase 1.4 (Cart Validation) ✅
├─ Complete Phase 1.5 (Email Notifications) ✅
└─ Checkpoint: Cart and email fully working

Day 3:
├─ Phase 2.1 (Data Flow Testing) ✅
├─ Phase 2.2 (Cart Merge on Login) ✅
├─ Phase 2.3 (Real-Time Validation) ✅
└─ Checkpoint: Admin-Main app fully synced

Day 4:
├─ Phase 4.1 (Frontend Unit Tests) ✅
├─ Phase 4.2 (Admin Component Tests) ✅
├─ Phase 4.3 (Documentation) ✅
└─ Checkpoint: Tests and docs complete

Day 5 (Optional):
├─ Review all work
├─ Performance optimization
└─ Checkpoint: All development validated

Final Phase (When Ready):
├─ Phase 5.1 (Docker Setup)
├─ Phase 5.2 (E2E Test Execution)
├─ Phase 5.3 (Deployment)
└─ Checkpoint: Production ready
```

---

## 🎯 Success Criteria

### Phase 1 Success
- ✅ Cart validation prevents stock oversell
- ✅ Emails send on order create/status update
- ✅ Out-of-stock items handled gracefully
- ✅ 6-10 new tests passing

### Phase 2 Success
- ✅ Admin product create shows in main app <2 sec
- ✅ Inventory updates sync in real-time
- ✅ Order status updates visible to customers
- ✅ Cart merge works without data loss
- ✅ 18-20 new integration tests passing

### Phase 4 Success
- ✅ Frontend unit test coverage ≥60%
- ✅ Admin component test coverage ≥50%
- ✅ All documentation complete and accurate
- ✅ 40+ new unit tests passing

### Phase 5 Success (When activated)
- ✅ All 40+ E2E tests passing
- ✅ Docker environment running correctly
- ✅ CI/CD pipeline configured
- ✅ Production deployment successful

---

## 📋 Task Checklist

### Phase 1 (Current)
- [ ] Cart Validation - File changes identified
- [ ] Cart Validation - Implementation started
- [ ] Cart Validation - Tests written
- [ ] Cart Validation - Testing complete
- [ ] Email Notifications - File changes identified
- [ ] Email Notifications - Implementation started
- [ ] Email Notifications - Tests written
- [ ] Email Notifications - Testing complete
- [ ] Phase 1 validation checkpoint

### Phase 2 (Next)
- [ ] Data Flow Testing - Test suite created
- [ ] Data Flow Testing - All scenarios tested
- [ ] Cart Merge - Implementation complete
- [ ] Cart Merge - Tests passing
- [ ] Real-Time Validation - Subscriptions verified
- [ ] Phase 2 validation checkpoint

### Phase 4 (Then)
- [ ] Frontend unit tests - 60%+ coverage achieved
- [ ] Admin component tests - 50%+ coverage achieved
- [ ] API documentation - Complete
- [ ] Database documentation - Complete
- [ ] Setup guide - Complete
- [ ] Phase 4 validation checkpoint

### Phase 5 (Final)
- [ ] Docker environment - Running
- [ ] E2E tests - All 40+ passing
- [ ] CI/CD pipeline - Configured
- [ ] Production - Deployed and verified

---

## 🚀 Key Points

1. **Focus:** Development completeness first, deployment infrastructure last
2. **Scope:** Fix remaining core features before advanced testing
3. **Quality:** Every phase has tests and validation
4. **Flexibility:** Can skip Phase 4 items if time-constrained
5. **Timeline:** 3-4 days focused development for MVP completeness

---

## 📞 Notes

- All previous work (Phase 0, Task 1, Task 2, Task 4) is complete ✅
- Documentation already in place: PRODUCTION_READY_SUMMARY.md, FINAL_PROJECT_COMPLETION_SUMMARY.md, etc.
- Deployment infrastructure (Docker, CI/CD) will be handled in Phase 5 only
- Focus on feature completeness and integration quality over deployment setup

---

**Status:** Ready to begin Phase 1 Remaining  
**Next Action:** Start with Cart Validation & Stock Checks task
