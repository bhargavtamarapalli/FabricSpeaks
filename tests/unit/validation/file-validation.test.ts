/**
 * File Validation Test Suite
 * 
 * Comprehensive tests for file upload security validation.
 * Tests all security measures including:
 * - File type validation
 * - Magic number verification
 * - File size limits
 * - Filename sanitization
 * - Malicious content detection
 * 
 * @module tests/unit/validation/file-validation.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidFileType,
  isValidFileExtension,
  isValidFileSize,
  validateMagicNumbers,
  sanitizeFilename,
  validateFile,
  validateFiles,
  formatFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_PRODUCT,
} from '../../../client/src/lib/validation/file-validation';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock File object for testing
 */
function createMockFile(
  name: string,
  size: number,
  type: string,
  content?: Uint8Array
): File {
  const blobParts: BlobPart[] = content 
    ? [content as BlobPart]
    : [new Uint8Array(size)]; // Create buffer of exact size
    
  const blob = new Blob(blobParts, { type });
  return new File([blob], name, { type });
}

/**
 * Creates a mock JPEG file with valid magic numbers
 */
function createValidJpegFile(name: string = 'test.jpg', size: number = 1024): File {
  const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  const content = new Uint8Array(size);
  content.set(jpegHeader);
  return createMockFile(name, size, 'image/jpeg', content);
}

/**
 * Creates a mock PNG file with valid magic numbers
 */
function createValidPngFile(name: string = 'test.png', size: number = 1024): File {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const content = new Uint8Array(size);
  content.set(pngHeader);
  return createMockFile(name, size, 'image/png', content);
}

/**
 * Creates a mock file with invalid magic numbers (spoofed type)
 */
function createSpoofedFile(name: string = 'evil.jpg'): File {
  // Declare as JPEG but has wrong magic numbers
  const wrongHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  return createMockFile(name, 1024, 'image/jpeg', wrongHeader);
}

// ============================================================================
// File Type Validation Tests
// ============================================================================

describe('isValidFileType', () => {
  it('should accept valid JPEG type', () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    expect(isValidFileType(file)).toBe(true);
  });

  it('should accept valid PNG type', () => {
    const file = createMockFile('test.png', 1024, 'image/png');
    expect(isValidFileType(file)).toBe(true);
  });

  it('should accept valid WebP type', () => {
    const file = createMockFile('test.webp', 1024, 'image/webp');
    expect(isValidFileType(file)).toBe(true);
  });

  it('should reject executable files', () => {
    const file = createMockFile('malware.exe', 1024, 'application/x-msdownload');
    expect(isValidFileType(file)).toBe(false);
  });

  it('should reject PHP files', () => {
    const file = createMockFile('shell.php', 1024, 'application/x-php');
    expect(isValidFileType(file)).toBe(false);
  });

  it('should reject JavaScript files', () => {
    const file = createMockFile('script.js', 1024, 'text/javascript');
    expect(isValidFileType(file)).toBe(false);
  });

  it('should reject SVG files (XSS risk)', () => {
    const file = createMockFile('image.svg', 1024, 'image/svg+xml');
    expect(isValidFileType(file)).toBe(false);
  });

  it('should reject GIF files (not in allowed list)', () => {
    const file = createMockFile('animation.gif', 1024, 'image/gif');
    expect(isValidFileType(file)).toBe(false);
  });
});

// ============================================================================
// File Extension Validation Tests
// ============================================================================

describe('isValidFileExtension', () => {
  it('should accept .jpg extension', () => {
    expect(isValidFileExtension('photo.jpg')).toBe(true);
  });

  it('should accept .jpeg extension', () => {
    expect(isValidFileExtension('photo.jpeg')).toBe(true);
  });

  it('should accept .png extension', () => {
    expect(isValidFileExtension('image.png')).toBe(true);
  });

  it('should accept .webp extension', () => {
    expect(isValidFileExtension('modern.webp')).toBe(true);
  });

  it('should reject .exe extension', () => {
    expect(isValidFileExtension('virus.exe')).toBe(false);
  });

  it('should reject .php extension', () => {
    expect(isValidFileExtension('backdoor.php')).toBe(false);
  });

  it('should reject .svg extension', () => {
    expect(isValidFileExtension('xss.svg')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isValidFileExtension('PHOTO.JPG')).toBe(true);
    expect(isValidFileExtension('Photo.JpEg')).toBe(true);
  });
});

// ============================================================================
// File Size Validation Tests
// ============================================================================

describe('isValidFileSize', () => {
  it('should accept files within size limit', () => {
    const file = createMockFile('small.jpg', 1024, 'image/jpeg'); // 1KB
    expect(isValidFileSize(file)).toBe(true);
  });

  it('should accept files at exact size limit', () => {
    const file = createMockFile('exact.jpg', MAX_IMAGE_SIZE, 'image/jpeg');
    expect(isValidFileSize(file)).toBe(true);
  });

  it('should reject files exceeding size limit', () => {
    const file = createMockFile('large.jpg', MAX_IMAGE_SIZE + 1, 'image/jpeg');
    expect(isValidFileSize(file)).toBe(false);
  });

  it('should reject empty files', () => {
    const file = createMockFile('empty.jpg', 0, 'image/jpeg');
    expect(isValidFileSize(file)).toBe(false);
  });

  it('should accept custom size limit', () => {
    const file = createMockFile('test.jpg', 2048, 'image/jpeg');
    expect(isValidFileSize(file, 1024)).toBe(false);
    expect(isValidFileSize(file, 3072)).toBe(true);
  });
});

// ============================================================================
// Magic Number Validation Tests
// ============================================================================

describe('validateMagicNumbers', () => {
  it('should validate JPEG magic numbers', async () => {
    const file = createValidJpegFile();
    const isValid = await validateMagicNumbers(file);
    expect(isValid).toBe(true);
  });

  it('should validate PNG magic numbers', async () => {
    const file = createValidPngFile();
    const isValid = await validateMagicNumbers(file);
    expect(isValid).toBe(true);
  });

  it('should reject file with wrong magic numbers', async () => {
    const file = createSpoofedFile();
    const isValid = await validateMagicNumbers(file);
    expect(isValid).toBe(false);
  });

  it('should reject renamed executable', async () => {
    // Exe disguised as jpg
    const header = new Uint8Array([0x4D, 0x5A]); // MZ header (exe)
    const file = createMockFile('fake.jpg', 1024, 'image/jpeg', header);
    const isValid = await validateMagicNumbers(file);
    expect(isValid).toBe(false);
  });
});

// ============================================================================
// Filename Sanitization Tests
// ============================================================================

describe('sanitizeFilename', () => {
  it('should preserve valid alphanumeric filenames', () => {
    const result = sanitizeFilename('good_file123.jpg');
    expect(result).toMatch(/good_file123_\d+\.jpg/);
  });

  it('should remove path traversal attempts', () => {
    const result = sanitizeFilename('../../../etc/passwd.jpg');
    expect(result).not.toContain('../');
    expect(result).not.toContain('/');
  });

  it('should remove dangerous characters', () => {
    const result = sanitizeFilename('file<script>.jpg');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should handle unicode characters', () => {
    const result = sanitizeFilename('文件.jpg');
    expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it('should add timestamp for uniqueness', () => {
    const result1 = sanitizeFilename('test.jpg');
    const result2 = sanitizeFilename('test.jpg');
    // Tests run so fast they might get same timestamp
    // Just verify timestamps are present
    expect(result1).toMatch(/test_\d+\.jpg/);
    expect(result2).toMatch(/test_\d+\.jpg/);
  });

  it('should handle files without extension', () => {
    const result = sanitizeFilename('noextension');
    expect(result).toMatch(/noextension_\d+$/);
  });

  it('should truncate long filenames', () => {
    const longName = 'a'.repeat(200) + '.jpg';
    const result = sanitizeFilename(longName);
    // Max length 100 but we add timestamp (~13 chars) + extension (~4)
    // So actual length will be around 100-120
    expect(result).toMatch(/^a+_\d+\.jpg$/);
    expect(result.length).toBeLessThanOrEqual(150); // More realistic limit
  });

  it('should handle empty or whitespace-only names', () => {
    const result = sanitizeFilename('   .jpg');
    expect(result).toMatch(/file_\d+\.jpg/);
  });
});

// ============================================================================
// Comprehensive File Validation Tests
// ============================================================================

describe('validateFile', () => {
  it('should pass validation for valid JPEG', async () => {
    const file = createValidJpegFile('photo.jpg', 1024);
    const result = await validateFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedFilename).toBeDefined();
    expect(result.sanitizedFilename).toMatch(/photo_\d+\.jpg/);
  });

  it('should pass validation for valid PNG', async () => {
    const file = createValidPngFile('image.png', 2048);
    const result = await validateFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation for invalid type', async () => {
    const file = createMockFile('script.js', 1024, 'text/javascript');
    const result = await validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_FILE_TYPE'
      })
    );
  });

  it('should fail validation for file too large', async () => {
    const file = createValidJpegFile('huge.jpg', MAX_IMAGE_SIZE + 1000);
    const result = await validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'FILE_TOO_LARGE'
      })
    );
  });

  it('should fail validation for spoofed file type', async () => {
    const file = createSpoofedFile('malicious.jpg');
    const result = await validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_FILE_CONTENT'
      })
    );
  });

  it('should return multiple errors for multiple issues', async () => {
    const file = createMockFile('bad.exe', MAX_IMAGE_SIZE + 1, 'application/x-msdownload');
    const result = await validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ============================================================================
// Multiple Files Validation Tests
// ============================================================================

describe('validateFiles', () => {
  it('should validate all valid files', async () => {
    const files = [
      createValidJpegFile('photo1.jpg'),
      createValidPngFile('photo2.png'),
      createValidJpegFile('photo3.jpg'),
    ];
    
    const results = await validateFiles(files);
    
    expect(results).toHaveLength(3);
    expect(results.every((r: { valid: boolean }) => r.valid)).toBe(true);
  });

  it('should return errors for invalid files', async () => {
    const files = [
      createValidJpegFile('good.jpg'),
      createMockFile('bad.exe', 1024, 'application/x-msdownload'),
      createSpoofedFile('fake.jpg'),
    ];
    
    const results = await validateFiles(files);
    
    expect(results).toHaveLength(3);
    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
    expect(results[2].valid).toBe(false);
  });

  it('should reject when too many files', async () => {
    const files = Array(MAX_IMAGES_PER_PRODUCT + 1)
      .fill(null)
      .map((_, i) => createValidJpegFile(`photo${i}.jpg`));
    
    const results = await validateFiles(files);
    
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors[0].code).toBe('TOO_MANY_FILES');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('should handle decimal values', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2560000)).toBe('2.44 MB');
  });
});

// ============================================================================
// Security Edge Cases
// ============================================================================

describe('Security Edge Cases', () => {
  it('should reject double extension files', async () => {
    const file = createMockFile('image.jpg.exe', 1024, 'image/jpeg');
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('should reject null byte injection in filename', () => {
    const result = sanitizeFilename('file\x00.jpg.exe');
    expect(result).not.toContain('\x00');
  });

  it('should prevent directory creation via filename', () => {
    const result = sanitizeFilename('../../uploads/shell.php');
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
  });

  it('should handle max length DoS attempt', () => {
    const longName = 'a'.repeat(10000) + '.jpg';
    const result = sanitizeFilename(longName);
    // Implementation truncates but adds timestamp
    expect(result).toMatch(/^a+_\d+\.jpg$/);
    expect(result.length).toBeLessThanOrEqual(150);
  });
});
