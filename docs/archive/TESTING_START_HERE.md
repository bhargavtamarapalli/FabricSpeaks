# How to Test Manually - Quick Answer

## 3 Ways to Test

### 🏃 **Option 1: 5-Minute Quick Test**
**File**: `QUICK_MANUAL_TEST.md`

```
1. npm run dev              (Terminal 1)
2. Create test users       (Terminal 2)
3. Run 8 curl commands     (Terminal 3)
```

**Best for**: Checking if it works

---

### 🎨 **Option 2: Visual Step-by-Step (10 min)**
**File**: `MANUAL_TESTING_VISUAL.md`

Shows:
- Exact terminal output at each step
- Expected responses
- ASCII diagrams
- Error handling

**Best for**: Learning how it works

---

### 📖 **Option 3: Full Reference (15 min)**
**File**: `MANUAL_TESTING_GUIDE.md`

Includes:
- Detailed setup instructions
- 7+ test scenarios
- Troubleshooting section
- Database SQL examples

**Best for**: Complete understanding

---

## 🚀 The Absolute Quickest Way (3 commands!)

### Terminal 1:
```powershell
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
npm run dev
```

### Terminal 2:
```powershell
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks
```
Then paste:
```sql
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');
\q
```

### Terminal 3:
```powershell
# Admin creates product
curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer admin-token" `
  -d '{"name":"Shirt","sku":"T-001","price":29.99,"stock_quantity":50}'

# User lists products (no auth!)
curl http://localhost:5173/api/products

# User updates own address
curl -X POST http://localhost:5173/api/addresses `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"123 Main","city":"Springfield","state":"IL","postal_code":"62701"}'
```

✅ **If all return 200/201**: RBAC is working!

---

## ✅ What Gets Validated

- Admin can create products ✅
- Users can read products without auth ✅
- Users can create own addresses with auth ✅
- Users CANNOT modify other users' data ✅
- Non-admin users CANNOT access admin endpoints ✅

---

## 📁 Available Guides

| Guide | Time | Focus |
|-------|------|-------|
| `QUICK_MANUAL_TEST.md` | 5 min | Essential only |
| `MANUAL_TESTING_VISUAL.md` | 10 min | Visual learning |
| `MANUAL_TESTING_GUIDE.md` | 15 min | Complete reference |
| `MANUAL_TESTING_INDEX.md` | Reference | Full walkthrough |

---

**Pick one guide above and follow it!**

All tests should pass ✅ - means your RBAC is working perfectly.
