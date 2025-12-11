/**
 * Image Upload API
 * Handles image uploads and optimization
 */

import type { Request, Response } from "express";
import multer from "multer";
import { imageService } from "./services/image-processing";

// Configure multer for memory storage (we process buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export const uploadMiddleware = upload.single("image");

/**
 * Handle image upload
 * POST /api/upload
 */
export async function uploadImageHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: "NO_FILE",
        message: "No image file provided",
      });
    }

    // Process image
    const optimized = await imageService.processImage(req.file.buffer, req.file.originalname);

    return res.status(200).json({
      message: "Image uploaded and optimized successfully",
      image: optimized,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      code: "UPLOAD_ERROR",
      message: "Failed to process image upload",
    });
  }
}
