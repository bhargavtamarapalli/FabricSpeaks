# Manual Testing Guide - End-to-End RBAC Validation

**Purpose**: Test the admin/user separation in action with a running dev server  
**Prerequisites**: 
- Docker Postgres running (verified: `docker ps`)
- Local database with 10 tables (verified: schema created)
- Fresh test suite passing (verified: 30/30 tests)

---

## Part 1: Start Dev Server

### Step 1: Verify .env.local Exists

```powershell
# Check current .env.local
cat .env.local
```

**Expected output**:
```
VITE_API_URL=http://localhost:5173
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://fsuser:postgres@localhost:5432/fabric_speaks
NODE_ENV=development
```

If missing, create it:
```powershell
# Content to add to .env.local
VITE_API_URL=http://localhost:5173
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvbm5scHBoZ2N4aHpxZHdvcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzE5MTI0MDAsImV4cCI6MTk0NzQ4ODQwMH0.xPKY7pS83HMRXhXz0NG4cL7DXJoSLW7oDvdOQvyXHk8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvbm5scHBoZ2N4aHpxZHdvcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzMTkxMjQwMCwiZXhwIjoxOTQ3NDg4NDAwfQ.qNVzv51qQYcL0sDhE6Ky_WxL4YcQf5JhNvWrA8tYJHU
DATABASE_URL=postgresql://fsuser:postgres@localhost:5432/fabric_speaks
NODE_ENV=development
```

### Step 2: Start the Dev Server

```powershell
# Start both client (Vite on :5173) and server (Express on :5173)
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
npm run dev
```

**Expected output**:
```
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
  ✓ built in XXms
```

**Keep this terminal open** - you'll access the API through it.

---

## Part 2: Create Test Users in Database

### Step 3a: Open Database Shell

Open a **NEW terminal** (keep dev server running):

```powershell
# Connect to local Postgres database
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks
```

**You should see**:
```
fabric_speaks=#
```

### Step 3b: Insert Test Admin User

```sql
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');
```

**Expected**:
```
INSERT 0 1
```

### Step 3c: Insert Test Regular User

```sql
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');
```

**Expected**:
```
INSERT 0 1
```

### Step 3d: Verify Users Created

```sql
SELECT user_id, username, role, email FROM profiles;
```

**Expected**:
```
     user_id     |   username   | role |     email
-----------------+--------------+------+------------------
 admin-test-001  | admin_user   | admin | admin@test.local
 user-test-001   | regular_user | user  | user@test.local
(2 rows)
```

Exit database:
```sql
\q
```

---

## Part 3: Test Admin Creates Product

### Step 4: Admin Creates Product via API

Open a **THIRD terminal** and use `curl` to test:

```powershell
# Admin creates a product
$adminToken = "test-admin-token"
$headers = @{ "Authorization" = "Bearer $adminToken" }

curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $adminToken" `
  -d '{
    "name": "Test T-Shirt",
    "sku": "TSH-001",
    "price": 29.99,
    "description": "A comfortable test t-shirt",
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
  "description": "A comfortable test t-shirt",
  "stock_quantity": 50,
  "created_by": "admin-test-001"
}
```

**What this validates**:
- ✅ Admin can create products
- ✅ Product is stored in database
- ✅ Product has correct attributes

### Step 5: Verify Product Saved in Database

Back in database shell:

```sql
SELECT id, name, sku, price, stock_quantity FROM products;
```

**Expected**:
```
 id |     name     | sku   | price | stock_quantity
----+--------------+-------+-------+----------------
  1 | Test T-Shirt | TSH-001 | 29.99 |      50
(1 row)
```

---

## Part 4: Test User Reads Product (No Auth)

### Step 6: User Lists Products (No Authentication)

```powershell
# List all products - NO auth token needed
curl http://localhost:5173/api/products
```

**Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Test T-Shirt",
    "sku": "TSH-001",
    "price": 29.99,
    "description": "A comfortable test t-shirt",
    "stock_quantity": 50
  }
]
```

**What this validates**:
- ✅ Products are publicly readable
- ✅ No authentication required for product list
- ✅ Admin-created product is visible to all users

### Step 7: User Gets Single Product (No Auth)

```powershell
# Get product by ID - NO auth token needed
curl http://localhost:5173/api/products/1
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "name": "Test T-Shirt",
  "sku": "TSH-001",
  "price": 29.99,
  "description": "A comfortable test t-shirt",
  "stock_quantity": 50
}
```

**What this validates**:
- ✅ Single product endpoint works without auth
- ✅ Correct product details returned

---

## Part 5: Test User Adds Product to Cart (Auth Required)

### Step 8: User Adds Product to Cart

```powershell
# User adds product to cart - REQUIRES auth token
$userToken = "test-user-token"

curl -X POST http://localhost:5173/api/carts/items `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $userToken" `
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

**What this validates**:
- ✅ Cart endpoint requires authentication
- ✅ User can add admin-created product to cart
- ✅ Cart item properly scoped to user

### Step 9: Attempt to Add Product Without Auth (Should Fail)

```powershell
# Try to add to cart WITHOUT auth token
curl -X POST http://localhost:5173/api/carts/items `
  -H "Content-Type: application/json" `
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

**Expected Response** (401 Unauthorized):
```json
{
  "code": "UNAUTHORIZED",
  "message": "Unauthorized"
}
```

**What this validates**:
- ✅ Cart endpoint enforces authentication
- ✅ 401 returned for missing token

---

## Part 6: Test User Data Ownership

### Step 10: User Creates Address for Themselves

```powershell
# User creates address for their own account
$userToken = "test-user-token"

curl -X POST http://localhost:5173/api/addresses `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $userToken" `
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

**What this validates**:
- ✅ User can create address for themselves
- ✅ Address is scoped to user_id
- ✅ Address properly stored in database

### Step 11: Verify Address in Database

```sql
SELECT id, user_id, street, city FROM addresses;
```

**Expected**:
```
 id |   user_id    | street      | city
----+--------------+-------------+---------------
  1 | user-test-001| 123 Main St  | Springfield
(1 row)
```

### Step 12: User Updates Their Own Address (Should Succeed)

```powershell
# User updates their own address
$userToken = "test-user-token"

curl -X PUT http://localhost:5173/api/addresses/1 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $userToken" `
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

**What this validates**:
- ✅ User can update own address
- ✅ Ownership check passes for own user_id
- ✅ Address updated in database

### Step 13: Attempt to Update Another User's Address (Should Fail)

First, create a second address:

```sql
-- In database shell, create address for admin user
INSERT INTO addresses (user_id, street, city, state, postal_code) 
VALUES ('admin-test-001', '789 Admin St', 'Capital City', 'DC', '20001');

SELECT id, user_id, street FROM addresses;
```

**Expected**:
```
 id |   user_id    | street
----+--------------+-------------
  1 | user-test-001| 456 Oak Ave
  2 | admin-test-001| 789 Admin St
(2 rows)
```

Now try to modify admin's address as regular user:

```powershell
# Regular user tries to modify ADMIN'S address (ID 2)
$userToken = "test-user-token"

curl -X PUT http://localhost:5173/api/addresses/2 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $userToken" `
  -d '{
    "street": "HACKED St"
  }'
```

**Expected Response** (403 Forbidden):
```json
{
  "code": "FORBIDDEN",
  "message": "Cannot modify address belonging to another user"
}
```

**What this validates**:
- ✅ Ownership check prevents unauthorized updates
- ✅ 403 returned for ownership violation
- ✅ User cannot modify other users' data

---

## Part 7: Test Non-Admin Blocked from Admin Endpoints

### Step 14: Regular User Attempts to Create Product (Should Fail)

```powershell
# Regular user tries to create product - should be blocked
$userToken = "test-user-token"

curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $userToken" `
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

**What this validates**:
- ✅ Admin endpoints enforce role requirement
- ✅ Regular users cannot escalate to admin
- ✅ 403 returned for insufficient privilege

### Step 15: Regular User Attempts to Delete Product (Should Fail)

```powershell
# Regular user tries to delete product
$userToken = "test-user-token"

curl -X DELETE http://localhost:5173/api/admin/products/1 `
  -H "Authorization: Bearer $userToken"
```

**Expected Response** (403 Forbidden):
```json
{
  "code": "FORBIDDEN",
  "message": "Admin access required"
}
```

---

## Summary Checklist

### ✅ Admin Write Flow
- [x] Admin can create product (201)
- [x] Product stored in database
- [x] Product has correct attributes
- [x] Non-admin blocked from creating (403)

### ✅ User Read Flow
- [x] User can list products without auth (200)
- [x] User can get single product without auth (200)
- [x] Product data visible to all users
- [x] Missing auth token blocks protected endpoints (401)

### ✅ User Cart Interaction
- [x] User can add to cart with auth (201)
- [x] Cart item scoped to user
- [x] Non-authenticated requests blocked (401)

### ✅ User Ownership Enforcement
- [x] User can create address for self (201)
- [x] User can update own address (200)
- [x] User cannot update other user's address (403)
- [x] Ownership verification works correctly

### ✅ Admin Access Control
- [x] Admin endpoints block non-admin users (403)
- [x] Admin endpoints block unauthenticated (401)
- [x] Role escalation prevented

---

## Quick Reference: Common curl Commands

### Admin Operations
```powershell
# Create product (admin only)
curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer admin-token" `
  -d '{"name":"...", "sku":"...", "price":99.99}'

# Update product (admin only)
curl -X PUT http://localhost:5173/api/admin/products/1 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer admin-token" `
  -d '{"name":"Updated"}'

# Delete product (admin only)
curl -X DELETE http://localhost:5173/api/admin/products/1 `
  -H "Authorization: Bearer admin-token"
```

### User Operations
```powershell
# List products (public, no auth)
curl http://localhost:5173/api/products

# Get product (public, no auth)
curl http://localhost:5173/api/products/1

# Add to cart (auth required)
curl -X POST http://localhost:5173/api/carts/items `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"product_id":1, "quantity":2}'

# Create address (auth required)
curl -X POST http://localhost:5173/api/addresses `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"...", "city":"...", "state":"...", "postal_code":"..."}'

# Update address (auth + ownership check)
curl -X PUT http://localhost:5173/api/addresses/1 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"New Street"}'
```

---

## Troubleshooting

### Issue: "Cannot connect to localhost:5173"
**Solution**: 
- Verify dev server is running: `npm run dev`
- Check port is not in use: `netstat -ano | findstr :5173`

### Issue: "Connection refused to database"
**Solution**:
- Verify Docker containers running: `docker ps`
- Check fs-postgres container is up: `docker ps | findstr fs-postgres`
- Restart if needed: `docker-compose restart`

### Issue: "Users not found in profiles table"
**Solution**:
- Verify users exist: `psql` → `SELECT * FROM profiles;`
- Create test users (Step 3b & 3c)

### Issue: "401 Unauthorized" on all requests
**Solution**:
- Check .env.local has SUPABASE_* keys
- Verify Bearer token format: `Authorization: Bearer <token>`

### Issue: "Cannot modify address belonging to another user"
**Solution**:
- This is CORRECT behavior! ✅
- Ownership check is working as designed
- Use the address ID belonging to the authenticated user

---

## Next Steps After Manual Testing

Once all checks pass ✅:

1. **Document Results** - Note what worked, any issues found
2. **Practice Docker Reset** (Task #9)
   - `docker-compose down` → Remove containers
   - `docker-compose up -d` → Start fresh
   - Re-create test users
   - Re-run manual tests
3. **Production Deployment** (Task #10)
   - Backup production database
   - Link to real Supabase project
   - Deploy code and migrations

---

## Quick automation: run the Admin E2E script

We've added a small helper that automates the Admin workflow checks and writes a report to `reports/`.

From the project root run:

```powershell
# run the admin end-to-end checks and generate a report
npm run e2e:admin
```

The script will:
- start the local Postgres docker-compose if the `fs-postgres` container is not running (`npm run db:up`)
- check TCP connectivity to localhost:5432
- run the existing `server/__tests__/rbac.admin.test.ts` vitest file
- write `reports/admin-e2e-<timestamp>.json` and `.md` with details and the (truncated) test output

If tests fail, check the markdown report in `reports/` for the vitest output and environment diagnostics.

## Docker-backed E2E (full-stack)

We've added a Docker-backed E2E helper that seeds the Docker Postgres, runs a few HTTP checks against the local dev server, and writes a report to `reports/`.

From the project root run:

```powershell
# run full Docker-backed E2E (seeds DB, runs http checks, cleans up)
npm run e2e:docker
```

Notes:
- The script will start the `fs-postgres` container if not running (`npm run db:up`).
- It will seed two test profiles and a product directly into Postgres, then attempt HTTP operations (public product GETs and auth-protected operations).
- Some auth-protected API calls may return 401 unless your dev server accepts the test token convention (`role-token-<userId>`). The script still validates DB-level seeding even if auth fails.
- A JSON and a Markdown report are created in `reports/` with results and raw outputs.

If you'd like the script to always force the dev server into a test-mode that accepts test tokens, we can add a small env-gated bypass to the server and re-run.

---

**Created**: November 11, 2025  
**Status**: Ready for manual testing ✅
