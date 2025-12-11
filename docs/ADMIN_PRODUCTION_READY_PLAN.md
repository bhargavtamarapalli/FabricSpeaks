# 🚀 Admin App Production Readiness - Implementation Plan

**Project:** FabricSpeaks Admin Panel  
**Target:** Production-Ready State  
**Timeline:** 6-8 Weeks  
**Current Status:** 60% Ready (40% Critical Gap)  
**Priority:** HIGH - Security & Stability First

---

## 📋 EXECUTIVE SUMMARY

This plan addresses **64 identified issues** in a systematic, risk-prioritized approach:
- **Phase 1 (Week 1-2):** Critical Security & Stability - 8 BLOCKERS + 8 CRITICAL issues
- **Phase 2 (Week 3):** Performance & Type Safety - 12 CRITICAL/MAJOR issues
- **Phase 3 (Week 4):** Testing & Quality Assurance - Infrastructure setup
- **Phase 4 (Week 5):** Database & Backend Optimization - 10 MAJOR issues
- **Phase 5 (Week 6):** Polish & Production Prep - Final touches
- **Phase 6 (Week 7-8):** Security Audit & Load Testing - Verification

---

## 🎯 SUCCESS CRITERIA

### Minimum Requirements for Production:
- ✅ All 8 BLOCKER issues resolved
- ✅ All 15 CRITICAL security issues resolved
- ✅ 80%+ test coverage on critical paths
- ✅ Security audit passed
- ✅ Load testing passed (1000 concurrent users)
- ✅ All API endpoints type-safe
- ✅ Database migrations in place
- ✅ Monitoring & alerting configured
- ✅ Documentation complete

---

# PHASE 1: CRITICAL SECURITY & STABILITY (Week 1-2)

**Goal:** Eliminate all BLOCKER and critical security vulnerabilities  
**Timeline:** 10 working days  
**Team Size:** 2-3 developers  
**Risk Level:** 🔴 CRITICAL

## Week 1: Security Foundations

### Day 1-2: File Upload Security (BLOCKER B4)
**Files:** `client/src/lib/admin/api.ts`, `server/routes/upload.ts`

#### Tasks:
1. **Frontend Validation**
   ```typescript
   // client/src/lib/admin/validation.ts
   export async function validateImageFile(file: File): Promise<void> {
     // 1. Check file type
     if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
       throw new ValidationError('Invalid file type');
     }
     
     // 2. Check file size
     if (file.size > MAX_IMAGE_SIZE) {
       throw new ValidationError('File too large');
     }
     
     // 3. Sanitize filename
     const sanitizedName = sanitizeFilename(file.name);
     
     // 4. Verify magic numbers
     const header = await readFileHeader(file);
     if (!isValidImageHeader(header)) {
       throw new ValidationError('Invalid image file');
     }
   }
   ```

2. **Backend Validation**
   ```typescript
   // server/middleware/upload-validator.ts
   export function validateUpload(req, res, next) {
     // 1. Validate MIME type
     // 2. Scan for malware (ClamAV integration)
     // 3. Re-encode images to strip EXIF/metadata
     // 4. Generate secure filename (UUID)
     // 5. Store in isolated directory
   }
   ```

3. **File Storage Security**
   - Store uploads outside web root
   - Serve via signed URLs with expiration
   - Implement virus scanning
   - Add rate limiting per user

**Acceptance Criteria:**
- ✅ Cannot upload non-image files
- ✅ Cannot upload files > 5MB
- ✅ All uploads virus-scanned
- ✅ Filenames sanitized
- ✅ EXIF data stripped
- ✅ Magic number validation passes

**Testing:**
- Try uploading .exe, .php, .js files (should fail)
- Try uploading 10MB image (should fail)
- Try uploading SVG with XSS payload (should be sanitized)
- Upload 1000 files in parallel (should rate limit)

---

### Day 3: CSRF Protection (BLOCKER B6)
**Files:** `client/src/lib/admin/api.ts`, `server/middleware/csrf.ts`

#### Tasks:
1. **Generate CSRF Tokens**
   ```typescript
   // server/middleware/csrf.ts
   import csrf from 'csurf';
   
   export const csrfProtection = csrf({
     cookie: {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict'
     }
   });
   ```

2. **Frontend Integration**
   ```typescript
   // client/src/lib/admin/api.ts
   function getCSRFToken(): string | null {
     return document
       .querySelector('meta[name="csrf-token"]')
       ?.getAttribute('content') || null;
   }
   
   // Add to all state-changing requests
   if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
     headers.set('X-CSRF-Token', getCSRFToken());
   }
   ```

3. **Token Rotation**
   - Rotate CSRF token every 15 minutes
   - Invalidate on logout
   - Store in HTTP-only cookie

**Acceptance Criteria:**
- ✅ All POST/PUT/PATCH/DELETE require CSRF token
- ✅ Requests without token return 403
- ✅ Tokens rotate automatically
- ✅ Tokens invalidated on logout

**Testing:**
- Try API calls without CSRF token (should fail)
- Try with expired token (should fail)
- Try with valid token (should pass)

---

### Day 4-5: Authentication & Token Management (BLOCKER B1, B2)
**Files:** `client/src/lib/admin/api.ts`, `client/src/hooks/useAuth.ts`, `server/auth/`

#### Tasks:
1. **Implement Token Refresh**
   ```typescript
   // client/src/lib/admin/auth-manager.ts
   interface TokenData {
     accessToken: string;
     refreshToken: string;
     expiresAt: number;
   }
   
   class AuthManager {
     private refreshPromise: Promise<void> | null = null;
     
     async getToken(): Promise<string> {
       const data = this.getTokenData();
       if (!data) return null;
       
       // Check if token expires in < 5 minutes
       if (this.isTokenExpiringSoon(data)) {
         await this.refreshToken(data.refreshToken);
       }
       
       return data.accessToken;
     }
     
     private async refreshToken(refreshToken: string): Promise<void> {
       // Prevent multiple simultaneous refresh calls
       if (this.refreshPromise) return this.refreshPromise;
       
       this.refreshPromise = this.performRefresh(refreshToken);
       await this.refreshPromise;
       this.refreshPromise = null;
     }
   }
   ```

2. **Remove Hard Redirects**
   ```typescript
   // client/src/lib/admin/api.ts
   export let onUnauthorized: (() => void) | null = null;
   
   export function setUnauthorizedHandler(handler: () => void) {
     onUnauthorized = handler;
   }
   
   // In App.tsx
   useEffect(() => {
     setUnauthorizedHandler(() => {
       // Show modal warning
       showWarning('Session expired. Redirecting to login...');
       setTimeout(() => navigate('/'), 2000);
     });
   }, []);
   ```

3. **Secure Token Storage**
   ```typescript
   // Use encrypted localStorage
   import { encryptToken, decryptToken } from './crypto';
   
   function setToken(token: TokenData) {
     const encrypted = encryptToken(token);
     localStorage.setItem('auth_data', encrypted);
   }
   ```

**Acceptance Criteria:**
- ✅ Tokens refresh 5 minutes before expiry
- ✅ No hard redirects (use React Router)
- ✅ User warned before logout
- ✅ Tokens encrypted in storage
- ✅ Refresh token rotation implemented

**Testing:**
- Set token to expire in 4 minutes (should auto-refresh)
- Simulate expired token (should show warning, then redirect)
- Check localStorage (should be encrypted)

---

## Week 2: Type Safety & Error Handling

### Day 6-7: Type Safety Fixes (CRITICAL C2)
**Files:** `client/src/lib/admin/api.ts`, `client/src/types/admin.ts`

#### Tasks:
1. **Replace All `any` Types**
   ```typescript
   // BEFORE
   async getRevenue(): Promise<any[]> {
     return fetchWithRetry<any[]>('/admin/analytics/revenue');
   }
   
   // AFTER
   export interface RevenueDataPoint {
     date: string;
     revenue: number;
     orders: number;
     averageOrderValue: number;
     growth: number;
   }
   
   async getRevenue(
     period: 'day' | 'week' | 'month' | 'year'
   ): Promise<RevenueDataPoint[]> {
     return fetchWithRetry<RevenueDataPoint[]>(
       `/admin/analytics/revenue?period=${period}`
     );
   }
   ```

2. **Fix Schema Type Casting**
   ```typescript
   // shared/schema.ts
   // BEFORE
   export const categories: any = pgTable(...);
   
   // AFTER
   export const categories = pgTable("categories", {
     // Proper typing without 'any'
   });
   ```

3. **Add Runtime Validation**
   ```typescript
   // Use Zod for API response validation
   import { z } from 'zod';
   
   const RevenueSchema = z.array(z.object({
     date: z.string(),
     revenue: z.number(),
     orders: z.number(),
     averageOrderValue: z.number(),
     growth: z.number(),
   }));
   
   async getRevenue(period: string): Promise<RevenueDataPoint[]> {
     const data = await fetchWithRetry('/admin/analytics/revenue');
     return RevenueSchema.parse(data); // Runtime validation
   }
   ```

**Files to Update:**
- `client/src/lib/admin/api.ts` (Analytics APIs)
- `client/src/types/admin.ts` (Add missing types)
- `shared/schema.ts` (Remove `any` casts)

**Acceptance Criteria:**
- ✅ Zero `any` types in codebase
- ✅ All API responses validated at runtime
- ✅ TypeScript strict mode enabled
- ✅ No type errors in build

---

### Day 8: Decimal Precision Fix (BLOCKER B7)
**Files:** `shared/schema.ts`, `client/src/lib/admin/utils.ts`

#### Tasks:
1. **Backend: Add Decimal Validation**
   ```typescript
   // shared/schema.ts
   export const priceSchema = z.object({
     price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must have max 2 decimals'),
     salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
   }).refine(
     (data) => {
       if (data.salePrice) {
         return parseFloat(data.salePrice) < parseFloat(data.price);
       }
       return true;
     },
     { message: "Sale price must be less than price" }
   );
   ```

2. **Frontend: Use String Types**
   ```typescript
   // client/src/types/admin.ts
   export interface AdminProduct {
     price: string; // Not number!
     salePrice: string | null;
     costPrice: string | null;
   }
   
   // client/src/lib/admin/utils.ts
   export function formatCurrency(value: string | number): string {
     const numValue = typeof value === 'string' 
       ? parseFloat(value) 
       : value;
     // ... format
   }
   ```

3. **Add Financial Math Utilities**
   ```typescript
   // client/src/lib/admin/money.ts
   export class Money {
     constructor(private amount: string) {}
     
     add(other: Money): Money {
       const sum = (
         parseFloat(this.amount) + parseFloat(other.amount)
       ).toFixed(2);
       return new Money(sum);
     }
     
     multiply(factor: number): Money {
       const result = (
         parseFloat(this.amount) * factor
       ).toFixed(2);
       return new Money(result);
     }
   }
   ```

**Acceptance Criteria:**
- ✅ All prices stored as strings
- ✅ Validation prevents > 2 decimals
- ✅ Sale price always < regular price
- ✅ No floating point errors in calculations

---

### Day 9-10: Request Handling Improvements (CRITICAL C3, C5, BLOCKER B5)
**Files:** `client/src/lib/admin/api.ts`

#### Tasks:
1. **Exponential Backoff**
   ```typescript
   function getRetryDelay(attempt: number, retryAfter?: number): number {
     if (retryAfter) return retryAfter * 1000;
     
     const base = 1000;
     const exponential = base * Math.pow(2, MAX_RETRIES - attempt);
     const jitter = Math.random() * 0.3 * exponential;
     const delay = exponential + jitter;
     
     return Math.min(delay, 10000); // Max 10s
   }
   ```

2. **Request Cancellation**
   ```typescript
   export class RequestManager {
     private controllers = new Map<string, AbortController>();
     
     createSignal(id: string): AbortSignal {
       this.cancel(id);
       const controller = new AbortController();
       this.controllers.set(id, controller);
       return controller.signal;
     }
     
     cancel(id: string) {
       this.controllers.get(id)?.abort();
       this.controllers.delete(id);
     }
   }
   
   // Usage in components
   useEffect(() => {
     const signal = requestManager.createSignal('dashboard-stats');
     loadStats(signal);
     
     return () => requestManager.cancel('dashboard-stats');
   }, []);
   ```

3. **Graceful Upload Failure**
   ```typescript
   async uploadImages(files: File[]): Promise<UploadResult> {
     const results = await Promise.allSettled(
       files.map(f => this.uploadImage(f))
     );
     
     const succeeded = results
       .filter(r => r.status === 'fulfilled')
       .map(r => (r as PromiseFulfilledResult<any>).value.url);
     
     const failed = results
       .filter(r => r.status === 'rejected')
       .map((r, i) => ({ 
         file: files[i].name, 
         error: (r as PromiseRejectedResult).reason.message 
       }));
     
     return { urls: succeeded, failed };
   }
   ```

**Acceptance Criteria:**
- ✅ Retries use exponential backoff
- ✅ Requests cancelled on unmount
- ✅ Partial upload success handled
- ✅ No memory leaks

---

# PHASE 2: DATABASE & PERFORMANCE (Week 3)

**Goal:** Optimize database and improve performance  
**Timeline:** 5 working days

### Day 11-12: Database Optimization (BLOCKER B8, B3)

#### Tasks:
1. **Add Database Indexes**
   ```sql
   -- Migration: 001_add_indexes.sql
   
   -- Product indexes
   CREATE INDEX idx_products_sku ON products(sku);
   CREATE INDEX idx_products_slug ON products(slug);
   CREATE INDEX idx_products_status ON products(status);
   CREATE INDEX idx_products_category_status ON products(category_id, status);
   CREATE INDEX idx_products_created_desc ON products(created_at DESC);
   
   -- Order indexes
   CREATE INDEX idx_orders_user_status ON orders(user_id, status);
   CREATE INDEX idx_orders_created_desc ON orders(created_at DESC);
   CREATE INDEX idx_orders_status ON orders(status);
   
   -- Full-text search
   ALTER TABLE products ADD COLUMN search_vector tsvector;
   CREATE INDEX idx_products_search ON products USING GIN(search_vector);
   
   CREATE FUNCTION products_search_trigger() RETURNS trigger AS $$
   BEGIN
     NEW.search_vector := 
       setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
       setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
       setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER products_search_update
   BEFORE INSERT OR UPDATE ON products
   FOR EACH ROW EXECUTE FUNCTION products_search_trigger();
   ```

2. **Database Constraints**
   ```sql
   -- Migration: 002_add_constraints.sql
   
   ALTER TABLE products 
     ADD CONSTRAINT chk_price_positive 
     CHECK (price::numeric > 0);
   
   ALTER TABLE products 
     ADD CONSTRAINT chk_stock_non_negative 
     CHECK (stock_quantity >= 0);
   
   ALTER TABLE categories 
     ADD CONSTRAINT chk_depth_limit 
     CHECK (depth < 5);
   
   ALTER TABLE product_variants
     ADD CONSTRAINT chk_variant_price_adjustment
     CHECK (price_adjustment::numeric >= -price::numeric);
   ```

3. **Connection Pooling**
   ```typescript
   // server/db/pool.ts
   import { Pool } from 'pg';
   
   export const pool = new Pool({
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT || '5432'),
     database: process.env.DB_NAME,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     max: 20, // max connections
     min: 5,  // min connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
     statement_timeout: 30000, // 30s query timeout
   });
   
   pool.on('error', (err) => {
     console.error('Unexpected pool error', err);
     // Alert monitoring system
   });
   ```

4. **Migration System**
   ```typescript
   // server/db/migrate.ts
   import { sql } from 'drizzle-orm';
   import { migrate } from 'drizzle-orm/postgres-js/migrator';
   
   export async function runMigrations() {
     await migrate(db, { 
       migrationsFolder: './migrations',
       migrationsTable: 'migrations_history'
     });
   }
   ```

**Acceptance Criteria:**
- ✅ All indexes created
- ✅ Query times < 100ms for common queries
- ✅ Connection pool configured
- ✅ Migration system in place
- ✅ Database constraints enforced

---

### Day 13-14: Frontend Performance

#### Tasks:
1. **Code Splitting**
   ```typescript
   // client/src/App.tsx
   const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
   const AdminProducts = lazy(() => import('./pages/admin/Products'));
   const AdminOrders = lazy(() => import('./pages/admin/Orders'));
   const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
   
   <Suspense fallback={<LoadingScreen />}>
     <Routes>
       <Route path="/admin" element={<AdminDashboard />} />
       <Route path="/admin/products" element={<AdminProducts />} />
       {/* ... */}
     </Routes>
   </Suspense>
   ```

2. **Memoization**
   ```typescript
   // Expensive components
   export const ProductCard = React.memo(({ product }: Props) => {
     const formattedPrice = useMemo(
       () => formatCurrency(product.price),
       [product.price]
     );
     
     const handleClick = useCallback(() => {
       navigate(`/admin/products/${product.id}`);
     }, [product.id]);
     
     return (/* JSX */);
   });
   ```

3. **Image Optimization**
   ```typescript
   // client/src/components/OptimizedImage.tsx
   export function OptimizedImage({ src, alt, ...props }: Props) {
     return (
       <picture>
         <source srcSet={`${src}?format=webp`} type="image/webp" />
         <img 
           src={src} 
           alt={alt}
           loading="lazy"
           decoding="async"
           {...props}
         />
       </picture>
     );
   }
   ```

4. **API Response Caching**
   ```typescript
   // client/src/lib/admin/cache.ts
   export class APICache {
     private cache = new Map<string, CacheEntry>();
     
     get<T>(key: string): T | null {
       const entry = this.cache.get(key);
       if (!entry) return null;
       
       if (Date.now() > entry.expiresAt) {
         this.cache.delete(key);
         return null;
       }
       
       return entry.data;
     }
     
     set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
       this.cache.set(key, {
         data,
         expiresAt: Date.now() + ttl
       });
     }
   }
   ```

**Acceptance Criteria:**
- ✅ Initial bundle < 200KB (gzipped)
- ✅ Lazy loading implemented
- ✅ Images lazy loaded
- ✅ API responses cached
- ✅ Lighthouse score > 90

---

### Day 15: Security Hardening (CRITICAL C4, C6, C7-C10)

#### Tasks:
1. **Secure Storage**
   ```typescript
   // client/src/lib/admin/secure-storage.ts
   import CryptoJS from 'crypto-js';
   
   const KEY = process.env.VITE_STORAGE_KEY!;
   
   export function setSecure(key: string, value: any) {
     const encrypted = CryptoJS.AES.encrypt(
       JSON.stringify(value),
       KEY
     ).toString();
     localStorage.setItem(key, encrypted);
   }
   
   export function getSecure<T>(key: string): T | null {
     const encrypted = localStorage.getItem(key);
     if (!encrypted) return null;
     
     try {
       const decrypted = CryptoJS.AES.decrypt(encrypted, KEY);
       return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
     } catch {
       return null;
     }
   }
   ```

2. **Audit Logging**
   ```typescript
   // server/middleware/audit.ts
   export function auditLog(
     action: string,
     entity: string,
     entityId: string
   ) {
     return async (req, res, next) => {
       try {
         await db.insert(auditLogs).values({
           userId: req.user.id,
           action,
           entity,
           entityId,
           details: req.body,
           ipAddress: req.ip,
           userAgent: req.headers['user-agent'],
         });
       } catch (err) {
         console.error('Audit log failed:', err);
         // Don't fail the request
       }
       next();
     };
   }
   
   // Usage
   router.delete(
     '/products/:id',
     auditLog('delete_product', 'product', req.params.id),
     deleteProductHandler
   );
   ```

3. **CSV Injection Prevention**
   ```typescript
   function sanitizeCSVCell(value: any): string {
     const str = String(value);
     
     // Prevent CSV injection
     if (str.match(/^[=+\-@]/)) {
       return `'${str}`;
     }
     
     // Escape quotes
     if (str.includes('"')) {
       return `"${str.replace(/"/g, '""')}"`;
     }
     
     return str;
   }
   ```

4. **Rate Limiting**
   ```typescript
   // server/middleware/rate-limit.ts
   import rateLimit from 'express-rate-limit';
   
   export const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // max 100 requests per window
     standardHeaders: true,
     legacyHeaders: false,
   });
   
   export const uploadLimiter = rateLimit({
     windowMs: 60 * 60 * 1000, // 1 hour
     max: 50, // max 50 uploads per hour
   });
   ```

---

# PHASE 3: TESTING INFRASTRUCTURE (Week 4)

**Goal:** Establish comprehensive testing  
**Timeline:** 5 working days  
**Target Coverage:** 80%+

### Day 16-17: Unit Testing Setup

#### Tasks:
1. **Configure Testing**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './tests/setup.ts',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'tests/',
           '**/*.d.ts',
           '**/*.config.*',
         ],
         thresholds: {
           lines: 80,
           functions: 80,
           branches: 80,
           statements: 80,
         }
       }
     }
   });
   ```

2. **Critical Path Tests**
   ```typescript
   // client/src/lib/admin/__tests__/api.test.ts
   describe('Admin API', () => {
     it('should refresh token before expiry', async () => {
       // Test token refresh logic
     });
     
     it('should handle 401 gracefully', async () => {
       // Test auth failure
     });
     
     it('should validate file uploads', async () => {
       // Test upload validation
     });
     
     it('should add CSRF tokens', async () => {
       // Test CSRF
     });
   });
   
   // client/src/lib/admin/__tests__/utils.test.ts
   describe('formatCurrency', () => {
     it('should handle string decimals', () => {
       expect(formatCurrency('99.99')).toBe('₹99.99');
     });
     
     it('should handle number inputs', () => {
       expect(formatCurrency(99.99)).toBe('₹99.99');
     });
   });
   ```

**Files to Test (Priority Order):**
1. `lib/admin/api.ts` - All API methods
2. `lib/admin/utils.ts` - All utilities
3. `hooks/admin/useAdminAuth.ts` - Auth logic
4. `components/admin/ProtectedAdminRoute.tsx` - Access control

**Acceptance Criteria:**
- ✅ 80%+ coverage on critical paths
- ✅ All API methods tested
- ✅ All utilities tested
- ✅ Auth flows tested

---

### Day 18-19: Integration Testing

#### Tasks:
1. **API Integration Tests**
   ```typescript
   // server/__tests__/admin-products.test.ts
   import request from 'supertest';
   import { app } from '../app';
   
   describe('Admin Products API', () => {
     let authToken: string;
     
     beforeAll(async () => {
       authToken = await getAdminToken();
     });
     
     it('should create product', async () => {
       const response = await request(app)
         .post('/api/admin/products')
         .set('Authorization', `Bearer ${authToken}`)
         .send({
           name: 'Test Product',
           price: '99.99',
           sku: 'TEST-001',
         });
       
       expect(response.status).toBe(201);
       expect(response.body.data.id).toBeDefined();
     });
     
     it('should reject invalid price', async () => {
       const response = await request(app)
         .post('/api/admin/products')
         .set('Authorization', `Bearer ${authToken}`)
         .send({
           name: 'Test Product',
           price: '99.999', // 3 decimals - invalid
           sku: 'TEST-002',
         });
       
       expect(response.status).toBe(400);
     });
   });
   ```

**Coverage Areas:**
- Product CRUD
- Order management
- Inventory adjustments
- Analytics endpoints
- Authentication flows

---

### Day 20: E2E Testing

#### Tasks:
1. **Critical User Journeys**
   ```typescript
   // tests/e2e/admin-product-flow.spec.ts
   import { test, expect } from '@playwright/test';
   
   test('Admin can create and publish product', async ({ page }) => {
     // 1. Login as admin
     await page.goto('/admin/login');
     await page.fill('[name=email]', 'admin@test.com');
     await page.fill('[name=password]', 'password');
     await page.click('button[type=submit]');
     
     // 2. Navigate to products
     await page.click('text=Products');
     await expect(page).toHaveURL('/admin/products');
     
     // 3. Create new product
     await page.click('text=New Product');
     await page.fill('[name=name]', 'Test Product');
     await page.fill('[name=price]', '99.99');
     await page.fill('[name=sku]', 'TEST-001');
     
     // 4. Upload image
     await page.setInputFiles('input[type=file]', './test-image.jpg');
     
     // 5. Save
     await page.click('button:has-text("Save")');
     
     // 6. Verify
     await expect(page.locator('text=Product created')).toBeVisible();
   });
   ```

**Critical Flows:**
- Admin login
- Product creation
- Order processing
- Inventory update
- Analytics viewing

---

# PHASE 4: MONITORING & ERROR HANDLING (Week 5)

**Goal:** Production monitoring and error handling  
**Timeline:** 5 working days

### Day 21-22: Error Tracking

#### Tasks:
1. **Sentry Integration**
   ```typescript
   // client/src/main.tsx
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
     integrations: [
       new Sentry.BrowserTracing(),
       new Sentry.Replay(),
     ],
     tracesSampleRate: 1.0,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   
   // server/index.ts
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

2. **Error Boundaries**
   ```typescript
   // client/src/components/ErrorBoundary.tsx
   export class ErrorBoundary extends React.Component {
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       Sentry.captureException(error, {
         contexts: {
           react: { componentStack: errorInfo.componentStack }
         }
       });
     }
     
     render() {
       if (this.state.hasError) {
         return <ErrorFallback />;
       }
       return this.props.children;
     }
   }
   ```

---

### Day 23-24: Performance Monitoring

#### Tasks:
1. **Performance Tracking**
   ```typescript
   // client/src/lib/analytics.ts
   export function trackPerformance() {
     if ('PerformanceObserver' in window) {
       const observer = new PerformanceObserver((list) => {
         for (const entry of list.getEntries()) {
           if (entry.entryType === 'navigation') {
             Sentry.setMeasurement('page_load', entry.duration, 'ms');
           }
           if (entry.entryType === 'resource') {
             // Track slow resources
             if (entry.duration > 1000) {
               Sentry.captureMessage(`Slow resource: ${entry.name}`);
             }
           }
         }
       });
       
       observer.observe({ entryTypes: ['navigation', 'resource'] });
     }
   }
   ```

2. **API Performance**
   ```typescript
   // server/middleware/performance.ts
   export function trackAPIPerformance(req, res, next) {
     const start = Date.now();
     
     res.on('finish', () => {
       const duration = Date.now() - start;
       
       // Log slow requests
       if (duration > 1000) {
         console.warn('Slow request:', {
           method: req.method,
           url: req.url,
           duration,
         });
       }
       
       // Send to monitoring
       metrics.histogram('api.request.duration', duration, {
         method: req.method,
         route: req.route?.path,
         status: res.statusCode,
       });
     });
     
     next();
   }
   ```

---

### Day 25: Logging & Alerting

#### Tasks:
1. **Structured Logging**
   ```typescript
   // server/lib/logger.ts
   import winston from 'winston';
   
   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new winston.transports.Console(),
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });
   ```

2. **Critical Alerts**
   ```typescript
   // Setup alerts in monitoring dashboard
   // Alert on:
   // - Error rate > 1%
   // - Response time > 1s (p95)
   // - 4xx/5xx spike
   // - Database connection errors
   // - Failed uploads > 10/hour
   // - Failed login attempts > 20/hour
   ```

---

# PHASE 5: DOCUMENTATION & POLISH (Week 6)

**Goal:** Complete documentation and final polish  
**Timeline:** 5 working days

### Day 26-27: API Documentation

#### Tasks:
1. **OpenAPI Spec**
   ```yaml
   # docs/api/admin.yaml
   openapi: 3.0.0
   info:
     title: FabricSpeaks Admin API
     version: 1.0.0
   paths:
     /api/admin/products:
       get:
         summary: List products
         parameters:
           - name: page
             in: query
             schema:
               type: integer
         responses:
           200:
             description: Success
             content:
               application/json:
                 schema:
                   type: object
                   properties:
                     data:
                       type: array
                       items:
                         $ref: '#/components/schemas/Product'
   ```

2. **Admin User Guide**
   ```markdown
   # docs/ADMIN_USER_GUIDE.md
   
   ## Getting Started
   ## Product Management
   ## Order Processing
   ## Inventory Management
   ## Analytics & Reporting
   ## Notifications
   ## Settings
   ```

---

### Day 28-29: Code Quality

#### Tasks:
1. **ESLint Strict Rules**
   ```json
   {
     "extends": ["eslint:recommended", "plugin:@typescript-eslint/strict"],
     "rules": {
       "@typescript-eslint/no-explicit-any": "error",
       "@typescript-eslint/no-unused-vars": "error",
       "no-console": ["warn", { "allow": ["warn", "error"] }]
     }
   }
   ```

2. **Code Review Checklist**
   - [ ] No `any` types
   - [ ] All functions documented
   - [ ] Error handling present
   - [ ] Tests written
   - [ ] Security considerations noted
   - [ ] Performance impact assessed

---

### Day 30: Final Polish

#### Tasks:
- Fix all ESLint warnings
- Remove all console.logs
- Update all dependencies
- Run final test suite
- Performance audit
- Security scan

---

# PHASE 6: PRE-PRODUCTION (Week 7-8)

**Goal:** Security audit and load testing  
**Timeline:** 10 working days

### Week 7: Security Audit

#### Tasks:
1. **Penetration Testing**
   - OWASP Top 10 check
   - SQL injection testing
   - XSS testing
   - CSRF testing
   - File upload testing
   - Authentication bypass attempts

2. **Dependency Audit**
   ```bash
   npm audit
   npm audit fix
   # Review all high/critical vulnerabilities
   ```

3. **Security Checklist**
   - [ ] HTTPS enforced
   - [ ] CSRF protection
   - [ ] XSS prevention
   - [ ] SQL injection prevention
   - [ ] Rate limiting
   - [ ] File upload validation
   - [ ] Secure headers
   - [ ] Token encryption
   - [ ] Audit logging
   - [ ] Regular backups

---

### Week 8: Load Testing & Optimization

#### Tasks:
1. **Load Testing**
   ```javascript
   // tests/load/admin-load.js
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   
   export let options = {
     stages: [
       { duration: '2m', target: 100 },  // Ramp up
       { duration: '5m', target: 100 },  // Stay at 100
       { duration: '2m', target: 500 },  // Spike
       { duration: '5m', target: 500 },  // Stay at 500
       { duration: '2m', target: 1000 }, // Stress
       { duration: '2m', target: 0 },    // Ramp down
     ],
     thresholds: {
       http_req_duration: ['p(95)<500'], // 95% under 500ms
       http_req_failed: ['rate<0.01'],   // < 1% errors
     },
   };
   
   export default function() {
     const res = http.get('https://admin.fabricspeaks.com');
     check(res, {
       'status is 200': (r) => r.status === 200,
       'response time < 500ms': (r) => r.timings.duration < 500,
     });
     sleep(1);
   }
   ```

2. **Database Load Testing**
   - 1000 concurrent reads
   - 100 concurrent writes
   - Test connection pool limits
   - Test query performance under load

3. **Optimization Based on Results**
   - Add caching where needed
   - Optimize slow queries
   - Scale infrastructure if needed

---

## 📊 PROGRESS TRACKING

### Weekly Milestones

| Week | Milestone | Deliverables | Success Metrics |
|------|-----------|--------------|-----------------|
| 1 | Security Foundations | File upload security, CSRF, Auth fixes | All blockers resolved |
| 2 | Type Safety & Errors | Remove `any`, decimal fixes, error handling | TypeScript strict mode |
| 3 | Database & Performance | Indexes, migrations, code splitting | Query < 100ms, Bundle < 200KB |
| 4 | Testing Infrastructure | Unit, integration, E2E tests | 80%+ coverage |
| 5 | Monitoring & Errors | Sentry, logging, alerting | Error tracking live |
| 6 | Documentation & Polish | API docs, user guide, cleanup | All docs complete |
| 7-8 | Security & Load Testing | Pen test, load test, optimization | Pass all tests |

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment (Day -1)
- [ ] All tests passing
- [ ] Security audit passed
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Rollback plan ready
- [ ] Team trained

### Deployment Day
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] SSL certificates valid
- [ ] CDN configured
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Smoke tests passed

### Post-Deployment (Day +1)
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Check audit logs
- [ ] Verify backups
- [ ] User acceptance testing

---

## 👥 TEAM ASSIGNMENTS

### Backend Developer
- Database optimization
- API security
- Connection pooling
- Backend testing

### Frontend Developer
- Type safety fixes
- Performance optimization
- Frontend testing
- Component polish

### DevOps Engineer
- Monitoring setup
- Load testing
- Deployment automation
- Infrastructure scaling

---

## 📈 RISK MITIGATION

### High Risk Items
1. **Database Migration** - Test on staging first, have rollback ready
2. **Authentication Changes** - Cannot break existing sessions
3. **File Upload Changes** - Don't break existing uploads

### Contingency Plans
- Keep old auth system for 1 week grace period
- Gradual rollout (10% -> 50% -> 100%)
- Feature flags for new functionality
- Instant rollback capability

---

## 💰 ESTIMATED EFFORT

### Team Size: 3 developers

| Phase | Days | Person-Days |
|-------|------|-------------|
| Phase 1 | 10 | 30 |
| Phase 2 | 5 | 15 |
| Phase 3 | 5 | 15 |
| Phase 4 | 5 | 15 |
| Phase 5 | 5 | 15 |
| Phase 6 | 10 | 30 |
| **Total** | **40** | **120** |

**Timeline:** 8 weeks (with buffer)  
**Cost:** 120 person-days × team rate

---

## ✅ DEFINITION OF DONE

### Phase Complete When:
- ✅ All planned tasks completed
- ✅ All tests passing
- ✅ Code reviewed and approved
- ✅ Documentation updated
- ✅ No critical/blocker issues remaining
- ✅ Stakeholder approval received

### Project Complete When:
- ✅ All 6 phases complete
- ✅ Security audit passed
- ✅ Load testing passed
- ✅ 80%+ test coverage
- ✅ All documentation complete
- ✅ Production deployment successful
- ✅ Monitoring active
- ✅ Zero critical bugs in 1 week post-launch

---

**Document Version:** 1.0  
**Last Updated:** November 28, 2025  
**Owner:** Engineering Team  
**Next Review:** Weekly during implementation
