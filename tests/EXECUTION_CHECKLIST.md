# ✅ Test Execution Checklist

**Date:** 2025-11-27  
**Status:** Ready for Execution  
**Total Tests:** 200+ tests

---

## 📋 PRE-EXECUTION CHECKLIST

### ☐ Step 1: Install Dependencies
```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
npm install --save-dev @faker-js/faker
npm install --save-dev @playwright/test
npm install --save-dev supertest @types/supertest
npm install --save-dev jsonwebtoken @types/jsonwebtoken
```

**Verify:** Run `npm list vitest` to confirm installation

---

### ☐ Step 2: Fix Mocked APIs (CRITICAL!)

Replace in **ALL** integration test files:

```typescript
// FIND THIS:
const app = {} as any; // TODO: Replace with actual import

// REPLACE WITH:
import { app } from '@server/index';
```

**Files to Update (8 files):**
- [ ] `tests/integration/auth/registration.test.ts`
- [ ] `tests/integration/auth/login.test.ts`
- [ ] `tests/integration/auth/emailVerification.test.ts`
- [ ] `tests/integration/auth/passwordReset.test.ts`
- [ ] `tests/integration/auth/logout.test.ts`
- [ ] `tests/integration/profile/profileManagement.test.ts`
- [ ] `tests/integration/address/addressManagement.test.ts`
- [ ] `tests/integration/rbac/authorization.test.ts` (if created)

---

### ☐ Step 3: Configure Test Environment

Create `.env.test` file:
```bash
# Database
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/fabric_speaks_test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_KEY=your_test_service_key

# Auth
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_REFRESH_SECRET=test_refresh_secret_key

# Email
EMAIL_SERVICE=test
EMAIL_FROM=test@fabricspeaks.com

# Redis
REDIS_URL=redis://localhost:6379/1

# App
NODE_ENV=test
PORT=5001
```

---

### ☐ Step 4: Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

### ☐ Step 5: Set Up Test Database

```bash
# Create test database
createdb fabric_speaks_test

# Run migrations
npm run migrate:test
```

---

## 🚀 EXECUTION CHECKLIST

### Phase 1: Unit Tests (No Backend Required)

#### ☐ Run Unit Tests
```bash
npm run test:unit
```

**Expected Output:**
```
✓ tests/unit/guest/guestSession.test.ts (7)
✓ tests/unit/guest/guestCart.test.ts (12)
✓ tests/unit/guest/guestWishlist.test.ts (18)
✓ tests/unit/validation/emailValidation.test.ts (11)
✓ tests/unit/validation/passwordValidation.test.ts (12)
✓ tests/unit/auth/tokenManagement.test.ts (12)
✓ tests/unit/auth/permissions.test.ts (16)
✓ tests/unit/utils/cartMerge.test.ts (6)

Test Files  8 passed (8)
     Tests  94 passed (94)
```

**Status:** [ ] PASS / [ ] FAIL

**If FAIL:** Check error messages and fix issues

---

### Phase 2: Integration Tests (Requires Backend)

#### ☐ Verify Backend Connection
```bash
# Make sure your server exports the app
# In server/index.ts:
export { app };
```

#### ☐ Run Integration Tests
```bash
npm run test:integration
```

**Expected Output:**
```
✓ tests/integration/auth/registration.test.ts (10)
✓ tests/integration/auth/login.test.ts (12)
✓ tests/integration/auth/emailVerification.test.ts (15)
✓ tests/integration/auth/passwordReset.test.ts (20)
✓ tests/integration/auth/logout.test.ts (12)
✓ tests/integration/profile/profileManagement.test.ts (31)
✓ tests/integration/address/addressManagement.test.ts (8)

Test Files  7 passed (7)
     Tests  108 passed (108)
```

**Status:** [ ] PASS / [ ] FAIL

**If FAIL:** 
- Check database connection
- Verify API endpoints exist
- Check authentication middleware

---

### Phase 3: E2E Tests (Requires Running App)

#### ☐ Start Development Server
```bash
# In one terminal
npm run dev
```

#### ☐ Run E2E Tests
```bash
# In another terminal
npm run test:e2e
```

**Expected Output:**
```
✓ tests/e2e/guest/guestJourney.spec.ts (4)

Test Files  1 passed (1)
     Tests  4 passed (4)
```

**Status:** [ ] PASS / [ ] FAIL

**If FAIL:**
- Verify app is running on correct port
- Check frontend routes exist
- Verify UI elements have correct selectors

---

### Phase 4: Coverage Report

#### ☐ Generate Coverage
```bash
npm run test:coverage
```

**Expected Metrics:**
- Lines: > 80%
- Functions: > 80%
- Branches: > 75%
- Statements: > 80%

**Status:** [ ] PASS / [ ] FAIL

---

## 📊 FINAL VERIFICATION

### Test Summary

| Category | Expected | Actual | Status |
|----------|----------|--------|--------|
| Unit Tests | 94 | ___ | [ ] |
| Integration Tests | 108 | ___ | [ ] |
| E2E Tests | 4 | ___ | [ ] |
| **TOTAL** | **206** | ___ | [ ] |

### Coverage Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Lines | 80% | ___% | [ ] |
| Functions | 80% | ___% | [ ] |
| Branches | 75% | ___% | [ ] |
| Statements | 80% | ___% | [ ] |

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot find module '@server/index'"
**Solution:**
```typescript
// Update import path to match your project structure
import { app } from '../../../server/index';
```

### Issue: "Database connection failed"
**Solution:**
- Check `.env.test` configuration
- Verify test database exists
- Run migrations on test database

### Issue: "localStorage is not defined"
**Solution:** This is expected in unit tests - they mock localStorage

### Issue: "Tests timeout"
**Solution:**
```typescript
// Increase timeout in vitest.config.ts
testTimeout: 30000, // 30 seconds
```

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process on port 5001
npx kill-port 5001
```

---

## ✅ SUCCESS CRITERIA

All tests pass when:
- [ ] All 94 unit tests pass
- [ ] All 108 integration tests pass
- [ ] All 4 E2E tests pass
- [ ] Code coverage > 80%
- [ ] No console errors
- [ ] All requirements covered

---

## 🎯 NEXT STEPS AFTER SUCCESS

1. [ ] Set up CI/CD pipeline
2. [ ] Add pre-commit hooks
3. [ ] Configure automated test runs
4. [ ] Add performance tests
5. [ ] Add security tests
6. [ ] Document test results

---

## 📝 NOTES

**Date Started:** ___________  
**Date Completed:** ___________  
**Issues Found:** ___________  
**Fixes Applied:** ___________  

**Additional Notes:**
_______________________________________
_______________________________________
_______________________________________

---

**Ready to Start?** Begin with Phase 1: Unit Tests!

```bash
npm run test:unit
```

**Good luck!** 🚀
