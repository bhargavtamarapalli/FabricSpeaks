/**
 * Cloudinary Service - Image optimization and CDN delivery
 * @module services/cloudinary
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Cloudinary configuration interface
 */
interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}

/**
 * Image transformation options
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';
  quality?: number | 'auto';
  format?: 'jpg' | 'png' | 'webp' | 'avif' | 'auto';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
}

/**
 * Upload options
 */
export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  overwrite?: boolean;
  transformation?: ImageTransformOptions;
}

/**
 * Cloudinary upload result
 */
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  thumbnailUrl: string;
}

/**
 * Cloudinary Image Service
 * Handles image uploads, transformations, and optimization
 */
export class CloudinaryService {
  private config: CloudinaryConfig;
  private isConfigured = false;

  constructor() {
    this.config = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      folder: process.env.CLOUDINARY_FOLDER || 'fabric-speaks',
    };

    this.initialize();
  }

  /**
   * Initialize Cloudinary configuration
   */
  private initialize(): void {
    if (!this.config.cloudName || !this.config.apiKey || !this.config.apiSecret) {
      console.warn('[CloudinaryService] Cloudinary not configured - image uploads disabled');
      this.isConfigured = false;
      return;
    }

    try {
      cloudinary.config({
        cloud_name: this.config.cloudName,
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        secure: true,
      });

      this.isConfigured = true;
      console.log('[CloudinaryService] Cloudinary initialized successfully');
    } catch (error) {
      console.error('[CloudinaryService] Failed to initialize Cloudinary:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload image from buffer
   * @param buffer - Image buffer
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || this.config.folder,
          public_id: options.publicId,
          tags: options.tags,
          overwrite: options.overwrite ?? false,
          transformation: options.transformation,
          resource_type: 'image',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('[CloudinaryService] Upload error:', error);
            reject(new Error('Failed to upload image to Cloudinary'));
            return;
          }

          resolve(this.formatUploadResult(result));
        }
      );

      const readable = Readable.from(buffer);
      readable.pipe(uploadStream);
    });
  }

  /**
   * Upload image from URL
   * @param url - Image URL
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadFromUrl(
    url: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options.folder || this.config.folder,
        public_id: options.publicId,
        tags: options.tags,
        overwrite: options.overwrite ?? false,
        transformation: options.transformation,
      });

      return this.formatUploadResult(result);
    } catch (error) {
      console.error('[CloudinaryService] Upload from URL error:', error);
      throw new Error('Failed to upload image from URL');
    }
  }

  /**
   * Upload multiple images
   * @param buffers - Array of image buffers
   * @param options - Upload options
   * @returns Array of upload results
   */
  async uploadMultiple(
    buffers: Buffer[],
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = buffers.map((buffer, index) =>
      this.uploadFromBuffer(buffer, {
        ...options,
        publicId: options.publicId ? `${options.publicId}_${index}` : undefined,
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete image by public ID
   * @param publicId - Cloudinary public ID
   * @returns Success status
   */
  async delete(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('[CloudinaryService] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple images
   * @param publicIds - Array of public IDs
   * @returns Success status
   */
  async deleteMultiple(publicIds: string[]): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result.deleted && Object.keys(result.deleted).length === publicIds.length;
    } catch (error) {
      console.error('[CloudinaryService] Delete multiple error:', error);
      return false;
    }
  }

  /**
   * Generate optimized image URL with transformations
   * @param publicId - Cloudinary public ID
   * @param options - Transformation options
   * @returns Optimized image URL
   */
  generateUrl(publicId: string, options: ImageTransformOptions = {}): string {
    if (!this.isConfigured) {
      return publicId; // Return original if not configured
    }

    const transformation = {
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
      ...(options.width && { width: options.width }),
      ...(options.height && { height: options.height }),
      ...(options.crop && { crop: options.crop }),
      ...(options.gravity && { gravity: options.gravity }),
    };

    return cloudinary.url(publicId, {
      secure: true,
      transformation,
    });
  }

  /**
   * Generate responsive image srcset
   * @param publicId - Cloudinary public ID
   * @param widths - Array of widths for srcset
   * @returns Srcset string
   */
  generateSrcSet(publicId: string, widths: number[] = [320, 640, 768, 1024, 1280, 1920]): string {
    if (!this.isConfigured) {
      return '';
    }

    return widths
      .map((width) => {
        const url = this.generateUrl(publicId, { width, format: 'auto', quality: 'auto' });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Generate thumbnail URL
   * @param publicId - Cloudinary public ID
   * @param size - Thumbnail size
   * @returns Thumbnail URL
   */
  generateThumbnail(publicId: string, size: number = 200): string {
    return this.generateUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      gravity: 'auto',
    });
  }

  /**
   * Format upload result to standard interface
   */
  private formatUploadResult(result: UploadApiResponse): CloudinaryUploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      thumbnailUrl: this.generateThumbnail(result.public_id),
    };
  }

  /**
   * Get image metadata
   * @param publicId - Cloudinary public ID
   * @returns Image metadata
   */
  async getMetadata(publicId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('[CloudinaryService] Get metadata error:', error);
      throw new Error('Failed to get image metadata');
    }
  }
}

// Singleton instance
let cloudinaryInstance: CloudinaryService | null = null;

/**
 * Get Cloudinary service instance
 */
export function getCloudinaryService(): CloudinaryService {
  if (!cloudinaryInstance) {
    cloudinaryInstance = new CloudinaryService();
  }
  return cloudinaryInstance;
}
