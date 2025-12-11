/**
 * Reviews API Handlers
 * 
 * RESTful API endpoints for product reviews and ratings.
 * Handles listing, creating, updating, deleting reviews and voting.
 * 
 * @module server/reviews
 */

import type { Request, Response } from "express";
import { SupabaseReviewsRepository } from "./db/repositories/supabase-reviews";
import { insertProductReviewSchema } from "../shared/schema";
import { z } from "zod";

const reviewsRepo = new SupabaseReviewsRepository();

/**
 * List reviews for a product
 * 
 * GET /api/products/:productId/reviews
 * Query: limit, offset
 */
export async function listProductReviewsHandler(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const user = (req as any).user; // Optional user for vote status

    if (!productId) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Product ID is required" 
      });
    }

    const reviews = await reviewsRepo.listByProduct(productId, user?.user_id, limit, offset);
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('[listProductReviewsHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch reviews" 
    });
  }
}

/**
 * List recent reviews across all products
 * 
 * GET /api/reviews/recent
 * Query: limit
 */
export async function listRecentReviewsHandler(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
    
    const reviews = await reviewsRepo.listRecent(limit);
    
    return res.status(200).json(reviews);
  } catch (error) {
    console.error('[listRecentReviewsHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch recent reviews" 
    });
  }
}

/**
 * Get product review statistics
 * 
 * GET /api/products/:productId/reviews/stats
 */
export async function getProductReviewStatsHandler(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Product ID is required" 
      });
    }

    const stats = await reviewsRepo.getProductStats(productId);
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[getProductReviewStatsHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch review stats" 
    });
  }
}

/**
 * Create a new review
 * 
 * POST /api/products/:productId/reviews
 * Body: rating, title, comment, variant_id
 */
export async function createReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Product ID is required" 
      });
    }

    // Validate request body
    const validationResult = insertProductReviewSchema.safeParse({
      ...req.body,
      user_id: user.user_id,
      product_id: productId
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Invalid review data",
        errors: validationResult.error.errors,
      });
    }

    const review = await reviewsRepo.create(validationResult.data);
    
    return res.status(201).json(review);
  } catch (error: any) {
    console.error('[createReviewHandler] Error:', error);
    
    if (error.message === 'User has already reviewed this product') {
      return res.status(409).json({ 
        code: "ALREADY_EXISTS", 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to create review" 
    });
  }
}

/**
 * Update a review
 * 
 * PUT /api/reviews/:id
 * Body: rating, title, comment
 */
export async function updateReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Review ID is required" 
      });
    }

    // Validate request body (partial update)
    const updateSchema = insertProductReviewSchema.partial().omit({ 
      user_id: true, 
      product_id: true,
      verified_purchase: true 
    });
    
    const validationResult = updateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Invalid review data",
        errors: validationResult.error.errors,
      });
    }

    const review = await reviewsRepo.update(id, user.user_id, validationResult.data);
    
    if (!review) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Review not found or access denied" 
      });
    }
    
    return res.status(200).json(review);
  } catch (error) {
    console.error('[updateReviewHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to update review" 
    });
  }
}

/**
 * Delete a review
 * 
 * DELETE /api/reviews/:id
 */
export async function deleteReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Review ID is required" 
      });
    }

    const success = await reviewsRepo.delete(id, user.user_id);
    
    if (!success) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Review not found or access denied" 
      });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[deleteReviewHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to delete review" 
    });
  }
}

/**
 * Vote a review as helpful
 * 
 * POST /api/reviews/:id/vote
 */
export async function voteReviewHelpfulHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Review ID is required" 
      });
    }

    await reviewsRepo.addVote({
      review_id: id,
      user_id: user.user_id
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[voteReviewHelpfulHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to vote" 
    });
  }
}

/**
 * Remove helpful vote
 * 
 * DELETE /api/reviews/:id/vote
 */
export async function removeReviewVoteHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Review ID is required" 
      });
    }

    await reviewsRepo.removeVote(id, user.user_id);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[removeReviewVoteHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to remove vote" 
    });
  }
}
