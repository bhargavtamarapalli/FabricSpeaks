# 🔐 Security Features - Quick Reference Guide

**For:** FabricSpeaks Development Team  
**Created:** November 28, 2025  
**Version:** 1.0

---

## 📚 Overview

This guide shows how to use all the new security features implemented in Phase 1.

---

## 🔒 File Upload Security

### Client-Side Usage

```typescript
import { validateFile, validateFiles } from '@/lib/validation/file-validation';

// Validate single file
const result = await validateFile(file);

if (result.valid) {
  console.log('File is safe:', result.sanitizedFilename);
  // Proceed with upload
} else {
  console.error('Validation errors:', result.errors);
  // Show errors to user
  result.errors.forEach(error => {
    toast.error(error.message);
  });
}

// Validate multiple files
const results = await validateFiles(files, maxFiles);

const validFiles = results
  .map((result, index) => result.valid ? files[index] : null)
  .filter(Boolean);

const invalidFiles = results
  .map((result, index) => !result.valid ? { file: files[index], errors: result.errors } : null)
  .filter(Boolean);
```

### Server-Side Usage

```typescript
import { uploadMiddleware, uploadValidator, handleUploadError } from './middleware/upload-validator';

// Single file upload
app.post('/api/upload', 
  uploadMiddleware.single('image'),
  uploadValidator,
  async (req, res) => {
    const file = req.file;
    
    // File is validated, sanitized, and safe to use
    res.json({
      success: true,
      file: {
        filename: file.filename,
        path: file.path,
        size: file.size,
      },
    });
  }
);

// Multiple files upload
app.post('/api/upload/multiple', 
  uploadMiddleware.array('images', 10),
  uploadValidator,
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    
    // All files are validated and safe
    res.json({
      success: true,
      files: files.map(f => ({
        filename: f.filename,
        path: f.path,
      })),
    });
  }
);

// Add error handler
app.use(handleUploadError);
```

---

## 🛡️ CSRF Protection

### Initialize on App Start

```typescript
// In App.tsx or main.tsx
import { initializeCSRFProtection } from '@/lib/security/csrf';

useEffect(() => {
  const apiUrl = import.meta.env.VITE_API_URL;
  initializeCSRFProtection(apiUrl);
}, []);
```

### Automatic Protection

```typescript
// CSRF tokens are automatically injected into requests
// Just use the protected fetch:

import { createCSRFProtectedFetch } from '@/lib/security/csrf';

const protectedFetch = createCSRFProtectedFetch(fetch);

// Use it like normal fetch
await protectedFetch('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### Manual CSRF Token Usage

```typescript
import { getCSRFToken } from '@/lib/security/csrf';

// Get token for manual use (e.g., in forms)
const csrfToken = getCSRFToken();

// Add to form
<input type="hidden" name="csrf_token" value={csrfToken} />

// Or add to headers manually
headers.set('X-CSRF-Token', csrfToken);
```

### Server-Side Protection

```typescript
import { csrfProtection, getCSRFToken } from './middleware/csrf-protection';

// Apply globally
app.use(csrfProtection({
  ignorePaths: ['/api/public'],
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Client needs to read it
    sameSite: 'strict',
  },
}));

// Endpoint to get new token
app.get('/api/csrf-token', getCSRFToken);
```

---

## 🔑 Authentication Token Management

### Initialize Token Manager

```typescript
// In App.tsx or auth setup
import { getTokenManager } from '@/lib/security/auth-token-manager';
import { useLocation } from 'wouter';

const [, navigate] = useLocation();

const tokenManager = getTokenManager({
  apiUrl: import.meta.env.VITE_API_URL,
  
  onRefreshSuccess: (tokenData) => {
    console.log('Token refreshed successfully');
  },
  
  onRefreshFailure: (error) => {
    console.error('Token refresh failed:', error);
  },
  
  onUnauthorized: () => {
    // Don't use window.location! Use React Router
    console.warn('Session expired, redirecting to login');
    setTimeout(() => navigate('/login'), 2000);
  },
});

// Initialize on mount
useEffect(() => {
  tokenManager.initialize();
  
  return () => {
    tokenManager.stop();
  };
}, []);
```

### Get Access Token

```typescript
import { getTokenManager } from '@/lib/security/auth-token-manager';

const tokenManager = getTokenManager();

// Get token (auto-refreshes if needed)
const token = await tokenManager.getAccessToken();

// Use in API call
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Manual Token Operations

```typescript
import { 
  getTokenData,
  setTokenData,
  clearTokenData,
  isTokenExpiringSoon,
  getTimeUntilExpiry 
} from '@/lib/security/auth-token-manager';

// Check token status
const tokenData = getTokenData();
if (tokenData) {
  const expiring = isTokenExpiringSoon(tokenData);
  const timeLeft = getTimeUntilExpiry(tokenData);
  
  console.log('Token expires in:', Math.round(timeLeft / 1000 / 60), 'minutes');
}

// Store new token (after login)
setTokenData({
  accessToken: 'xxx',
  refreshToken: 'yyy',
  expiresAt: Date.now() + (3600 * 1000), // 1 hour
  issuedAt: Date.now(),
});

// Clear token (on logout)
clearTokenData();

// Or use manager
const manager = getTokenManager();
manager.logout(); // Clears tokens and stops auto-refresh
```

---

## 📝 Logging

### Basic Usage

```typescript
import { logger } from '@/lib/utils/logger';

// Different log levels
logger.debug('Detailed debugging info', { userId, action });
logger.info('General information', { event: 'user_login' });
logger.warn('Warning message', { reason: 'unusual_activity' });
logger.error('Error occurred', { error: error.message, stack: error.stack });
```

### Performance Tracking

```typescript
import { logger } from '@/lib/utils/logger';

// Automatic timing
const result = await logger.time(
  'File validation',
  async () => {
    return await validateFiles(files);
  },
  { fileCount: files.length }
);

// Logs:
// [DEBUG] File validation completed { fileCount: 5, duration: '245.67ms' }
// [WARN] File validation was slow { fileCount: 5, duration: '1256.34ms' } (if > 1s)
```

### In Production

```typescript
// Development: All logs to console
// Production: Only warnings/errors, sent to Sentry

// Logs automatically include:
// - Timestamp
// - Log level
// - Message
// - Context object
// - Stack trace (for errors)
```

---

## 🔗 Integration Example

Complete example showing all features together:

```typescript
// ProductUpload.tsx

import { useState } from 'react';
import { validateFile } from '@/lib/validation/file-validation';
import { getTokenManager } from '@/lib/security/auth-token-manager';
import { logger } from '@/lib/utils/logger';

export function ProductUpload() {
  const [uploading, setUploading] = useState(false);
  const tokenManager = getTokenManager();
  
  async function handleUpload(file: File) {
    try {
      setUploading(true);
      
      // 1. Validate file client-side
      logger.info('Validating file', { fileName: file.name, size: file.size });
      
      const validation = await validateFile(file);
      
      if (!validation.valid) {
        logger.warn('File validation failed', {
          fileName: file.name,
          errors: validation.errors,
        });
        
        validation.errors.forEach(error => {
          toast.error(error.message);
        });
        return;
      }
      
      // 2. Get auth token (auto-refreshes if needed)
      const token = await tokenManager.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // 3. Upload file (CSRF is auto-injected)
      const formData = new FormData();
      formData.append('image', file, validation.sanitizedFilename);
      
      logger.info('Uploading file', { fileName: validation.sanitizedFilename });
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // CSRF token auto-injected if using createCSRFProtectedFetch
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      logger.info('File uploaded successfully', {
        fileName: data.file.filename,
        url: data.file.path,
      });
      
      toast.success('File uploaded successfully');
      
    } catch (error) {
      logger.error('Upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
      });
      
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }
  
  return (
    // ... component JSX
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# File Upload
VITE_MAX_IMAGE_SIZE=5242880              # 5MB
VITE_MAX_IMAGES_PER_PRODUCT=10           # Max 10 images

# CSRF
VITE_CSRF_TOKEN_EXPIRY=3600000           # 1 hour
VITE_CSRF_PROTECTION=true                # Enable/disable

# Auth Tokens
# No config needed - uses defaults

# Logging
LOG_LEVEL=debug                          # debug, info, warn, error
VITE_SENTRY_DSN=https://...              # For production monitoring
```

### Security Best Practices

1. **Always validate files** - Both client and server side
2. **Use CSRF protection** - For all state-changing requests
3. **Use token manager** - Don't manage tokens manually
4. **Log important events** - But not sensitive data
5. **Handle errors gracefully** - Never crash the app
6. **Test security features** - Don't skip tests

---

## 🐛 Troubleshooting

### File Upload Fails

```typescript
// Check validation errors
const result = await validateFile(file);
console.log('Validation:', result);

// Common issues:
// - File too large (> 5MB)
// - Wrong file type (not jpg/png/webp)
// - File type spoofing (wrong magic numbers)
```

### CSRF Errors

```typescript
// Check if CSRF is initialized
import { getCSRFToken } from '@/lib/security/csrf';

const token = getCSRFToken();
console.log('CSRF Token:', token);

// Common issues:
// - Token not initialized on app start
// - Cookie blocked by browser
// - Token expired (> 1 hour old)
```

### Token Refresh Fails

```typescript
// Check token status
import { getTokenData } from '@/lib/security/auth-token-manager';

const tokenData = getTokenData();
console.log('Token data:', tokenData);

// Common issues:
// - Refresh token expired/invalid
// - Network error
// - Server endpoint not configured
```

---

## 📚 Additional Resources

- **Full Implementation Plan:** `docs/ADMIN_PRODUCTION_READY_PLAN.md`
- **Code Review:** `docs/BRUTAL_ADMIN_CODE_REVIEW.md`
- **Phase 1 Progress:** `docs/PHASE1_STATUS_EXTENDED.md`
- **Test Suite:** `tests/unit/validation/file-validation.test.ts`

---

**Last Updated:** November 28, 2025  
**Maintained By:** Engineering Team  
**Support:** See documentation or ask in #engineering-help
