/**
 * File Validation Utilities
 * 
 * Comprehensive file validation for secure file uploads.
 * Implements OWASP file upload security guidelines.
 * 
 * Features:
 * - File type validation (MIME + extension)
 * - File size limits
 * - Magic number verification
 * - Filename sanitization
 * - Malicious content detection
 * 
 * @module lib/validation/file-validation
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed image MIME types
 * Limited to safe image formats only
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/**
 * Allowed image file extensions
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

/**
 * Maximum file size: 5MB
 * Configurable via environment variable
 */
export const MAX_IMAGE_SIZE = parseInt(
  import.meta.env.VITE_MAX_IMAGE_SIZE || '5242880', // 5MB default
  10
);

/**
 * Maximum number of images per product
 */
export const MAX_IMAGES_PER_PRODUCT = parseInt(
  import.meta.env.VITE_MAX_IMAGES_PER_PRODUCT || '10',
  10
);

/**
 * Magic number signatures for image validation
 * First bytes of valid image files
 */
const MAGIC_NUMBERS: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG/Exif
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG/Canon
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
};

// ============================================================================
// Types
// ============================================================================

export interface FileValidationError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
  sanitizedFilename?: string;
}

export interface FileMetadata {
  originalName: string;
  sanitizedName: string;
  size: number;
  type: string;
  extension: string;
  hash?: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates file type against allowed MIME types
 * 
 * @param file - File to validate
 * @returns True if file type is allowed
 */
export function isValidFileType(file: File): boolean {
  const isValidMime = ALLOWED_IMAGE_TYPES.includes(
    file.type as typeof ALLOWED_IMAGE_TYPES[number]
  );
  
  if (!isValidMime) {
    logger.warn('Invalid file type attempted', {
      fileName: file.name,
      fileType: file.type,
      allowedTypes: ALLOWED_IMAGE_TYPES,
    });
  }
  
  return isValidMime;
}

/**
 * Validates file extension
 * 
 * @param filename - Filename to validate
 * @returns True if extension is allowed
 */
export function isValidFileExtension(filename: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  
  const isValid = ALLOWED_IMAGE_EXTENSIONS.some(
    ext => ext === extension
  );
  
  if (!isValid) {
    logger.warn('Invalid file extension attempted', {
      fileName: filename,
      extension,
      allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
    });
  }
  
  return isValid;
}

/**
 * Validates file size
 * 
 * @param file - File to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is within limit
 */
export function isValidFileSize(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): boolean {
  const isValid = file.size > 0 && file.size <= maxSize;
  
  if (!isValid) {
    logger.warn('Invalid file size attempted', {
      fileName: file.name,
      fileSize: file.size,
      maxSize,
    });
  }
  
  return isValid;
}

/**
 * Validates file magic numbers (file signature)
 * Reads the first bytes of the file to verify it's actually an image
 * This prevents attackers from renaming malicious files
 * 
 * @param file - File to validate
 * @returns Promise<boolean> True if magic numbers match expected type
 */
export async function validateMagicNumbers(file: File): Promise<boolean> {
  try {
    // Read first 8 bytes (enough for all image types)
    const headerSize = 8;
    const buffer = await file.slice(0, headerSize).arrayBuffer();
    const header = new Uint8Array(buffer);
    
    // Get expected magic numbers for this MIME type
    const expectedSignatures = MAGIC_NUMBERS[file.type];
    
    if (!expectedSignatures) {
      logger.error('Unknown MIME type for magic number validation', {
        fileName: file.name,
        mimeType: file.type,
      });
      return false;
    }
    
    // Check if file header matches any expected signature
    const isValid = expectedSignatures.some(signature =>
      matchesSignature(header, signature)
    );
    
    if (!isValid) {
      logger.warn('Magic number mismatch - possible file type spoofing', {
        fileName: file.name,
        declaredType: file.type,
        actualHeader: Array.from(header.slice(0, 4)),
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Error validating magic numbers', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Helper function to match byte array against signature
 * 
 * @param header - File header bytes
 * @param signature - Expected signature bytes
 * @returns True if header matches signature
 */
function matchesSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) {
    return false;
  }
  
  return signature.every((byte, index) => header[index] === byte);
}

/**
 * Sanitizes filename to prevent path traversal and injection attacks
 * 
 * Rules:
 * - Remove path separators (/, \)
 * - Remove special characters
 * - Limit length
 * - Keep only alphanumeric, dash, underscore, and extension
 * 
 * @param filename - Original filename
 * @param maxLength - Maximum filename length (default: 100)
 * @returns Sanitized filename
 */
export function sanitizeFilename(
  filename: string,
  maxLength: number = 100
): string {
  // Get extension first
  const extension = getFileExtension(filename).toLowerCase();
  
  // Remove extension from name
  let name = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  // Remove path separators and dangerous characters
  name = name.replace(/[\/\\]/g, '');
  
  // Replace special characters with underscores
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove consecutive underscores
  name = name.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores and dots
  name = name.replace(/^[._-]+|[._-]+$/g, '');
  
  // Ensure name is not empty
  if (!name || name.length === 0) {
    name = 'file';
  }
  
  // Limit length (reserve space for extension)
  const maxNameLength = maxLength - extension.length;
  if (name.length > maxNameLength) {
    name = name.substring(0, maxNameLength);
  }
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  name = `${name}_${timestamp}`;
  
  const sanitized = `${name}${extension}`;
  
  logger.debug('Filename sanitized', {
    original: filename,
    sanitized,
  });
  
  return sanitized;
}

/**
 * Gets file extension including the dot
 * 
 * @param filename - Filename
 * @returns File extension with dot (e.g., ".jpg")
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Comprehensive file validation
 * Performs all security checks
 * 
 * @param file - File to validate
 * @returns Validation result with errors if any
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const errors: FileValidationError[] = [];
  
  logger.info('Starting file validation', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });
  
  // 1. Check file type
  if (!isValidFileType(file)) {
    errors.push({
      code: 'INVALID_FILE_TYPE',
      message: `File type "${file.type}" is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      field: 'type',
      details: {
        type: file.type,
        allowedTypes: ALLOWED_IMAGE_TYPES,
      },
    });
  }
  
  // 2. Check file extension
  if (!isValidFileExtension(file.name)) {
    const extension = getFileExtension(file.name);
    errors.push({
      code: 'INVALID_FILE_EXTENSION',
      message: `File extension "${extension}" is not allowed. Allowed extensions: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
      field: 'extension',
      details: {
        extension,
        allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
      },
    });
  }
  
  // 3. Check file size
  if (!isValidFileSize(file)) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_IMAGE_SIZE)})`,
      field: 'size',
      details: {
        size: file.size,
        maxSize: MAX_IMAGE_SIZE,
      },
    });
  }
  
  // 4. Validate magic numbers (only if type and extension are valid)
  if (errors.length === 0) {
    const isMagicNumberValid = await validateMagicNumbers(file);
    
    if (!isMagicNumberValid) {
      errors.push({
        code: 'INVALID_FILE_CONTENT',
        message: 'File content does not match declared type. Possible file type spoofing.',
        field: 'content',
        details: {
          declaredType: file.type,
        },
      });
    }
  }
  
  // Generate sanitized filename
  const sanitizedFilename = errors.length === 0 
    ? sanitizeFilename(file.name)
    : undefined;
  
  const result: FileValidationResult = {
    valid: errors.length === 0,
    errors,
    sanitizedFilename,
  };
  
  if (result.valid) {
    logger.info('File validation passed', {
      fileName: file.name,
      sanitizedFilename,
    });
  } else {
    logger.warn('File validation failed', {
      fileName: file.name,
      errors: errors.map(e => ({ code: e.code, message: e.message })),
    });
  }
  
  return result;
}

/**
 * Validates multiple files
 * 
 * @param files - Array of files to validate
 * @param maxFiles - Maximum number of files allowed
 * @returns Validation results for all files
 */
export async function validateFiles(
  files: File[],
  maxFiles: number = MAX_IMAGES_PER_PRODUCT
): Promise<FileValidationResult[]> {
  // Check total count
  if (files.length > maxFiles) {
    logger.warn('Too many files uploaded', {
      count: files.length,
      maxFiles,
    });
    
    // Return single error for all files
    const error: FileValidationError = {
      code: 'TOO_MANY_FILES',
      message: `Cannot upload more than ${maxFiles} files at once`,
      details: {
        count: files.length,
        maxFiles,
      },
    };
    
    return [{ valid: false, errors: [error] }];
  }
  
  // Validate each file
  const results = await Promise.all(
    files.map(file => validateFile(file))
  );
  
  return results;
}

/**
 * Extracts file metadata
 * 
 * @param file - File to extract metadata from
 * @param sanitizedName - Sanitized filename
 * @returns File metadata
 */
export function extractFileMetadata(
  file: File,
  sanitizedName?: string
): FileMetadata {
  return {
    originalName: file.name,
    sanitizedName: sanitizedName || sanitizeFilename(file.name),
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
  };
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Creates a preview URL for a file
 * IMPORTANT: Caller must revoke URL when done to prevent memory leaks
 * 
 * @param file - File to create preview for
 * @returns Object URL for preview
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to prevent memory leaks
 * 
 * @param url - URL to revoke
 */
export function revokeFilePreview(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Error revoking object URL', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
