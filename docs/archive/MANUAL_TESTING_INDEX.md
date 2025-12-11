# Manual Testing - Complete Reference

**Date**: November 11, 2025  
**Goal**: Validate admin/user RBAC model in action with running dev server  
**Estimated Time**: 5-10 minutes

---

## 📚 Guide Selection

Choose based on your preference:

### 🏃 **Quick Manual Test (5 min)** 
**File**: `QUICK_MANUAL_TEST.md`
- Condensed steps
- Just the essential curl commands
- All 7 tests on one page
- **Best for**: Quick validation

### 📖 **Full Manual Testing Guide (15 min)**
**File**: `MANUAL_TESTING_GUIDE.md`
- Detailed step-by-step instructions
- What to expect at each step
- Troubleshooting section
- Database SQL commands included
- **Best for**: Learning and reference

### 🎨 **Visual Step-by-Step Guide (10 min)**
**File**: `MANUAL_TESTING_VISUAL.md`
- Visual terminal output examples
- ASCII diagrams
- Expected response samples
- Error handling shown
- **Best for**: Visual learners

---

## 🎯 Testing Workflow

```
START HERE
    ↓
┌─────────────────────────────────────┐
│ Phase 1: Setup (2 min)              │
│ • Start dev server (Terminal 1)     │
│ • Create test users (Terminal 2)    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Phase 2: Run Tests (3 min)          │
│ • 8 curl commands (Terminal 3)      │
│ • Validate responses                │
│ • Check status codes               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Phase 3: Review Results             │
│ • All tests passed? ✅              │
│ • RBAC working correctly?           │
│ • Ready for next phase?             │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Start (Copy-Paste Ready)

### Terminal 1: Start Dev Server
```powershell
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
npm run dev
```

### Terminal 2: Create Test Users
```powershell
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks
```

Paste this:
```sql
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');
SELECT user_id, username, role FROM profiles;
\q
```

### Terminal 3: Run Tests

**Test 1**: Admin Creates Product
```powershell
curl -X POST http://localhost:5173/api/admin/products -H "Content-Type: application/json" -H "Authorization: Bearer admin-token" -d '{"name":"Test Shirt","sku":"T-001","price":29.99,"stock_quantity":50}'
```
Expected: `201` with product

---

**Test 2**: User Lists Products (No Auth)
```powershell
curl http://localhost:5173/api/products
```
Expected: `200` with products array

---

**Test 3**: User Gets Product (No Auth)
```powershell
curl http://localhost:5173/api/products/1
```
Expected: `200` with product details

---

**Test 4**: User Adds to Cart
```powershell
curl -X POST http://localhost:5173/api/carts/items -H "Content-Type: application/json" -H "Authorization: Bearer user-token" -d '{"product_id":1,"quantity":2}'
```
Expected: `201` with cart item

---

**Test 5**: User Creates Address
```powershell
curl -X POST http://localhost:5173/api/addresses -H "Content-Type: application/json" -H "Authorization: Bearer user-token" -d '{"street":"123 Main St","city":"Springfield","state":"IL","postal_code":"62701"}'
```
Expected: `201` with address

---

**Test 6**: User Updates Own Address
```powershell
curl -X PUT http://localhost:5173/api/addresses/1 -H "Content-Type: application/json" -H "Authorization: Bearer user-token" -d '{"street":"456 Oak Ave","city":"Shelbyville"}'
```
Expected: `200` with updated address

---

**Test 7**: User Cannot Modify Other's Address

First add admin address:
```powershell
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks -c "INSERT INTO addresses (user_id, street, city, state, postal_code) VALUES ('admin-test-001', '789 Admin St', 'Capital City', 'DC', '20001');"
```

Then try to modify:
```powershell
curl -X PUT http://localhost:5173/api/addresses/2 -H "Content-Type: application/json" -H "Authorization: Bearer user-token" -d '{"street":"HACKED"}'
```
Expected: `403` - Cannot modify

---

**Test 8**: Non-Admin Cannot Access Admin Endpoints
```powershell
curl -X POST http://localhost:5173/api/admin/products -H "Content-Type: application/json" -H "Authorization: Bearer user-token" -d '{"name":"Hacked","sku":"H-001","price":1}'
```
Expected: `403` - Admin access required

---

## ✅ Validation Checklist

### Admin Write (Test 1)
- [x] Admin can create products
- [x] Returns 201 Created
- [x] Product ID assigned
- [x] Data persisted to database

### Public Read (Tests 2-3)
- [x] Products readable without auth
- [x] List all products (no filter)
- [x] Get single product by ID
- [x] Returns 200 OK

### User Operations (Tests 4-5)
- [x] Cart requires authentication
- [x] Address creation requires auth
- [x] Data scoped to authenticated user
- [x] Returns 201 Created

### User Updates (Test 6)
- [x] User can update own data
- [x] Ownership check passes
- [x] Update persisted to database
- [x] Returns 200 OK

### Ownership Enforcement (Test 7)
- [x] Attempting to modify other user's data blocked
- [x] Returns 403 Forbidden
- [x] Ownership check working correctly
- [x] Data isolation enforced

### Role Enforcement (Test 8)
- [x] Non-admin blocked from admin endpoints
- [x] Returns 403 Forbidden
- [x] Privilege escalation prevented
- [x] Role check working correctly

---

## 📊 Expected Results Summary

| Test # | Endpoint | Method | Auth | Expected | Validates |
|--------|----------|--------|------|----------|-----------|
| 1 | `/api/admin/products` | POST | Admin | 201 ✅ | Admin write works |
| 2 | `/api/products` | GET | None | 200 ✅ | Public read works |
| 3 | `/api/products/1` | GET | None | 200 ✅ | Single product public |
| 4 | `/api/carts/items` | POST | User | 201 ✅ | Cart auth works |
| 5 | `/api/addresses` | POST | User | 201 ✅ | Address creation works |
| 6 | `/api/addresses/1` | PUT | User | 200 ✅ | Own data update works |
| 7 | `/api/addresses/2` | PUT | User | 403 ❌ | Ownership enforced |
| 8 | `/api/admin/products` | POST | User | 403 ❌ | Role enforced |

---

## 🔧 Common Issues & Solutions

### Issue: Dev server won't start
```
error: EADDRINUSE :::5173
```
**Solution**: Port already in use
```powershell
# Find what's using port 5173
netstat -ano | findstr :5173

# Kill the process or wait for it to finish
```

---

### Issue: Database connection fails
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Docker not running
```powershell
# Check containers
docker ps

# Start if needed
docker-compose up -d

# Wait 10 seconds for startup
```

---

### Issue: Test users not in database
```
SELECT * FROM profiles;
-- returns empty
```
**Solution**: Re-run Terminal 2 setup
```sql
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');
INSERT INTO profiles (user_id, username, phone, role, email) 
VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');
```

---

### Issue: 401 Unauthorized on all requests
```json
{"code":"UNAUTHORIZED","message":"Unauthorized"}
```
**Solution**: Missing or wrong auth header
```powershell
# Correct format:
curl -H "Authorization: Bearer admin-token" ...

# Wrong formats:
curl -H "Authorization: admin-token" ...     # ❌ Missing Bearer
curl -H "Authorization: Bearer" ...          # ❌ Missing token
curl ...                                      # ❌ Missing header entirely
```

---

### Issue: 404 Not Found
```json
{"error":"Product not found"}
```
**Solution**: Resource doesn't exist
```powershell
# Check product ID exists in database
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks -c "SELECT id FROM products;"

# If empty, first create a product (Test 1)
```

---

### Issue: Getting 403 on update that should work

**This is correct!** ✅

Means ownership check is working. You're trying to modify data that belongs to another user.

**Solution**: Use correct address ID
```powershell
# Address 1 belongs to user-test-001 (use this for user-token)
# Address 2 belongs to admin-test-001 (user-token will get 403)

# Check database
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks -c \
  "SELECT id, user_id FROM addresses;"
```

---

## 🎓 Learning Resources

### Understanding RBAC in This App

**Admin Role**:
- Manages global data (products, categories)
- Can create/update/delete products
- Doesn't modify user data
- Endpoint pattern: `/api/admin/*`

**User Role**:
- Reads global data (products)
- Manages own data (addresses, cart, orders)
- Cannot access `/api/admin/*` endpoints
- Cannot modify other users' data

**Ownership Check Pattern**:
```
1. User makes request with auth token
2. Middleware extracts user_id from token
3. Handler queries user's data
4. If user_id doesn't match request data, return 403
5. Prevents: user-A modifying user-B's address
```

---

## 📋 Complete Workflow Reference

### Setup Phase
1. Start dev server (`npm run dev`) → Terminal 1 running
2. Open psql shell → Terminal 2
3. Create 2 test users (admin, regular)
4. Exit psql
5. Open curl terminal → Terminal 3

### Testing Phase
1. Admin creates product → Verify 201
2. User lists products → Verify 200, no auth needed
3. User gets product → Verify 200, no auth needed
4. User adds to cart → Verify 201, auth required
5. User creates address → Verify 201, auth required
6. User updates own address → Verify 200, success
7. User tries to modify other's address → Verify 403, blocked
8. User tries admin endpoint → Verify 403, blocked

### Results Phase
- Count passes vs failures
- All 8 should pass ✅
- If any fail, check troubleshooting section
- If all pass, RBAC is working correctly

---

## 🎯 Success Criteria

### Minimum (6/8 tests pass)
- Admin can create products
- Products are publicly readable
- Cart requires authentication
- Ownership prevents cross-user modification

### Good (7/8 tests pass)
- All above
- Addresses work correctly
- Users can modify own data

### Excellent (8/8 tests pass) ✅
- All above
- Role enforcement perfect
- No security holes
- Ready for next phase

---

## 🔄 Next Steps After Manual Testing

### If All Tests Pass ✅
1. **Document results** - Note what worked
2. **Practice Docker reset** (Task #9)
   - `docker-compose down` → containers removed
   - `docker-compose up -d` → containers recreated
   - Re-run manual tests
3. **Production deployment** (Task #10)
   - Backup production database
   - Link to real Supabase project
   - Deploy migrations and code

### If Some Tests Fail ❌
1. **Check troubleshooting** - Use section above
2. **Review RBAC middleware** - See `server/middleware/auth.ts`
3. **Check database schema** - See local Postgres via psql
4. **Run unit tests** - `npm run test` to verify framework

---

## 📞 Quick Reference

### Important Terminals
- **Terminal 1**: Dev server (keep running)
- **Terminal 2**: Database access (psql)
- **Terminal 3**: curl tests

### Key Endpoints
- Product create (admin): `POST /api/admin/products`
- Product list (public): `GET /api/products`
- Product detail (public): `GET /api/products/:id`
- Cart add (user): `POST /api/carts/items`
- Address create (user): `POST /api/addresses`
- Address update (user): `PUT /api/addresses/:id`

### Token Format
- Admin: `Authorization: Bearer admin-token`
- User: `Authorization: Bearer user-token`

### Database Users
- Admin: `user_id: admin-test-001`, `role: admin`
- User: `user_id: user-test-001`, `role: user`

---

## 📚 File Organization

```
FabricSpeaks/
├── QUICK_MANUAL_TEST.md          ← Start here (5 min)
├── MANUAL_TESTING_GUIDE.md       ← Full reference (15 min)
├── MANUAL_TESTING_VISUAL.md      ← Visual guide (10 min)
├── MANUAL_TESTING_INDEX.md       ← This file
├── FRESH_TEST_SUITE_VISUAL.md    ← Test suite overview
├── RBAC_TESTS_BUILD_SUMMARY.md   ← Test build summary
├── TEST_REBUILD_COMPLETE.md      ← Rebuild details
└── .env.local                     ← Config (required)
```

---

**Ready to test?** Start with `QUICK_MANUAL_TEST.md` or jump to `MANUAL_TESTING_VISUAL.md` for step-by-step walkthrough!

**Questions?** Check `MANUAL_TESTING_GUIDE.md` troubleshooting section.

**Done testing?** Mark Task #8 complete and move to Task #9 (Docker reset practice).
