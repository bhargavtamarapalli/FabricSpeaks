# Phase 2 Testing Guide

## Quick Start

### Running the Test Suite

```bash
# 1. Ensure server is running
npm run dev

# 2. In a new terminal, run tests
npx tsx tests/phase2-test-suite.ts
```

### Expected Output

```
🚀 Starting Phase 2 Test Suite...

✅ CSRF Token fetched successfully
🛒 Testing Guest Cart...
✅ Guest cart retrieval successful

🔍 Testing Search...
✅ Search successful. Found 0 results

🔔 Testing Stock Notifications...
✅ Stock notification endpoint active (Got expected 404 for random ID)

✨ All tests completed!
```

## Test Coverage

### 1. CSRF Token Generation
- **Endpoint:** `GET /api/csrf-token`
- **Validates:** Token generation and cookie handling
- **Expected:** 200 OK with `csrfToken` in response

### 2. Guest Cart
- **Endpoint:** `GET /api/cart`
- **Validates:** Guest cart retrieval with session ID
- **Expected:** 200 OK with empty cart items array

### 3. Product Search
- **Endpoint:** `GET /api/search?q=fabric&limit=5`
- **Validates:** Search functionality with query parameters
- **Expected:** 200 OK with results array (may be empty if no products)

### 4. Stock Notifications
- **Endpoint:** `POST /api/stock-notifications`
- **Validates:** CSRF protection and endpoint availability
- **Expected:** 404 (product not found) or 201 (notification created)

## Troubleshooting

### Server Not Running
**Error:** `ECONNREFUSED`
**Solution:** Start the server with `npm run dev`

### CSRF Token Errors
**Error:** `403 Forbidden` or `CSRF token validation failed`
**Solution:** 
- Ensure CSRF middleware is properly configured
- Check that `csurf` is not skipping GET requests
- Verify cookie handling in test script

### Search Errors
**Error:** `column "search_vector" does not exist`
**Solution:** 
- Ensure `pg_trgm` extension is enabled
- Verify search queries use dynamic `tsvector` construction
- Run: `npx tsx scripts/enable-extension.ts`

### Database Connection Issues
**Error:** `CONNECT_TIMEOUT`
**Solution:**
- Check `DATABASE_URL` in `.env.local`
- Verify database is accessible
- Check firewall/network settings

## Adding New Tests

To add new test cases to `tests/phase2-test-suite.ts`:

```typescript
async function testNewFeature() {
  console.log('\n🔧 Testing New Feature...');
  
  const res = await fetch(`${BASE_URL}/new-endpoint`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'Cookie': cookie
    },
    body: JSON.stringify({ /* data */ })
  });
  
  if (res.status === 200) {
    log('New feature test passed', 'success');
  } else {
    log(`New feature test failed with status ${res.status}`, 'error');
  }
}

// Add to runTests():
await testNewFeature();
```

## Manual Testing Checklist

### Guest Cart Workflow
- [ ] Add item to cart without login
- [ ] Verify cart persists in localStorage
- [ ] Login with existing account
- [ ] Verify cart items merged correctly
- [ ] Complete checkout

### Stock Notifications
- [ ] Subscribe to out-of-stock product
- [ ] Verify email received
- [ ] Update product stock
- [ ] Verify notification email sent
- [ ] Check notification marked as sent in DB

### Search Functionality
- [ ] Search with exact product name
- [ ] Search with partial match
- [ ] Search with typo (fuzzy search)
- [ ] Apply filters (category, price)
- [ ] Test sorting options
- [ ] Verify pagination

### Coupon System
- [ ] Create coupon in admin panel
- [ ] Apply valid coupon at checkout
- [ ] Verify discount calculated correctly
- [ ] Test expired coupon rejection
- [ ] Test usage limit enforcement
- [ ] Test minimum order requirement

### Order Tracking
- [ ] Place order
- [ ] Admin updates shipping info
- [ ] Verify tracking email sent
- [ ] User views tracking details
- [ ] Check estimated delivery date

### Mobile Responsiveness
- [ ] Test on mobile device (< 640px)
- [ ] Test on tablet (640-1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify mobile menu works
- [ ] Check touch targets (min 44x44px)
- [ ] Test form inputs on mobile

### Image Optimization
- [ ] Upload image via admin panel
- [ ] Verify variants created (thumbnail, medium, large)
- [ ] Check WebP format
- [ ] Verify blur placeholder
- [ ] Test responsive image component
- [ ] Check lazy loading

## Performance Testing

### Load Testing Search
```bash
# Using Apache Bench (if installed)
ab -n 1000 -c 10 http://127.0.0.1:5000/api/search?q=fabric

# Expected: < 100ms average response time
```

### Database Query Performance
```sql
-- Check search query performance
EXPLAIN ANALYZE
SELECT * FROM products
WHERE (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) @@ plainto_tsquery('english', 'fabric');

-- Should use indexes, not sequential scan
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Phase 2 Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run dev &
      - run: sleep 10  # Wait for server
      - run: npx tsx tests/phase2-test-suite.ts
```

## Debugging Tips

### Enable Verbose Logging
```typescript
// In test script
console.log('Request:', { url, method, headers, body });
console.log('Response:', { status, headers, body });
```

### Check Server Logs
```bash
# Server logs show all requests
# Look for errors or warnings
```

### Use Debug Script
```bash
# Test individual endpoints
npx tsx tests/debug-csrf.ts
```

## Next Steps

After all tests pass:
1. Run manual testing checklist
2. Perform load testing
3. Test on real devices
4. Review security checklist
5. Deploy to staging environment
6. Conduct UAT (User Acceptance Testing)
7. Deploy to production

---

**Last Updated:** 2025-11-23  
**Test Suite Version:** 1.0  
**Status:** All tests passing ✅
