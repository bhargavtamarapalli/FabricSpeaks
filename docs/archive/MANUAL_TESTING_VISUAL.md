# Manual Testing - Step-by-Step Visual Guide

## Overview

```
┌─────────────────────────────────────────────────────────┐
│  Manual End-to-End Testing Flow                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Start Dev Server (Terminal 1)                       │
│  2. Create Test Users in DB (Terminal 2)                │
│  3. Run Curl Tests (Terminal 3)                         │
│                                                          │
│  Expected: All endpoints behave as designed             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🟢 Phase 1: Setup (2 minutes)

### Step 1a: Start Dev Server

```
TERMINAL 1
─────────────────────────────────────────────
$ cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
$ npm run dev

  ✓ built in 2.34s
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help

[keep this running]
```

**What's happening**:
- Vite dev server starts on port 5173
- Express API available at http://localhost:5173/api/*
- Hot reload enabled for changes

---

### Step 1b: Create Test Users (Keep Terminal 1 Running)

```
TERMINAL 2
─────────────────────────────────────────────
$ docker exec -it fs-postgres psql -U fsuser -d fabric_speaks

fabric_speaks=# 
```

**Copy-paste this block**:
```sql
-- Create admin user
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');

-- Create regular user
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');

-- Verify
SELECT user_id, username, role FROM profiles;
```

**Expected output**:
```
INSERT 0 1
INSERT 0 1

     user_id     |   username   | role
─────────────────┼──────────────┼──────
 admin-test-001  | admin_user   | admin
 user-test-001   | regular_user | user
(2 rows)

fabric_speaks=# \q
```

**What's happening**:
- ✅ Admin account created
- ✅ Regular user account created
- ✅ Ready for API testing

---

## 🔵 Phase 2: Testing (3 minutes)

Now open **TERMINAL 3** for curl tests (keep 1 & 2 running)

---

### Test 1: Admin Creates Product ✅

**What we're testing**: Admin can write to global data

```
TERMINAL 3
─────────────────────────────────────────────

$ curl -X POST http://localhost:5173/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "name": "Test T-Shirt",
    "sku": "TSH-001",
    "price": 29.99,
    "stock_quantity": 50
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "name": "Test T-Shirt",
  "sku": "TSH-001",
  "price": 29.99,
  "stock_quantity": 50,
  "created_by": "admin-test-001"
}
```

**Validation**:
```
✅ Status Code: 201 (Created)
✅ Product ID returned (1)
✅ Product data saved
✅ created_by shows admin ID
```

---

### Test 2: User Lists Products (No Auth) ✅

**What we're testing**: Products are publicly readable

```
$ curl http://localhost:5173/api/products
```

**Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Test T-Shirt",
    "sku": "TSH-001",
    "price": 29.99,
    "stock_quantity": 50
  }
]
```

**Validation**:
```
✅ Status Code: 200 (OK)
✅ No auth token required
✅ Admin-created product visible
✅ Product array returned
```

---

### Test 3: User Gets Single Product (No Auth) ✅

**What we're testing**: Specific products are publicly accessible

```
$ curl http://localhost:5173/api/products/1
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "name": "Test T-Shirt",
  "sku": "TSH-001",
  "price": 29.99,
  "stock_quantity": 50
}
```

**Validation**:
```
✅ Status Code: 200 (OK)
✅ Single product retrieved
✅ Correct product ID (1)
✅ All fields present
```

---

### Test 4: User Adds Product to Cart (Auth Required) ✅

**What we're testing**: Cart operations require authentication

```
$ curl -X POST http://localhost:5173/api/carts/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "cart_id": 1,
  "product_id": 1,
  "quantity": 2,
  "user_id": "user-test-001"
}
```

**Validation**:
```
✅ Status Code: 201 (Created)
✅ Auth token required (Bearer required)
✅ Cart item scoped to user_id
✅ Quantity correct (2)
```

---

### Test 5: User Creates Address ✅

**What we're testing**: User can create own addresses

```
$ curl -X POST http://localhost:5173/api/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "postal_code": "62701"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "user_id": "user-test-001",
  "street": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "postal_code": "62701"
}
```

**Validation**:
```
✅ Status Code: 201 (Created)
✅ Auth token required
✅ Address scoped to user_id
✅ Address ID returned
```

---

### Test 6: User Updates Own Address ✅

**What we're testing**: User can modify their own data

```
$ curl -X PUT http://localhost:5173/api/addresses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{
    "street": "456 Oak Ave",
    "city": "Shelbyville"
  }'
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "user-test-001",
  "street": "456 Oak Ave",
  "city": "Shelbyville",
  "state": "IL",
  "postal_code": "62701"
}
```

**Validation**:
```
✅ Status Code: 200 (OK)
✅ Ownership check passed (user owns address 1)
✅ Address updated in database
✅ Updated fields reflected
```

---

### Test 7: User Tries to Modify Another User's Address ❌

**What we're testing**: Ownership enforcement (prevents cross-user modification)

**First**, add address for admin:
```
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks -c \
  "INSERT INTO addresses (user_id, street, city, state, postal_code) \
   VALUES ('admin-test-001', '789 Admin St', 'Capital City', 'DC', '20001');"
```

**Then** try to modify as regular user:
```
$ curl -X PUT http://localhost:5173/api/addresses/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{"street": "HACKED St"}'
```

**Expected Response** (403 Forbidden):
```json
{
  "code": "FORBIDDEN",
  "message": "Cannot modify address belonging to another user"
}
```

**Validation**:
```
✅ Status Code: 403 (Forbidden)
✅ Ownership check worked
✅ User cannot modify admin's address
✅ Cross-user modification prevented
```

---

### Test 8: Non-Admin Tries Admin Endpoint ❌

**What we're testing**: Role-based access control (prevents privilege escalation)

```
$ curl -X POST http://localhost:5173/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-token" \
  -d '{
    "name": "Hacked Product",
    "sku": "HACK-001",
    "price": 99.99
  }'
```

**Expected Response** (403 Forbidden):
```json
{
  "code": "FORBIDDEN",
  "message": "Admin access required"
}
```

**Validation**:
```
✅ Status Code: 403 (Forbidden)
✅ Role check enforced
✅ Regular user blocked from admin endpoint
✅ Privilege escalation prevented
```

---

## 🟢 Phase 3: Results

### Success Summary

```
┌─────────────────────────────────────────────────────────┐
│                    TEST RESULTS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Test 1: Admin creates product       → 201 Created   │
│  ✅ Test 2: User lists products (no auth) → 200 OK      │
│  ✅ Test 3: User gets product (no auth) → 200 OK        │
│  ✅ Test 4: User adds to cart (auth)    → 201 Created   │
│  ✅ Test 5: User creates address        → 201 Created   │
│  ✅ Test 6: User updates own address    → 200 OK        │
│  ❌ Test 7: Cannot modify other's address → 403         │
│  ❌ Test 8: Non-admin cannot create product → 403       │
│                                                          │
│  RBAC Model: WORKING CORRECTLY ✅                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Architecture Validated

```
┌──────────────────────────────────────────────────────────┐
│           RBAC Architecture Validated                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Admin Role:                                            │
│  ✅ Can create products (201)                           │
│  ✅ Cannot escalate privileges                          │
│                                                          │
│  User Role:                                             │
│  ✅ Can read global data (no auth needed)               │
│  ✅ Can create own addresses (auth required)            │
│  ✅ Can update own addresses (ownership enforced)       │
│  ❌ Cannot modify others' data (403)                    │
│  ❌ Cannot access admin endpoints (403)                 │
│                                                          │
│  Data Ownership:                                        │
│  ✅ Addresses scoped to user_id                         │
│  ✅ Cart items scoped to user                           │
│  ✅ Ownership checks prevent cross-user access          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔴 Troubleshooting

### Problem: Connection refused on port 5173

```
curl: (7) Failed to connect to localhost port 5173
```

**Solution**:
```powershell
# Check if dev server is running
netstat -ano | findstr :5173

# If not running, start it
npm run dev
```

---

### Problem: 401 Unauthorized on admin endpoint

```json
{"code":"UNAUTHORIZED","message":"Unauthorized"}
```

**Solution**:
- Add Authorization header with Bearer token
- Verify token format: `Authorization: Bearer <token>`
- Example: `curl -H "Authorization: Bearer admin-token" ...`

---

### Problem: Cannot find user_test_001 in database

```
fabric_speaks=# SELECT * FROM profiles;
```

**Solution**:
- Run Step 1b again to create test users
- Verify with: `SELECT user_id, username FROM profiles;`

---

### Problem: Address modification returns 403 (ownership enforced)

```json
{"code":"FORBIDDEN","message":"Cannot modify address belonging to another user"}
```

**This is correct!** ✅
- The ownership check is working
- You're trying to modify another user's address
- Use address ID 1 (belongs to user-test-001) instead

---

## 📋 Checklist: All Tests Passed?

```
Phase 1: Setup
  ☐ Dev server started (npm run dev running)
  ☐ Test users created in database
  ☐ Database connection verified

Phase 2: Tests
  ☐ Test 1: Admin creates product (201)
  ☐ Test 2: User lists products (200, no auth)
  ☐ Test 3: User gets product (200, no auth)
  ☐ Test 4: User adds to cart (201, auth required)
  ☐ Test 5: User creates address (201)
  ☐ Test 6: User updates own address (200)
  ☐ Test 7: Cannot modify other's address (403)
  ☐ Test 8: Non-admin cannot access admin endpoint (403)

Results
  ☐ All 8 tests passed ✅
  ☐ RBAC model validated
  ☐ Ownership checks working
  ☐ Ready for next phase
```

---

**Manual testing complete!** ✅

Next steps:
1. Docker reset practice (Task #9)
2. Production deployment (Task #10)
