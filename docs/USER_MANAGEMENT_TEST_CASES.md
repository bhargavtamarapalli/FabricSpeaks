# User Management System - Test Cases
**Project:** Fabric Speaks E-commerce Platform  
**Version:** 1.0  
**Date:** 2025-11-27  
**Based on:** USER_MANAGEMENT_REQUIREMENTS.md

---

## Table of Contents
1. [Unit Test Cases](#unit-test-cases)
2. [Integration Test Cases](#integration-test-cases)
3. [End-to-End Test Cases](#end-to-end-test-cases)
4. [Performance Test Cases](#performance-test-cases)
5. [Security Test Cases](#security-test-cases)

---

## 1. Unit Test Cases

### 1.1 Guest Session Management

#### TC-UNIT-GU-001: Generate Guest ID
**Requirement:** REQ-GU-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `generateGuestId()` function
2. Verify return value is a valid UUID v4
3. Call function again
4. Verify second UUID is different from first

**Expected Result:**
- Function returns valid UUID v4 format
- Each call generates unique ID

**Test Data:**
```typescript
// No input required
```

**Assertions:**
```typescript
expect(guestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
expect(guestId1).not.toBe(guestId2);
```

---

#### TC-UNIT-GU-002: Store Guest ID in localStorage
**Requirement:** REQ-GU-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Mock localStorage
2. Call `storeGuestId(guestId)`
3. Verify localStorage.setItem called with correct key and value
4. Call `getGuestId()`
5. Verify correct guest ID returned

**Expected Result:**
- Guest ID stored under key 'guest_id'
- Retrieval returns same ID

**Test Data:**
```typescript
const mockGuestId = '123e4567-e89b-12d3-a456-426614174000';
```

**Assertions:**
```typescript
expect(localStorage.setItem).toHaveBeenCalledWith('guest_id', mockGuestId);
expect(getGuestId()).toBe(mockGuestId);
```

---

#### TC-UNIT-GU-003: Add Item to Guest Cart
**Requirement:** REQ-GU-002  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Initialize empty guest cart
2. Call `addToGuestCart(item)`
3. Verify item added to cart
4. Verify cart total updated
5. Add same item again
6. Verify quantity increased

**Expected Result:**
- Item added successfully
- Quantity increments for duplicate items
- Cart total calculated correctly

**Test Data:**
```typescript
const item = {
  product_id: 'prod-001',
  variant_id: 'var-001',
  quantity: 2,
  price: 1000
};
```

**Assertions:**
```typescript
expect(cart.items).toHaveLength(1);
expect(cart.items[0].quantity).toBe(2);
expect(cart.total).toBe(2000);
// Add again
expect(cart.items[0].quantity).toBe(4);
expect(cart.total).toBe(4000);
```

---

#### TC-UNIT-GU-004: Remove Item from Guest Cart
**Requirement:** REQ-GU-002  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Initialize cart with items
2. Call `removeFromGuestCart(itemId)`
3. Verify item removed
4. Verify cart total updated

**Expected Result:**
- Item removed successfully
- Cart total recalculated

**Test Data:**
```typescript
const cart = {
  items: [
    { id: 'item-001', product_id: 'prod-001', quantity: 2, price: 1000 },
    { id: 'item-002', product_id: 'prod-002', quantity: 1, price: 500 }
  ]
};
```

**Assertions:**
```typescript
removeFromGuestCart('item-001');
expect(cart.items).toHaveLength(1);
expect(cart.items[0].id).toBe('item-002');
expect(cart.total).toBe(500);
```

---

#### TC-UNIT-GU-005: Calculate Guest Cart Total
**Requirement:** REQ-GU-002  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Create cart with multiple items
2. Call `calculateCartTotal(cart)`
3. Verify total is sum of (quantity × price) for all items

**Expected Result:**
- Total calculated correctly

**Test Data:**
```typescript
const cart = {
  items: [
    { quantity: 2, price: 1000 },
    { quantity: 3, price: 500 },
    { quantity: 1, price: 2000 }
  ]
};
// Expected: (2*1000) + (3*500) + (1*2000) = 5500
```

**Assertions:**
```typescript
expect(calculateCartTotal(cart)).toBe(5500);
```

---

#### TC-UNIT-GU-006: Guest Cart Maximum Items
**Requirement:** REQ-GU-002  
**Priority:** MEDIUM  
**Test Type:** Unit

**Test Steps:**
1. Add 50 items to guest cart
2. Attempt to add 51st item
3. Verify error thrown

**Expected Result:**
- Error: "Maximum 50 items allowed in guest cart"

**Test Data:**
```typescript
const items = Array(50).fill({ product_id: 'prod', quantity: 1 });
```

**Assertions:**
```typescript
expect(() => addToGuestCart(item51)).toThrow('Maximum 50 items allowed');
```

---

#### TC-UNIT-GU-007: Merge Guest Cart with User Cart
**Requirement:** REQ-GU-004  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Create guest cart with items
2. Create user cart with different items
3. Call `mergeGuestCart(guestCart, userCart)`
4. Verify all items present in result
5. Verify no duplicates

**Expected Result:**
- All unique items from both carts present
- Quantities summed for duplicate items

**Test Data:**
```typescript
const guestCart = {
  items: [
    { product_id: 'prod-001', variant_id: 'var-001', quantity: 2 },
    { product_id: 'prod-002', variant_id: 'var-002', quantity: 1 }
  ]
};
const userCart = {
  items: [
    { product_id: 'prod-001', variant_id: 'var-001', quantity: 3 },
    { product_id: 'prod-003', variant_id: 'var-003', quantity: 1 }
  ]
};
// Expected: prod-001 qty=5, prod-002 qty=1, prod-003 qty=1
```

**Assertions:**
```typescript
const merged = mergeGuestCart(guestCart, userCart);
expect(merged.items).toHaveLength(3);
expect(merged.items.find(i => i.product_id === 'prod-001').quantity).toBe(5);
```

---

### 1.2 Email Validation

#### TC-UNIT-VAL-001: Valid Email Format
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validateEmail(email)` with valid emails
2. Verify all return true

**Expected Result:**
- All valid emails pass validation

**Test Data:**
```typescript
const validEmails = [
  'user@example.com',
  'user.name@example.com',
  'user+tag@example.co.uk',
  'user123@sub.example.com'
];
```

**Assertions:**
```typescript
validEmails.forEach(email => {
  expect(validateEmail(email)).toBe(true);
});
```

---

#### TC-UNIT-VAL-002: Invalid Email Format
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validateEmail(email)` with invalid emails
2. Verify all return false

**Expected Result:**
- All invalid emails fail validation

**Test Data:**
```typescript
const invalidEmails = [
  'invalid',
  '@example.com',
  'user@',
  'user @example.com',
  'user@example',
  ''
];
```

**Assertions:**
```typescript
invalidEmails.forEach(email => {
  expect(validateEmail(email)).toBe(false);
});
```

---

### 1.3 Password Validation

#### TC-UNIT-VAL-003: Valid Password
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validatePassword(password)` with valid passwords
2. Verify all return true

**Expected Result:**
- All valid passwords pass validation

**Test Data:**
```typescript
const validPasswords = [
  'Password1',
  'MyP@ssw0rd',
  'Str0ngPass!',
  'Test1234'
];
```

**Assertions:**
```typescript
validPasswords.forEach(password => {
  expect(validatePassword(password)).toBe(true);
});
```

---

#### TC-UNIT-VAL-004: Invalid Password - Too Short
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validatePassword('Pass1')` (7 characters)
2. Verify returns false with error message

**Expected Result:**
- Validation fails
- Error: "Password must be at least 8 characters"

**Test Data:**
```typescript
const password = 'Pass1';
```

**Assertions:**
```typescript
const result = validatePassword(password);
expect(result.valid).toBe(false);
expect(result.error).toBe('Password must be at least 8 characters');
```

---

#### TC-UNIT-VAL-005: Invalid Password - No Uppercase
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validatePassword('password1')` (no uppercase)
2. Verify returns false with error message

**Expected Result:**
- Validation fails
- Error: "Password must contain at least 1 uppercase letter"

**Test Data:**
```typescript
const password = 'password1';
```

**Assertions:**
```typescript
const result = validatePassword(password);
expect(result.valid).toBe(false);
expect(result.error).toContain('uppercase');
```

---

#### TC-UNIT-VAL-006: Invalid Password - No Lowercase
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validatePassword('PASSWORD1')` (no lowercase)
2. Verify returns false with error message

**Expected Result:**
- Validation fails
- Error: "Password must contain at least 1 lowercase letter"

**Test Data:**
```typescript
const password = 'PASSWORD1';
```

**Assertions:**
```typescript
const result = validatePassword(password);
expect(result.valid).toBe(false);
expect(result.error).toContain('lowercase');
```

---

#### TC-UNIT-VAL-007: Invalid Password - No Number
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `validatePassword('Password')` (no number)
2. Verify returns false with error message

**Expected Result:**
- Validation fails
- Error: "Password must contain at least 1 number"

**Test Data:**
```typescript
const password = 'Password';
```

**Assertions:**
```typescript
const result = validatePassword(password);
expect(result.valid).toBe(false);
expect(result.error).toContain('number');
```

---

### 1.4 Token Management

#### TC-UNIT-TOKEN-001: Generate JWT Access Token
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `generateAccessToken(userId, role)`
2. Verify token is valid JWT
3. Decode token
4. Verify payload contains userId, role, exp

**Expected Result:**
- Valid JWT token generated
- Expires in 1 hour

**Test Data:**
```typescript
const userId = '123e4567-e89b-12d3-a456-426614174000';
const role = 'customer';
```

**Assertions:**
```typescript
const token = generateAccessToken(userId, role);
expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
const decoded = jwt.decode(token);
expect(decoded.userId).toBe(userId);
expect(decoded.role).toBe(role);
expect(decoded.exp - decoded.iat).toBe(3600); // 1 hour
```

---

#### TC-UNIT-TOKEN-002: Generate JWT Refresh Token
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `generateRefreshToken(userId)`
2. Verify token is valid JWT
3. Decode token
4. Verify payload contains userId, exp

**Expected Result:**
- Valid JWT token generated
- Expires in 30 days

**Test Data:**
```typescript
const userId = '123e4567-e89b-12d3-a456-426614174000';
```

**Assertions:**
```typescript
const token = generateRefreshToken(userId);
const decoded = jwt.decode(token);
expect(decoded.userId).toBe(userId);
expect(decoded.exp - decoded.iat).toBe(2592000); // 30 days
```

---

#### TC-UNIT-TOKEN-003: Verify Valid Token
**Requirement:** REQ-AUTH-003  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Generate valid token
2. Call `verifyToken(token)`
3. Verify returns decoded payload

**Expected Result:**
- Token verified successfully
- Payload returned

**Test Data:**
```typescript
const token = generateAccessToken('user-123', 'customer');
```

**Assertions:**
```typescript
const payload = verifyToken(token);
expect(payload.userId).toBe('user-123');
expect(payload.role).toBe('customer');
```

---

#### TC-UNIT-TOKEN-004: Verify Expired Token
**Requirement:** REQ-AUTH-003  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Generate token with past expiration
2. Call `verifyToken(token)`
3. Verify throws TokenExpiredError

**Expected Result:**
- Error thrown: "Token expired"

**Test Data:**
```typescript
const expiredToken = jwt.sign({ userId: 'user-123' }, secret, { expiresIn: '-1h' });
```

**Assertions:**
```typescript
expect(() => verifyToken(expiredToken)).toThrow('Token expired');
```

---

#### TC-UNIT-TOKEN-005: Verify Invalid Token
**Requirement:** REQ-AUTH-003  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Create invalid token string
2. Call `verifyToken(token)`
3. Verify throws JsonWebTokenError

**Expected Result:**
- Error thrown: "Invalid token"

**Test Data:**
```typescript
const invalidToken = 'invalid.token.string';
```

**Assertions:**
```typescript
expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
```

---

### 1.5 Permission Checks

#### TC-UNIT-RBAC-001: Check Customer Permissions
**Requirement:** REQ-RBAC-001  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `hasPermission('customer', 'view_own_profile')`
2. Verify returns true
3. Call `hasPermission('customer', 'manage_products')`
4. Verify returns false

**Expected Result:**
- Customer has access to own resources
- Customer denied admin actions

**Test Data:**
```typescript
const role = 'customer';
```

**Assertions:**
```typescript
expect(hasPermission(role, 'view_own_profile')).toBe(true);
expect(hasPermission(role, 'update_own_profile')).toBe(true);
expect(hasPermission(role, 'place_order')).toBe(true);
expect(hasPermission(role, 'manage_products')).toBe(false);
expect(hasPermission(role, 'view_all_orders')).toBe(false);
```

---

#### TC-UNIT-RBAC-002: Check Admin Permissions
**Requirement:** REQ-RBAC-002  
**Priority:** HIGH  
**Test Type:** Unit

**Test Steps:**
1. Call `hasPermission('admin', 'manage_products')`
2. Verify returns true
3. Call `hasPermission('admin', 'view_all_orders')`
4. Verify returns true

**Expected Result:**
- Admin has access to all actions

**Test Data:**
```typescript
const role = 'admin';
```

**Assertions:**
```typescript
expect(hasPermission(role, 'manage_products')).toBe(true);
expect(hasPermission(role, 'view_all_orders')).toBe(true);
expect(hasPermission(role, 'manage_users')).toBe(true);
expect(hasPermission(role, 'view_analytics')).toBe(true);
```

---

## 2. Integration Test Cases

### 2.1 User Registration

#### TC-INT-REG-001: Successful Registration
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Send POST request to `/api/auth/register`
2. Verify response status 201
3. Verify user created in database
4. Verify verification email sent
5. Verify access token returned

**Expected Result:**
- User account created
- Email verification sent
- Tokens returned

**Test Data:**
```json
{
  "email": "newuser@example.com",
  "password": "Password123",
  "name": "New User"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(201);
expect(response.body.user.email).toBe('newuser@example.com');
expect(response.body.accessToken).toBeDefined();
expect(response.body.refreshToken).toBeDefined();
// Check database
const user = await db.users.findByEmail('newuser@example.com');
expect(user).toBeDefined();
expect(user.email_confirmed_at).toBeNull();
```

---

#### TC-INT-REG-002: Registration with Duplicate Email
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Register user with email "existing@example.com"
2. Attempt to register again with same email
3. Verify response status 409
4. Verify error message

**Expected Result:**
- Registration fails
- Error: "Email already exists"

**Test Data:**
```json
{
  "email": "existing@example.com",
  "password": "Password123"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(409);
expect(response.body.error).toBe('Email already exists');
expect(response.body.code).toBe('AUTH-002');
```

---

#### TC-INT-REG-003: Registration with Invalid Email
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Send POST request with invalid email
2. Verify response status 400
3. Verify validation error message

**Expected Result:**
- Registration fails
- Error: "Invalid email format"

**Test Data:**
```json
{
  "email": "invalid-email",
  "password": "Password123"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(400);
expect(response.body.error).toContain('Invalid email');
```

---

#### TC-INT-REG-004: Registration with Weak Password
**Requirement:** REQ-REG-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Send POST request with weak password
2. Verify response status 400
3. Verify validation error message

**Expected Result:**
- Registration fails
- Error: "Password doesn't meet requirements"

**Test Data:**
```json
{
  "email": "user@example.com",
  "password": "weak"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(400);
expect(response.body.error).toContain('Password');
expect(response.body.code).toBe('AUTH-006');
```

---

### 2.2 User Login

#### TC-INT-LOGIN-001: Successful Login
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Create verified user
2. Send POST request to `/api/auth/login`
3. Verify response status 200
4. Verify tokens returned
5. Verify user data returned

**Expected Result:**
- Login successful
- Tokens returned
- User data returned

**Test Data:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
expect(response.body.accessToken).toBeDefined();
expect(response.body.refreshToken).toBeDefined();
expect(response.body.user.email).toBe('user@example.com');
expect(response.body.user.role).toBe('customer');
```

---

#### TC-INT-LOGIN-002: Login with Invalid Credentials
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Send POST request with wrong password
2. Verify response status 401
3. Verify error message

**Expected Result:**
- Login fails
- Error: "Invalid credentials"

**Test Data:**
```json
{
  "email": "user@example.com",
  "password": "WrongPassword"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(401);
expect(response.body.error).toBe('Invalid credentials');
expect(response.body.code).toBe('AUTH-001');
```

---

#### TC-INT-LOGIN-003: Login with Unverified Email
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Create unverified user
2. Attempt login
3. Verify response status 403
4. Verify error message

**Expected Result:**
- Login fails
- Error: "Email not verified"

**Test Data:**
```json
{
  "email": "unverified@example.com",
  "password": "Password123"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(403);
expect(response.body.error).toBe('Email not verified');
expect(response.body.code).toBe('AUTH-003');
```

---

#### TC-INT-LOGIN-004: Login with Guest Cart Migration
**Requirement:** REQ-GU-004, REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Create guest cart with items
2. Login user
3. Verify guest cart migrated to user cart
4. Verify localStorage cleared

**Expected Result:**
- Guest cart items added to user cart
- localStorage cleared

**Test Data:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "guestCart": {
    "items": [
      { "product_id": "prod-001", "quantity": 2 }
    ]
  }
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
// Check user cart in database
const userCart = await db.cart.findByUserId(response.body.user.id);
expect(userCart.items).toHaveLength(1);
expect(userCart.items[0].product_id).toBe('prod-001');
```

---

### 2.3 Email Verification

#### TC-INT-VERIFY-001: Successful Email Verification
**Requirement:** REQ-REG-002  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Register new user
2. Extract verification token from email
3. Send POST request to `/api/auth/verify-email`
4. Verify response status 200
5. Verify user email_confirmed_at updated

**Expected Result:**
- Email verified successfully
- User can now login

**Test Data:**
```json
{
  "token": "valid-verification-token"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
expect(response.body.message).toBe('Email verified successfully');
const user = await db.users.findById(userId);
expect(user.email_confirmed_at).not.toBeNull();
```

---

#### TC-INT-VERIFY-002: Verification with Expired Token
**Requirement:** REQ-REG-002  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Create expired verification token
2. Send POST request to `/api/auth/verify-email`
3. Verify response status 400
4. Verify error message

**Expected Result:**
- Verification fails
- Error: "Token expired"

**Test Data:**
```json
{
  "token": "expired-token"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(400);
expect(response.body.error).toBe('Token expired');
expect(response.body.code).toBe('AUTH-005');
```

---

### 2.4 Password Reset

#### TC-INT-RESET-001: Request Password Reset
**Requirement:** REQ-AUTH-004  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Send POST request to `/api/auth/forgot-password`
2. Verify response status 200
3. Verify reset email sent
4. Verify reset token created in database

**Expected Result:**
- Reset email sent
- Reset token stored

**Test Data:**
```json
{
  "email": "user@example.com"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
expect(response.body.message).toBe('Reset email sent');
// Check email sent
expect(emailService.send).toHaveBeenCalledWith(
  expect.objectContaining({
    to: 'user@example.com',
    subject: expect.stringContaining('Password Reset')
  })
);
```

---

#### TC-INT-RESET-002: Reset Password with Valid Token
**Requirement:** REQ-AUTH-004  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Request password reset
2. Extract reset token
3. Send POST request to `/api/auth/reset-password`
4. Verify response status 200
5. Verify password updated
6. Verify can login with new password

**Expected Result:**
- Password updated successfully
- Old password no longer works
- New password works

**Test Data:**
```json
{
  "token": "valid-reset-token",
  "newPassword": "NewPassword123"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
// Try login with old password
const oldLogin = await request(app).post('/api/auth/login')
  .send({ email: 'user@example.com', password: 'OldPassword123' });
expect(oldLogin.status).toBe(401);
// Try login with new password
const newLogin = await request(app).post('/api/auth/login')
  .send({ email: 'user@example.com', password: 'NewPassword123' });
expect(newLogin.status).toBe(200);
```

---

### 2.5 Profile Management

#### TC-INT-PROF-001: Get User Profile
**Requirement:** REQ-PROF-001  
**Priority:** MEDIUM  
**Test Type:** Integration

**Test Steps:**
1. Login as user
2. Send GET request to `/api/profile`
3. Verify response status 200
4. Verify profile data returned

**Expected Result:**
- Profile data returned
- Sensitive data excluded (password)

**Test Data:**
```typescript
// Authenticated user
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
expect(response.body.email).toBe('user@example.com');
expect(response.body.name).toBeDefined();
expect(response.body.password).toBeUndefined();
expect(response.body.created_at).toBeDefined();
```

---

#### TC-INT-PROF-002: Update User Profile
**Requirement:** REQ-PROF-002  
**Priority:** MEDIUM  
**Test Type:** Integration

**Test Steps:**
1. Login as user
2. Send PUT request to `/api/profile`
3. Verify response status 200
4. Verify profile updated in database

**Expected Result:**
- Profile updated successfully

**Test Data:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
expect(response.body.name).toBe('Updated Name');
expect(response.body.phone).toBe('+1234567890');
// Check database
const user = await db.users.findById(userId);
expect(user.name).toBe('Updated Name');
```

---

### 2.6 Address Management

#### TC-INT-ADDR-001: Add New Address
**Requirement:** REQ-ADDR-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Login as user
2. Send POST request to `/api/addresses`
3. Verify response status 201
4. Verify address created in database
5. Verify first address set as default

**Expected Result:**
- Address created successfully
- First address is default

**Test Data:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "address_line1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA"
}
```

**Assertions:**
```typescript
expect(response.status).toBe(201);
expect(response.body.id).toBeDefined();
expect(response.body.is_default).toBe(true);
// Check database
const address = await db.addresses.findById(response.body.id);
expect(address.user_id).toBe(userId);
expect(address.is_default).toBe(true);
```

---

#### TC-INT-ADDR-002: Maximum Address Limit
**Requirement:** REQ-ADDR-001  
**Priority:** MEDIUM  
**Test Type:** Integration

**Test Steps:**
1. Login as user
2. Add 5 addresses
3. Attempt to add 6th address
4. Verify response status 400
5. Verify error message

**Expected Result:**
- 6th address rejected
- Error: "Maximum 5 addresses allowed"

**Test Data:**
```typescript
// 5 existing addresses
```

**Assertions:**
```typescript
expect(response.status).toBe(400);
expect(response.body.error).toBe('Maximum 5 addresses allowed');
expect(response.body.code).toBe('ADDR-001');
```

---

#### TC-INT-ADDR-003: Delete Address
**Requirement:** REQ-ADDR-003  
**Priority:** MEDIUM  
**Test Type:** Integration

**Test Steps:**
1. Login as user
2. Create address
3. Send DELETE request to `/api/addresses/:id`
4. Verify response status 200
5. Verify address marked as deleted

**Expected Result:**
- Address soft deleted
- Not returned in list

**Test Data:**
```typescript
const addressId = 'addr-001';
```

**Assertions:**
```typescript
expect(response.status).toBe(200);
// Check database
const address = await db.addresses.findById(addressId);
expect(address.is_deleted).toBe(true);
// Check list
const addresses = await request(app).get('/api/addresses')
  .set('Authorization', `Bearer ${token}`);
expect(addresses.body.find(a => a.id === addressId)).toBeUndefined();
```

---

### 2.7 RBAC Authorization

#### TC-INT-RBAC-001: Customer Access to Own Resources
**Requirement:** REQ-RBAC-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Login as customer
2. Access own profile
3. Verify response status 200
4. Access own orders
5. Verify response status 200

**Expected Result:**
- Customer can access own resources

**Test Data:**
```typescript
// Customer user
```

**Assertions:**
```typescript
const profileRes = await request(app).get('/api/profile')
  .set('Authorization', `Bearer ${customerToken}`);
expect(profileRes.status).toBe(200);

const ordersRes = await request(app).get('/api/orders')
  .set('Authorization', `Bearer ${customerToken}`);
expect(ordersRes.status).toBe(200);
```

---

#### TC-INT-RBAC-002: Customer Denied Admin Access
**Requirement:** REQ-RBAC-001  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Login as customer
2. Attempt to access admin dashboard
3. Verify response status 403
4. Attempt to manage products
5. Verify response status 403

**Expected Result:**
- Customer denied admin access

**Test Data:**
```typescript
// Customer user
```

**Assertions:**
```typescript
const dashboardRes = await request(app).get('/api/admin/dashboard')
  .set('Authorization', `Bearer ${customerToken}`);
expect(dashboardRes.status).toBe(403);
expect(dashboardRes.body.code).toBe('RBAC-002');

const productsRes = await request(app).post('/api/admin/products')
  .set('Authorization', `Bearer ${customerToken}`)
  .send({ name: 'New Product' });
expect(productsRes.status).toBe(403);
```

---

#### TC-INT-RBAC-003: Admin Access to All Resources
**Requirement:** REQ-RBAC-002  
**Priority:** HIGH  
**Test Type:** Integration

**Test Steps:**
1. Login as admin
2. Access admin dashboard
3. Verify response status 200
4. Access all users
5. Verify response status 200
6. Manage products
7. Verify response status 200/201

**Expected Result:**
- Admin can access all resources

**Test Data:**
```typescript
// Admin user
```

**Assertions:**
```typescript
const dashboardRes = await request(app).get('/api/admin/dashboard')
  .set('Authorization', `Bearer ${adminToken}`);
expect(dashboardRes.status).toBe(200);

const usersRes = await request(app).get('/api/admin/users')
  .set('Authorization', `Bearer ${adminToken}`);
expect(usersRes.status).toBe(200);

const productRes = await request(app).post('/api/admin/products')
  .set('Authorization', `Bearer ${adminToken}`)
  .send({ name: 'New Product', price: 1000 });
expect(productRes.status).toBe(201);
```

---

## 3. End-to-End Test Cases

### 3.1 Guest User Journey

#### TC-E2E-GUEST-001: Complete Guest Browsing Flow
**Requirement:** REQ-GU-001, REQ-GU-002, REQ-GU-003  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Open browser in incognito mode
2. Navigate to homepage
3. Verify guest session created
4. Browse products
5. Add items to cart
6. View cart
7. Add items to wishlist
8. Verify cart persists on page refresh
9. Attempt checkout
10. Verify prompted to login/register

**Expected Result:**
- Guest can browse and add to cart
- Cart persists across refreshes
- Checkout requires authentication

**Test Data:**
```typescript
// No login required
```

**Assertions:**
```typescript
// Check localStorage
expect(localStorage.getItem('guest_id')).toBeDefined();
expect(JSON.parse(localStorage.getItem('guest_cart')).items).toHaveLength(2);
// Check checkout prompt
expect(page.locator('text=Please login or register to checkout')).toBeVisible();
```

---

### 3.2 Registration and Verification Flow

#### TC-E2E-REG-001: Complete Registration Flow
**Requirement:** REQ-REG-001, REQ-REG-002  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Navigate to registration page
2. Fill registration form
3. Submit form
4. Verify redirected to home (logged in)
5. Verify verification email sent
6. Open email
7. Click verification link
8. Verify email verified message
9. Verify can access all features

**Expected Result:**
- User registered successfully
- Email verification works
- Full access granted after verification

**Test Data:**
```typescript
const user = {
  email: 'newuser@example.com',
  password: 'Password123',
  name: 'New User'
};
```

**Assertions:**
```typescript
// After registration
expect(page.url()).toContain('/');
expect(page.locator('text=New User')).toBeVisible();
// After verification
expect(page.locator('text=Email verified successfully')).toBeVisible();
```

---

#### TC-E2E-REG-002: Guest to Registered Conversion
**Requirement:** REQ-GU-004  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Browse as guest
2. Add 3 items to cart
3. Add 2 items to wishlist
4. Click register
5. Complete registration
6. Verify cart items migrated
7. Verify wishlist items migrated
8. Verify localStorage cleared

**Expected Result:**
- Guest cart/wishlist migrated to user account
- All items preserved

**Test Data:**
```typescript
const guestCart = [
  { product_id: 'prod-001', quantity: 2 },
  { product_id: 'prod-002', quantity: 1 },
  { product_id: 'prod-003', quantity: 3 }
];
```

**Assertions:**
```typescript
// After registration
await page.goto('/cart');
expect(page.locator('.cart-item')).toHaveCount(3);
await page.goto('/wishlist');
expect(page.locator('.wishlist-item')).toHaveCount(2);
// Check localStorage cleared
expect(localStorage.getItem('guest_cart')).toBeNull();
```

---

### 3.3 Login Flow

#### TC-E2E-LOGIN-001: Successful Login Flow
**Requirement:** REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Navigate to login page
2. Enter valid credentials
3. Click login
4. Verify redirected to previous page
5. Verify user menu shows name
6. Verify can access profile

**Expected Result:**
- Login successful
- User authenticated
- Access to protected pages

**Test Data:**
```typescript
const credentials = {
  email: 'user@example.com',
  password: 'Password123'
};
```

**Assertions:**
```typescript
expect(page.url()).not.toContain('/login');
expect(page.locator('[data-testid="user-menu"]')).toContainText('User Name');
await page.click('[data-testid="user-menu"]');
await page.click('text=Profile');
expect(page.url()).toContain('/profile');
```

---

#### TC-E2E-LOGIN-002: Login with Cart Merge
**Requirement:** REQ-GU-004, REQ-AUTH-001  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Login as existing user with cart
2. Logout
3. Browse as guest and add items to cart
4. Login again
5. Verify carts merged
6. Verify quantities summed for duplicates

**Expected Result:**
- Guest cart merged with user cart
- Duplicate items have summed quantities

**Test Data:**
```typescript
const userCart = [{ product_id: 'prod-001', quantity: 2 }];
const guestCart = [
  { product_id: 'prod-001', quantity: 3 },
  { product_id: 'prod-002', quantity: 1 }
];
// Expected: prod-001 qty=5, prod-002 qty=1
```

**Assertions:**
```typescript
await page.goto('/cart');
const prod001 = page.locator('[data-product-id="prod-001"]');
expect(prod001.locator('[data-testid="quantity"]')).toHaveText('5');
expect(page.locator('.cart-item')).toHaveCount(2);
```

---

### 3.4 Password Reset Flow

#### TC-E2E-RESET-001: Complete Password Reset Flow
**Requirement:** REQ-AUTH-004  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Navigate to login page
2. Click "Forgot Password"
3. Enter email
4. Submit
5. Verify success message
6. Open email
7. Click reset link
8. Enter new password
9. Submit
10. Verify redirected to login
11. Login with new password
12. Verify successful

**Expected Result:**
- Password reset successfully
- Old password no longer works
- New password works

**Test Data:**
```typescript
const email = 'user@example.com';
const oldPassword = 'OldPassword123';
const newPassword = 'NewPassword123';
```

**Assertions:**
```typescript
// After reset
expect(page.locator('text=Password reset successfully')).toBeVisible();
// Try old password
await page.fill('[name="password"]', oldPassword);
await page.click('button[type="submit"]');
expect(page.locator('text=Invalid credentials')).toBeVisible();
// Try new password
await page.fill('[name="password"]', newPassword);
await page.click('button[type="submit"]');
expect(page.url()).not.toContain('/login');
```

---

### 3.5 Profile Management Flow

#### TC-E2E-PROF-001: Update Profile Flow
**Requirement:** REQ-PROF-002  
**Priority:** MEDIUM  
**Test Type:** E2E

**Test Steps:**
1. Login as user
2. Navigate to profile page
3. Click edit
4. Update name and phone
5. Save changes
6. Verify success message
7. Refresh page
8. Verify changes persisted

**Expected Result:**
- Profile updated successfully
- Changes persisted

**Test Data:**
```typescript
const updates = {
  name: 'Updated Name',
  phone: '+1234567890'
};
```

**Assertions:**
```typescript
expect(page.locator('text=Profile updated successfully')).toBeVisible();
await page.reload();
expect(page.locator('[data-testid="profile-name"]')).toHaveValue('Updated Name');
expect(page.locator('[data-testid="profile-phone"]')).toHaveValue('+1234567890');
```

---

### 3.6 Address Management Flow

#### TC-E2E-ADDR-001: Add and Manage Addresses
**Requirement:** REQ-ADDR-001, REQ-ADDR-002, REQ-ADDR-003  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Login as user
2. Navigate to addresses page
3. Click "Add Address"
4. Fill address form
5. Save
6. Verify address appears in list
7. Edit address
8. Update city
9. Save
10. Verify updated
11. Delete address
12. Confirm deletion
13. Verify removed from list

**Expected Result:**
- Can add, edit, and delete addresses
- Changes reflected immediately

**Test Data:**
```typescript
const address = {
  name: 'John Doe',
  phone: '+1234567890',
  address_line1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'USA'
};
```

**Assertions:**
```typescript
// After add
expect(page.locator('.address-card')).toHaveCount(1);
expect(page.locator('text=123 Main St')).toBeVisible();
// After edit
expect(page.locator('text=Los Angeles')).toBeVisible();
// After delete
expect(page.locator('.address-card')).toHaveCount(0);
```

---

### 3.7 Admin Access Flow

#### TC-E2E-ADMIN-001: Admin Dashboard Access
**Requirement:** REQ-RBAC-002  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Login as admin
2. Navigate to admin dashboard
3. Verify dashboard loads
4. Verify can view users
5. Verify can manage products
6. Verify can view orders

**Expected Result:**
- Admin has full access to dashboard
- All admin features accessible

**Test Data:**
```typescript
const adminCredentials = {
  email: 'admin@example.com',
  password: 'AdminPass123'
};
```

**Assertions:**
```typescript
expect(page.url()).toContain('/admin');
expect(page.locator('text=Admin Dashboard')).toBeVisible();
await page.click('text=Users');
expect(page.locator('.user-table')).toBeVisible();
await page.click('text=Products');
expect(page.locator('.product-table')).toBeVisible();
```

---

#### TC-E2E-ADMIN-002: Customer Denied Admin Access
**Requirement:** REQ-RBAC-001  
**Priority:** HIGH  
**Test Type:** E2E

**Test Steps:**
1. Login as customer
2. Attempt to navigate to admin dashboard
3. Verify redirected or access denied
4. Verify error message

**Expected Result:**
- Customer cannot access admin pages

**Test Data:**
```typescript
const customerCredentials = {
  email: 'customer@example.com',
  password: 'CustomerPass123'
};
```

**Assertions:**
```typescript
await page.goto('/admin');
expect(page.url()).not.toContain('/admin');
expect(page.locator('text=Access denied')).toBeVisible();
```

---

## 4. Performance Test Cases

### 4.1 Load Testing

#### TC-PERF-001: Concurrent User Logins
**Requirement:** REQ-PERF-002  
**Priority:** HIGH  
**Test Type:** Performance

**Test Steps:**
1. Simulate 1000 concurrent login requests
2. Measure response times
3. Measure success rate
4. Verify no errors

**Expected Result:**
- 99% requests complete in < 2 seconds
- 99.9% success rate
- No server errors

**Test Data:**
```typescript
const users = 1000;
const rampUp = 10; // seconds
```

**Assertions:**
```typescript
expect(stats.p99).toBeLessThan(2000); // 99th percentile < 2s
expect(stats.successRate).toBeGreaterThan(0.999); // 99.9%
expect(stats.errors).toBe(0);
```

---

#### TC-PERF-002: Guest Session Creation Throughput
**Requirement:** REQ-PERF-001, REQ-PERF-002  
**Priority:** HIGH  
**Test Type:** Performance

**Test Steps:**
1. Simulate 10,000 guest sessions per second
2. Measure response times
3. Measure throughput
4. Verify no errors

**Expected Result:**
- 95% requests complete in < 100ms
- Sustain 10,000 req/s
- No errors

**Test Data:**
```typescript
const requestsPerSecond = 10000;
const duration = 60; // seconds
```

**Assertions:**
```typescript
expect(stats.p95).toBeLessThan(100); // 95th percentile < 100ms
expect(stats.throughput).toBeGreaterThan(10000); // req/s
expect(stats.errors).toBe(0);
```

---

#### TC-PERF-003: Cart Operations Performance
**Requirement:** REQ-PERF-001  
**Priority:** MEDIUM  
**Test Type:** Performance

**Test Steps:**
1. Simulate 5000 concurrent cart operations
2. Mix of add, update, remove operations
3. Measure response times
4. Verify data consistency

**Expected Result:**
- 95% requests complete in < 500ms
- No data loss
- No race conditions

**Test Data:**
```typescript
const operations = 5000;
const mix = { add: 0.5, update: 0.3, remove: 0.2 };
```

**Assertions:**
```typescript
expect(stats.p95).toBeLessThan(500); // 95th percentile < 500ms
expect(stats.dataLoss).toBe(0);
expect(stats.raceConditions).toBe(0);
```

---

## 5. Security Test Cases

### 5.1 Authentication Security

#### TC-SEC-AUTH-001: Brute Force Protection
**Requirement:** SEC-AUTH-002  
**Priority:** HIGH  
**Test Type:** Security

**Test Steps:**
1. Attempt login with wrong password 5 times
2. Verify account locked
3. Attempt login with correct password
4. Verify still locked
5. Wait 15 minutes
6. Attempt login with correct password
7. Verify successful

**Expected Result:**
- Account locked after 5 failed attempts
- Lockout lasts 15 minutes
- Email notification sent

**Test Data:**
```typescript
const email = 'user@example.com';
const wrongPassword = 'WrongPassword';
const correctPassword = 'Password123';
```

**Assertions:**
```typescript
// After 5 attempts
expect(response.status).toBe(423); // Locked
expect(response.body.error).toBe('Account locked');
// After 15 minutes
expect(response.status).toBe(200);
```

---

#### TC-SEC-AUTH-002: SQL Injection Prevention
**Requirement:** SEC-DATA-002  
**Priority:** HIGH  
**Test Type:** Security

**Test Steps:**
1. Attempt login with SQL injection in email
2. Verify request rejected
3. Attempt registration with SQL injection
4. Verify request rejected

**Expected Result:**
- SQL injection attempts blocked
- No database errors

**Test Data:**
```typescript
const sqlInjections = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DROP TABLE users--"
];
```

**Assertions:**
```typescript
sqlInjections.forEach(injection => {
  const response = await request(app).post('/api/auth/login')
    .send({ email: injection, password: 'test' });
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('Invalid');
});
```

---

#### TC-SEC-AUTH-003: XSS Prevention
**Requirement:** SEC-DATA-002  
**Priority:** HIGH  
**Test Type:** Security

**Test Steps:**
1. Attempt registration with XSS in name
2. Verify script tags escaped
3. Retrieve profile
4. Verify XSS not executed

**Expected Result:**
- XSS attempts sanitized
- Scripts not executed

**Test Data:**
```typescript
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")'
];
```

**Assertions:**
```typescript
const response = await request(app).post('/api/auth/register')
  .send({ email: 'user@example.com', password: 'Pass123', name: xssPayloads[0] });
expect(response.body.user.name).not.toContain('<script>');
expect(response.body.user.name).toContain('&lt;script&gt;');
```

---

### 5.2 Authorization Security

#### TC-SEC-RBAC-001: Privilege Escalation Prevention
**Requirement:** REQ-RBAC-001, REQ-RBAC-002  
**Priority:** HIGH  
**Test Type:** Security

**Test Steps:**
1. Login as customer
2. Attempt to access admin endpoint with customer token
3. Verify access denied
4. Attempt to modify token to change role
5. Verify token invalid

**Expected Result:**
- Customer cannot access admin endpoints
- Token tampering detected

**Test Data:**
```typescript
const customerToken = 'valid-customer-token';
```

**Assertions:**
```typescript
const response = await request(app).get('/api/admin/users')
  .set('Authorization', `Bearer ${customerToken}`);
expect(response.status).toBe(403);
expect(response.body.code).toBe('RBAC-002');
```

---

#### TC-SEC-RBAC-002: IDOR Prevention
**Requirement:** SEC-DATA-002  
**Priority:** HIGH  
**Test Type:** Security

**Test Steps:**
1. Login as user A
2. Attempt to access user B's profile
3. Verify access denied
4. Attempt to update user B's profile
5. Verify access denied

**Expected Result:**
- Users cannot access other users' data

**Test Data:**
```typescript
const userAToken = 'user-a-token';
const userBId = 'user-b-id';
```

**Assertions:**
```typescript
const response = await request(app).get(`/api/users/${userBId}/profile`)
  .set('Authorization', `Bearer ${userAToken}`);
expect(response.status).toBe(403);
```

---

### 5.3 Rate Limiting

#### TC-SEC-RATE-001: Login Rate Limiting
**Requirement:** SEC-RATE-001  
**Priority:** MEDIUM  
**Test Type:** Security

**Test Steps:**
1. Attempt 6 login requests in 1 minute
2. Verify 6th request rate limited
3. Wait 1 minute
4. Attempt login again
5. Verify successful

**Expected Result:**
- Rate limit enforced (5 req/min)
- Limit resets after 1 minute

**Test Data:**
```typescript
const requests = 6;
const timeWindow = 60; // seconds
```

**Assertions:**
```typescript
// 6th request
expect(response.status).toBe(429); // Too Many Requests
expect(response.body.error).toContain('Rate limit');
// After 1 minute
expect(response.status).toBe(200);
```

---

## Test Execution Summary

### Total Test Cases: 100+

| Category | Unit | Integration | E2E | Performance | Security | Total |
|----------|------|-------------|-----|-------------|----------|-------|
| Guest User | 7 | 0 | 1 | 1 | 0 | 9 |
| Registration | 0 | 4 | 2 | 0 | 1 | 7 |
| Authentication | 5 | 4 | 2 | 1 | 3 | 15 |
| Email Validation | 2 | 2 | 0 | 0 | 0 | 4 |
| Password Validation | 5 | 0 | 0 | 0 | 0 | 5 |
| Token Management | 5 | 0 | 0 | 0 | 0 | 5 |
| Profile Management | 0 | 2 | 1 | 0 | 0 | 3 |
| Address Management | 0 | 3 | 1 | 0 | 0 | 4 |
| RBAC | 2 | 3 | 2 | 0 | 2 | 9 |
| Cart Operations | 0 | 0 | 0 | 1 | 0 | 1 |
| **TOTAL** | **26** | **18** | **9** | **3** | **6** | **62** |

---

**End of Test Cases Document**
