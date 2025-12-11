# Quick Manual Testing (5 Minutes)

## Setup (2 min)

### Terminal 1: Start Dev Server
```powershell
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
npm run dev
```
Wait for: `✓ built in XXms`

### Terminal 2: Create Test Users in DB
```powershell
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks
```

Then paste:
```sql
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('admin-test-001', 'admin_user', '+1234567890', 'admin', 'admin@test.local');
INSERT INTO profiles (user_id, username, phone, role, email) VALUES ('user-test-001', 'regular_user', '+0987654321', 'user', 'user@test.local');
\q
```

---

## Tests (3 min)

### Terminal 3: Run 5 Tests

**Test 1: Admin Creates Product**
```powershell
curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer admin-token" `
  -d '{"name":"Test Shirt","sku":"T-001","price":29.99,"stock_quantity":50}'
```
✅ Expected: `201` with product ID

---

**Test 2: User Lists Products (No Auth)**
```powershell
curl http://localhost:5173/api/products
```
✅ Expected: `200` with product list

---

**Test 3: User Gets Product (No Auth)**
```powershell
curl http://localhost:5173/api/products/1
```
✅ Expected: `200` with product details

---

**Test 4: User Creates Address (Auth Required)**
```powershell
curl -X POST http://localhost:5173/api/addresses `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"123 Main St","city":"Springfield","state":"IL","postal_code":"62701"}'
```
✅ Expected: `201` with address

---

**Test 5: User Updates Own Address (Should Succeed)**
```powershell
curl -X PUT http://localhost:5173/api/addresses/1 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"456 Oak Ave","city":"Shelbyville"}'
```
✅ Expected: `200` with updated address

---

**BONUS Test 6: User Tries to Modify Another's Address (Should Fail)**
```powershell
# First add admin address in database
docker exec -it fs-postgres psql -U fsuser -d fabric_speaks -c "INSERT INTO addresses (user_id, street, city, state, postal_code) VALUES ('admin-test-001', '789 Admin St', 'Capital City', 'DC', '20001');"

# Then try to modify as regular user
curl -X PUT http://localhost:5173/api/addresses/2 `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"street":"HACKED"}'
```
❌ Expected: `403` - Cannot modify another user's address

---

**BONUS Test 7: Regular User Tries Admin Endpoint (Should Fail)**
```powershell
curl -X POST http://localhost:5173/api/admin/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer user-token" `
  -d '{"name":"Hacked","sku":"H-001","price":1}'
```
❌ Expected: `403` - Admin access required

---

## What Gets Validated

| Test | Validates | Expected |
|------|-----------|----------|
| 1 | Admin can create products | 201 ✅ |
| 2 | Products are public (no auth) | 200 ✅ |
| 3 | Product details public | 200 ✅ |
| 4 | User can create own address | 201 ✅ |
| 5 | User can update own address | 200 ✅ |
| 6 | Cannot modify other user's data | 403 ✅ |
| 7 | Non-admin cannot use admin endpoints | 403 ✅ |

✅ **If all pass**: RBAC is working correctly!

---

## Typical curl Response Format

**Success (2xx)**:
```json
{
  "id": 1,
  "name": "Test Shirt",
  "sku": "T-001",
  "price": 29.99
}
```

**Error (4xx)**:
```json
{
  "code": "FORBIDDEN",
  "message": "Admin access required"
}
```

---

**Full guide**: See `MANUAL_TESTING_GUIDE.md`  
**Detailed troubleshooting**: See `MANUAL_TESTING_GUIDE.md`
