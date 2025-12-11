# Quick Start Guide - Running Tests

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @faker-js/faker @types/node
```

### Step 2: Add Test Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 3: Run Tests
```bash
npm run test:unit
```

---

## 📁 What's Been Created

### ✅ Test Infrastructure
- `tests/helpers/testSetup.ts` - Global setup/teardown
- `tests/helpers/dbHelper.ts` - Database utilities
- `tests/helpers/authHelper.ts` - Auth utilities
- `tests/fixtures/users.ts` - Test data
- `vitest.config.ts` - Vitest configuration

### ✅ Unit Tests (42 test cases)
- `tests/unit/guest/guestSession.test.ts` (7 tests)
- `tests/unit/guest/guestCart.test.ts` (12 tests)
- `tests/unit/validation/emailValidation.test.ts` (11 tests)
- `tests/unit/validation/passwordValidation.test.ts` (12 tests)

---

## 🎯 Test Commands

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/guest/guestSession.test.ts

# Run tests matching pattern
npx vitest run tests/unit/guest
```

---

## 📊 Expected Output

When you run `npm run test:unit`, you should see:

```
✓ tests/unit/guest/guestSession.test.ts (7)
✓ tests/unit/guest/guestCart.test.ts (12)
✓ tests/unit/validation/emailValidation.test.ts (11)
✓ tests/unit/validation/passwordValidation.test.ts (12)

Test Files  4 passed (4)
     Tests  42 passed (42)
  Start at  XX:XX:XX
  Duration  XXXms
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module"
**Solution:** Make sure all dependencies are installed:
```bash
npm install
```

### Issue: "localStorage is not defined"
**Solution:** The tests mock localStorage. This is expected and handled in the test files.

### Issue: Tests timeout
**Solution:** Increase timeout in `vitest.config.ts`:
```typescript
testTimeout: 30000, // 30 seconds
```

---

## 📚 Next Steps

1. ✅ **Run the unit tests** to verify everything works
2. 📝 **Review test results** and fix any failures
3. 🔨 **Implement integration tests** (see `USER_MANAGEMENT_TEST_CASES.md`)
4. 🌐 **Implement E2E tests** with Playwright
5. ⚡ **Implement performance tests** with k6
6. 🔒 **Implement security tests**

---

## 📖 Documentation

- **Requirements:** `docs/USER_MANAGEMENT_REQUIREMENTS.md`
- **Test Cases:** `docs/USER_MANAGEMENT_TEST_CASES.md`
- **Implementation Guide:** `docs/USER_MANAGEMENT_TEST_IMPLEMENTATION_GUIDE.md`
- **Test Summary:** `tests/TEST_SUITE_SUMMARY.md`

---

## ✨ Features

- ✅ **42 Unit Tests** covering guest users, validation
- ✅ **Type-Safe** with TypeScript
- ✅ **Fast Execution** with Vitest
- ✅ **Watch Mode** for development
- ✅ **Coverage Reports** with v8
- ✅ **UI Mode** for debugging

---

**Ready to test!** Run `npm run test:unit` now! 🎉
