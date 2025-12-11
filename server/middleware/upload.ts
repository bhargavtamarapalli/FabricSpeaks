/**
 * Image Upload Middleware - Handles file uploads with Cloudinary
 * @module middleware/upload
 */

import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getCloudinaryService } from '../services/cloudinary';

/**
 * File size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
};

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * File filter for images
 */
function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
}

/**
 * Multer configuration for memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE,
    files: 10, // Max 10 files per request
  },
  fileFilter: imageFileFilter,
});

/**
 * Single image upload middleware
 */
export const uploadSingleImage = upload.single('image');

/**
 * Multiple images upload middleware
 */
export const uploadMultipleImages = upload.array('images', 10);

/**
 * CSV file upload middleware for bulk imports
 */
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export const uploadCSV = csvUpload.single('file');


/**
 * Process uploaded image and upload to Cloudinary
 */
export async function processImageUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const file = req.file;
    
    if (!file) {
      return next();
    }

    const cloudinary = getCloudinaryService();

    if (!cloudinary.isReady()) {
      // Fallback: Store locally or skip
      console.warn('[ImageUpload] Cloudinary not configured, skipping upload');
      return next();
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploadFromBuffer(file.buffer, {
      folder: 'products',
      tags: ['product-image'],
    });

    // Attach Cloudinary result to request
    (req as any).uploadedImage = {
      url: result.secureUrl,
      publicId: result.publicId,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      format: result.format,
    };

    next();
  } catch (error) {
    console.error('[ImageUpload] Error processing image:', error);
    res.status(500).json({
      code: 'UPLOAD_ERROR',
      message: error instanceof Error ? error.message : 'Failed to upload image',
    });
  }
}

/**
 * Process multiple uploaded images
 */
export async function processMultipleImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return next();
    }

    const cloudinary = getCloudinaryService();

    if (!cloudinary.isReady()) {
      console.warn('[ImageUpload] Cloudinary not configured, skipping upload');
      return next();
    }

    // Upload all images
    const uploadPromises = files.map((file) =>
      cloudinary.uploadFromBuffer(file.buffer, {
        folder: 'products',
        tags: ['product-image'],
      })
    );

    const results = await Promise.all(uploadPromises);

    // Attach results to request
    (req as any).uploadedImages = results.map((result) => ({
      url: result.secureUrl,
      publicId: result.publicId,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      format: result.format,
    }));

    next();
  } catch (error) {
    console.error('[ImageUpload] Error processing multiple images:', error);
    res.status(500).json({
      code: 'UPLOAD_ERROR',
      message: error instanceof Error ? error.message : 'Failed to upload images',
    });
  }
}

/**
 * Express error handler for multer errors
 */
export function handleUploadErrors(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds limit of ${FILE_SIZE_LIMITS.IMAGE / 1024 / 1024}MB`,
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 'TOO_MANY_FILES',
        message: 'Too many files uploaded',
      });
    }

    return res.status(400).json({
      code: 'UPLOAD_ERROR',
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      code: 'UPLOAD_ERROR',
      message: error.message || 'Failed to upload file',
    });
  }

  next();
}
