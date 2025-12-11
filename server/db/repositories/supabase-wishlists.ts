/**
 * Wishlist Repository
 * 
 * Handles all database operations for wishlists and wishlist items.
 * Implements repository pattern for clean separation of concerns.
 * 
 * @module server/db/repositories/supabase-wishlists
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../supabase";
import {
  wishlists,
  wishlistItems,
  products,
  productVariants,
  type Wishlist,
  type WishlistItem,
  type InsertWishlist,
  type InsertWishlistItem,
} from "../../../shared/schema";

/**
 * Extended wishlist item with product details
 */
export interface WishlistItemWithProduct extends WishlistItem {
  product: {
    id: string;
    name: string;
    price: string;
    sale_price: string | null;
    images: any;
    stock_quantity: number;
    status: string;
  } | null;
  variant: {
    id: string;
    size: string | null;
    colour: string | null;
    stock_quantity: number;
    price_adjustment: string;
  } | null;
}

/**
 * Extended wishlist with item count
 */
export interface WishlistWithCount extends Wishlist {
  item_count: number;
}

/**
 * Repository interface for wishlist operations
 */
export interface WishlistsRepository {
  // Wishlist operations
  listByUser(userId: string): Promise<WishlistWithCount[]>;
  getById(id: string, userId: string): Promise<Wishlist | undefined>;
  getDefault(userId: string): Promise<Wishlist | undefined>;
  create(wishlist: InsertWishlist): Promise<Wishlist>;
  update(id: string, userId: string, updates: Partial<InsertWishlist>): Promise<Wishlist | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  
  // Wishlist item operations
  listItems(wishlistId: string, userId: string): Promise<WishlistItemWithProduct[]>;
  getItem(id: string, userId: string): Promise<WishlistItem | undefined>;
  addItem(item: InsertWishlistItem, userId: string): Promise<WishlistItem>;
  removeItem(id: string, userId: string): Promise<boolean>;
  isItemInWishlist(wishlistId: string, productId: string, variantId: string | null): Promise<boolean>;
}

/**
 * Supabase implementation of WishlistsRepository
 */
export class SupabaseWishlistsRepository implements WishlistsRepository {
  /**
   * List all wishlists for a user with item counts
   */
  async listByUser(userId: string): Promise<WishlistWithCount[]> {
    try {
      const userWishlists = await db
        .select()
        .from(wishlists)
        .where(eq(wishlists.user_id, userId))
        .orderBy(desc(wishlists.is_default), desc(wishlists.created_at));

      // Get item counts for each wishlist
      const wishlistsWithCounts = await Promise.all(
        userWishlists.map(async (wishlist: any) => {
          const items = await db
            .select()
            .from(wishlistItems)
            .where(eq(wishlistItems.wishlist_id, wishlist.id));
          
          return {
            ...wishlist,
            item_count: items.length,
          };
        })
      );

      return wishlistsWithCounts;
    } catch (error) {
      console.error('[WishlistsRepository] Error listing wishlists:', error);
      throw new Error('Failed to fetch wishlists');
    }
  }

  /**
   * Get a specific wishlist by ID (with user ownership check)
   */
  async getById(id: string, userId: string): Promise<Wishlist | undefined> {
    try {
      const result = await db
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.id, id), eq(wishlists.user_id, userId)))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('[WishlistsRepository] Error getting wishlist:', error);
      throw new Error('Failed to fetch wishlist');
    }
  }

  /**
   * Get user's default wishlist
   */
  async getDefault(userId: string): Promise<Wishlist | undefined> {
    try {
      const result = await db
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.user_id, userId), eq(wishlists.is_default, true)))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('[WishlistsRepository] Error getting default wishlist:', error);
      throw new Error('Failed to fetch default wishlist');
    }
  }

  /**
   * Create a new wishlist
   */
  async create(wishlist: InsertWishlist): Promise<Wishlist> {
    try {
      const result = await db
        .insert(wishlists)
        .values(wishlist)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create wishlist');
      }
      
      return result[0];
    } catch (error) {
      console.error('[WishlistsRepository] Error creating wishlist:', error);
      throw new Error('Failed to create wishlist');
    }
  }

  /**
   * Update a wishlist (with user ownership check)
   */
  async update(
    id: string,
    userId: string,
    updates: Partial<InsertWishlist>
  ): Promise<Wishlist | undefined> {
    try {
      const result = await db
        .update(wishlists)
        .set(updates)
        .where(and(eq(wishlists.id, id), eq(wishlists.user_id, userId)))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('[WishlistsRepository] Error updating wishlist:', error);
      throw new Error('Failed to update wishlist');
    }
  }

  /**
   * Delete a wishlist (with user ownership check)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(wishlists)
        .where(and(eq(wishlists.id, id), eq(wishlists.user_id, userId)));
      
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('[WishlistsRepository] Error deleting wishlist:', error);
      throw new Error('Failed to delete wishlist');
    }
  }

  /**
   * List all items in a wishlist with product details
   */
  async listItems(wishlistId: string, userId: string): Promise<WishlistItemWithProduct[]> {
    try {
      // First verify user owns this wishlist
      const wishlist = await this.getById(wishlistId, userId);
      if (!wishlist) {
        throw new Error('Wishlist not found or access denied');
      }

      // Get items with product and variant details
      const items = await db
        .select({
          item: wishlistItems,
          product: products,
          variant: productVariants,
        })
        .from(wishlistItems)
        .leftJoin(products, eq(wishlistItems.product_id, products.id))
        .leftJoin(productVariants, eq(wishlistItems.variant_id, productVariants.id))
        .where(eq(wishlistItems.wishlist_id, wishlistId))
        .orderBy(desc(wishlistItems.added_at));

      return items.map((row: any) => ({
        ...row.item,
        product: row.product,
        variant: row.variant,
      }));
    } catch (error) {
      console.error('[WishlistsRepository] Error listing wishlist items:', error);
      throw new Error('Failed to fetch wishlist items');
    }
  }

  /**
   * Get a specific wishlist item
   */
  async getItem(id: string, userId: string): Promise<WishlistItem | undefined> {
    try {
      const result = await db
        .select({
          item: wishlistItems,
          wishlist: wishlists,
        })
        .from(wishlistItems)
        .innerJoin(wishlists, eq(wishlistItems.wishlist_id, wishlists.id))
        .where(and(eq(wishlistItems.id, id), eq(wishlists.user_id, userId)))
        .limit(1);
      
      return result[0]?.item;
    } catch (error) {
      console.error('[WishlistsRepository] Error getting wishlist item:', error);
      throw new Error('Failed to fetch wishlist item');
    }
  }

  /**
   * Add an item to a wishlist
   */
  async addItem(item: InsertWishlistItem, userId: string): Promise<WishlistItem> {
    try {
      // Verify user owns the wishlist
      const wishlist = await this.getById(item.wishlist_id, userId);
      if (!wishlist) {
        throw new Error('Wishlist not found or access denied');
      }

      // Check if item already exists
      const exists = await this.isItemInWishlist(
        item.wishlist_id,
        item.product_id,
        item.variant_id || null
      );
      
      if (exists) {
        throw new Error('Item already in wishlist');
      }

      const result = await db
        .insert(wishlistItems)
        .values(item)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to add item to wishlist');
      }
      
      return result[0];
    } catch (error) {
      console.error('[WishlistsRepository] Error adding wishlist item:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a wishlist
   */
  async removeItem(id: string, userId: string): Promise<boolean> {
    try {
      // Verify user owns the wishlist containing this item
      const item = await this.getItem(id, userId);
      if (!item) {
        return false;
      }

      const result = await db
        .delete(wishlistItems)
        .where(eq(wishlistItems.id, id));
      
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('[WishlistsRepository] Error removing wishlist item:', error);
      throw new Error('Failed to remove item from wishlist');
    }
  }

  /**
   * Check if an item is already in a wishlist
   */
  async isItemInWishlist(
    wishlistId: string,
    productId: string,
    variantId: string | null
  ): Promise<boolean> {
    try {
      const conditions = [
        eq(wishlistItems.wishlist_id, wishlistId),
        eq(wishlistItems.product_id, productId),
      ];

      if (variantId) {
        conditions.push(eq(wishlistItems.variant_id, variantId));
      } else {
        // For products without variants, variant_id should be null
        conditions.push(eq(wishlistItems.variant_id, null as any));
      }

      const result = await db
        .select()
        .from(wishlistItems)
        .where(and(...conditions))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('[WishlistsRepository] Error checking wishlist item:', error);
      return false;
    }
  }
}
