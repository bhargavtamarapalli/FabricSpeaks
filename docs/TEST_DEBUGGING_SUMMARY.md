# Test Debugging Summary - Signature Collection Tests

## Issue Identified

The tests are failing because of a **UUID format mismatch** between SQLite and PostgreSQL:

### Root Cause
1. **PostgreSQL** uses UUID format: `550e8400-e29b-41d4-a716-446655440000`
2. **SQLite** generates integer IDs: `1`, `2`, `3`, etc.
3. The backend handlers validate IDs as UUIDs using Zod schemas
4. When tests pass SQLite integer IDs, validation fails with `invalid_string` error

### Test Results
- ✅ **2 tests passing**: Tests that don't require ID validation (list operations)
- ❌ **5 tests failing**: Tests that pass IDs in request body or params

### Failing Tests
1. `should create a variant` - Expected 201, got 400 (UUID validation failed)
2. `should update a variant` - Expected 200, got 400 (UUID validation failed)
3. `should bulk update variants` - Expected 200, got 400 (UUID validation failed)
4. Others with similar UUID validation issues

### Error Message
```json
{
  "code": "INVALID_PAYLOAD",
  "message": "[{\"validation\":\"uuid\",\"code\":\"invalid_string\",\"message\":\"Invalid uuid\"}]"
}
```

## Solutions

### Option 1: Use UUID Library in SQLite (RECOMMENDED)
Modify `test-setup.ts` to generate proper UUIDs for SQLite:

```typescript
import { randomUUID } from 'crypto';

// When inserting test data:
const id = randomUUID();
sqlite.prepare(`
  INSERT INTO products (id, name, slug, sku, price, is_signature)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(id, 'Signature Coat', 'signature-coat', 'SIG-001', '1000.00', 1);
```

### Option 2: Mock UUID Validation
Temporarily disable UUID validation in tests:

```typescript
vi.mock('zod', async () => {
  const actual = await vi.importActual('zod');
  return {
    ...actual,
    z: {
      ...actual.z,
      string: () => ({
        uuid: () => actual.z.string(),
      }),
    },
  };
});
```

### Option 3: Use In-Memory PostgreSQL
Use `pg-mem` library for true PostgreSQL compatibility in tests.

## Recommended Fix

I'll implement **Option 1** as it's the cleanest and most realistic approach.

## Additional Findings

### Schema Verification
The SQLite schema is correctly created with all necessary tables:
- ✅ products
- ✅ product_variants  
- ✅ inventory_logs
- ✅ profiles
- ✅ categories
- ✅ carts
- ✅ cart_items
- ✅ orders
- ✅ order_items

### Handler Verification
All handlers are correctly imported and registered:
- ✅ listSignatureProductsHandler
- ✅ adjustInventoryHandler
- ✅ listVariantsHandler
- ✅ createVariantHandler
- ✅ updateVariantHandler
- ✅ deleteVariantHandler
- ✅ bulkUpdateVariantsHandler

## Next Steps

1. ✅ Identified root cause (UUID format mismatch)
2. ⏳ Implement UUID generation in test setup
3. ⏳ Re-run tests to verify fix
4. ⏳ Add more comprehensive test coverage
5. ⏳ Document testing patterns for future tests

## Lessons Learned

1. **Schema Compatibility**: When using SQLite for PostgreSQL tests, ensure data types match
2. **ID Generation**: Always use proper UUID format when testing UUID-validated endpoints
3. **Debug Logging**: Console logs were crucial in identifying the validation errors
4. **Test Isolation**: Each test should be independent and properly clean up after itself

This debugging session demonstrates the importance of matching test environment data types with production expectations.
