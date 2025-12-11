/**
 * Reviews Repository
 * 
 * Handles all database operations for product reviews and helpful votes.
 * Implements repository pattern for clean separation of concerns.
 * 
 * @module server/db/repositories/supabase-reviews
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../supabase";
import {
  productReviews,
  reviewHelpfulVotes,
  orders,
  orderItems,
  users,
  type ProductReview,
  type InsertProductReview,
  type InsertReviewHelpfulVote,
} from "../../../shared/schema";

/**
 * Extended review with user vote status
 */
export interface ReviewWithUserVote extends ProductReview {
  user_has_voted: boolean;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Repository interface for review operations
 */
export interface ReviewsRepository {
  // Review operations
  listByProduct(productId: string, userId?: string, limit?: number, offset?: number): Promise<ReviewWithUserVote[]>;
  listRecent(limit?: number): Promise<ReviewWithUserVote[]>;
  getById(id: string): Promise<ProductReview | undefined>;
  create(review: InsertProductReview): Promise<ProductReview>;
  update(id: string, userId: string, updates: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  
  // Vote operations
  addVote(vote: InsertReviewHelpfulVote): Promise<boolean>;
  removeVote(reviewId: string, userId: string): Promise<boolean>;
  
  // Stats & Verification
  getProductStats(productId: string): Promise<ReviewStats>;
  hasPurchasedProduct(userId: string, productId: string): Promise<boolean>;
  hasReviewedProduct(userId: string, productId: string): Promise<boolean>;
}

/**
 * Supabase implementation of ReviewsRepository
 */
export class SupabaseReviewsRepository implements ReviewsRepository {
  /**
   * List reviews for a product with pagination and user vote status
   */
  async listByProduct(
    productId: string, 
    userId?: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<ReviewWithUserVote[]> {
    try {
      const result = await db
        .select({
            review: productReviews,
            user: {
                user_id: users.user_id,
                full_name: users.full_name,
                username: users.username
            }
        })
        .from(productReviews)
        .leftJoin(users, eq(productReviews.user_id, users.user_id))
        .where(eq(productReviews.product_id, productId))
        .orderBy(desc(productReviews.created_at))
        .limit(limit)
        .offset(offset);

      // If user is logged in, check which reviews they voted on
      let userVotes: Set<string> = new Set();
      if (userId && result.length > 0) {
        const votes = await db
          .select({ review_id: reviewHelpfulVotes.review_id })
          .from(reviewHelpfulVotes)
          .where(and(
            eq(reviewHelpfulVotes.user_id, userId),
            sql`${reviewHelpfulVotes.review_id} IN ${result.map((r: any) => r.review.id)}`
          ));
        
        userVotes = new Set(votes.map((v: { review_id: string }) => v.review_id));
      }

      return result.map((row: any) => ({
        ...row.review,
        user: row.user,
        user_has_voted: userVotes.has(row.review.id)
      }));
    } catch (error) {
      console.error('[ReviewsRepository] Error listing reviews:', error);
      throw new Error('Failed to fetch reviews');
    }
  }

  /**
   * List recent reviews across all products
   */
  async listRecent(limit: number = 3): Promise<ReviewWithUserVote[]> {
    try {
      const result = await db
        .select({
            review: productReviews,
            user: {
                user_id: users.user_id,
                full_name: users.full_name,
                username: users.username
            }
        })
        .from(productReviews)
        .leftJoin(users, eq(productReviews.user_id, users.user_id))
        .orderBy(desc(productReviews.created_at))
        .limit(limit);

      return result.map((row: any) => ({
        ...row.review,
        user: row.user,
        user_has_voted: false // Not relevant for public display
      }));
    } catch (error) {
      console.error('[ReviewsRepository] Error listing recent reviews:', error);
      throw new Error('Failed to fetch recent reviews');
    }
  }

  /**
   * Get a specific review by ID
   */
  async getById(id: string): Promise<ProductReview | undefined> {
    try {
      const result = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('[ReviewsRepository] Error getting review:', error);
      throw new Error('Failed to fetch review');
    }
  }

  /**
   * Create a new review
   */
  async create(review: InsertProductReview): Promise<ProductReview> {
    try {
      // Check if user already reviewed this product
      const existing = await this.hasReviewedProduct(review.user_id, review.product_id);
      if (existing) {
        throw new Error('User has already reviewed this product');
      }

      // Check for verified purchase
      const isVerified = await this.hasPurchasedProduct(review.user_id, review.product_id);
      
      const result = await db
        .insert(productReviews)
        .values({
          ...review,
          verified_purchase: isVerified
        })
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create review');
      }
      
      return result[0];
    } catch (error) {
      console.error('[ReviewsRepository] Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update a review (with user ownership check)
   */
  async update(
    id: string,
    userId: string,
    updates: Partial<InsertProductReview>
  ): Promise<ProductReview | undefined> {
    try {
      const result = await db
        .update(productReviews)
        .set(updates)
        .where(and(eq(productReviews.id, id), eq(productReviews.user_id, userId)))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('[ReviewsRepository] Error updating review:', error);
      throw new Error('Failed to update review');
    }
  }

  /**
   * Delete a review (with user ownership check)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(productReviews)
        .where(and(eq(productReviews.id, id), eq(productReviews.user_id, userId)));
      
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('[ReviewsRepository] Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }

  /**
   * Add a helpful vote
   */
  async addVote(vote: InsertReviewHelpfulVote): Promise<boolean> {
    try {
      await db
        .insert(reviewHelpfulVotes)
        .values(vote)
        .onConflictDoNothing(); // Ignore if already voted
      
      return true;
    } catch (error) {
      console.error('[ReviewsRepository] Error adding vote:', error);
      throw new Error('Failed to add vote');
    }
  }

  /**
   * Remove a helpful vote
   */
  async removeVote(reviewId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(reviewHelpfulVotes)
        .where(and(
          eq(reviewHelpfulVotes.review_id, reviewId),
          eq(reviewHelpfulVotes.user_id, userId)
        ));
      
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('[ReviewsRepository] Error removing vote:', error);
      throw new Error('Failed to remove vote');
    }
  }

  /**
   * Get product review statistics
   */
  async getProductStats(productId: string): Promise<ReviewStats> {
    try {
      const stats = await db
        .select({
          count: sql<number>`count(*)`,
          avg: sql<number>`avg(rating)`,
          rating: productReviews.rating
        })
        .from(productReviews)
        .where(eq(productReviews.product_id, productId))
        .groupBy(productReviews.rating);

      const totalReviews = stats.reduce((sum: number, s: any) => sum + Number(s.count), 0);
      
      // Calculate weighted average
      const sumRating = stats.reduce((sum: number, s: any) => sum + (Number(s.rating) * Number(s.count)), 0);
      const averageRating = totalReviews > 0 ? sumRating / totalReviews : 0;

      const distribution = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      stats.forEach((s: any) => {
        if (s.rating >= 1 && s.rating <= 5) {
          distribution[s.rating as keyof typeof distribution] = Number(s.count);
        }
      });

      return {
        average_rating: Number(averageRating.toFixed(1)),
        total_reviews: totalReviews,
        rating_distribution: distribution
      };
    } catch (error) {
      console.error('[ReviewsRepository] Error getting stats:', error);
      throw new Error('Failed to fetch review stats');
    }
  }

  /**
   * Check if user has purchased the product
   */
  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      const result = await db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.order_id))
        .where(and(
          eq(orders.user_id, userId),
          eq(orderItems.product_id, productId),
          eq(orders.status, 'delivered') // Only count delivered orders
        ))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('[ReviewsRepository] Error checking purchase:', error);
      return false;
    }
  }

  /**
   * Check if user has already reviewed the product
   */
  async hasReviewedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      const result = await db
        .select({ id: productReviews.id })
        .from(productReviews)
        .where(and(
          eq(productReviews.user_id, userId),
          eq(productReviews.product_id, productId)
        ))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('[ReviewsRepository] Error checking existing review:', error);
      return false;
    }
  }
}
