/**
 * Image Processing Service
 * Handles image optimization, resizing, and format conversion
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

// Configuration for image variants
export const IMAGE_VARIANTS = {
  thumbnail: { width: 200, height: 200, fit: 'cover' as const },
  medium: { width: 800, height: 800, fit: 'inside' as const },
  large: { width: 1200, height: 1200, fit: 'inside' as const },
};

export interface OptimizedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  blurDataUrl?: string; // For placeholder
}

/**
 * Image Processing Service Class
 */
export class ImageProcessingService {
  private uploadDir: string;
  private publicPath: string;

  constructor() {
    // Define upload directory (local storage for now)
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.publicPath = '/uploads';
  }

  /**
   * Ensure upload directory exists
   */
  async init() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process an uploaded image
   * Generates variants and converts to WebP
   */
  async processImage(buffer: Buffer, originalFilename: string): Promise<OptimizedImage> {
    await this.init();

    const id = randomUUID();
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    
    // Base filename for this image set
    const fileId = `${id}-${basename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    // 1. Save original (optimized JPEG/PNG)
    const originalPath = path.join(this.uploadDir, `${fileId}-original${ext}`);
    await fs.writeFile(originalPath, buffer);

    // 2. Generate WebP variants
    const tasks = Object.entries(IMAGE_VARIANTS).map(async ([variant, config]) => {
      const filename = `${fileId}-${variant}.webp`;
      const filepath = path.join(this.uploadDir, filename);

      await sharp(buffer)
        .resize(config.width, config.height, {
          fit: config.fit,
          withoutEnlargement: true,
        })
        .webp({ quality: 80 }) // 80% quality is good balance
        .toFile(filepath);

      return { variant, filename };
    });

    // 3. Generate tiny blur placeholder (base64)
    const blurTask = sharp(buffer)
      .resize(20, 20, { fit: 'inside' })
      .toBuffer()
      .then(data => `data:image/jpeg;base64,${data.toString('base64')}`);

    // Wait for all tasks
    const results = await Promise.all(tasks);
    const blurDataUrl = await blurTask;

    // Construct response object
    const optimized: any = {
      original: `${this.publicPath}/${fileId}-original${ext}`,
      blurDataUrl,
    };

    results.forEach(({ variant, filename }) => {
      optimized[variant] = `${this.publicPath}/${filename}`;
    });

    return optimized as OptimizedImage;
  }

  /**
   * Delete image and its variants
   */
  async deleteImage(imagePath: string) {
    // Extract fileId from path
    // Example: /uploads/uuid-name-variant.webp
    const filename = path.basename(imagePath);
    // This is a simplified deletion logic - in production we'd track all files in DB
    // For now, we'll just try to delete the specific file requested
    try {
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error(`Failed to delete image: ${imagePath}`, error);
    }
  }
}

// Singleton instance
export const imageService = new ImageProcessingService();
