/**
 * Wishlist API Handlers
 * 
 * RESTful API endpoints for wishlist management.
 * All endpoints require authentication and validate user ownership.
 * 
 * @module server/wishlists
 */

import type { Request, Response } from "express";
import { SupabaseWishlistsRepository } from "./db/repositories/supabase-wishlists";
import { insertWishlistSchema, insertWishlistItemSchema } from "../shared/schema";
import { z } from "zod";

const wishlistsRepo = new SupabaseWishlistsRepository();

/**
 * List all wishlists for the authenticated user
 * 
 * GET /api/wishlists
 * 
 * @returns {WishlistWithCount[]} Array of wishlists with item counts
 */
export async function listWishlistsHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const wishlists = await wishlistsRepo.listByUser(user.user_id);
    
    return res.status(200).json(wishlists);
  } catch (error) {
    console.error('[listWishlistsHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch wishlists" 
    });
  }
}

/**
 * Get a specific wishlist with all items
 * 
 * GET /api/wishlists/:id
 * 
 * @param {string} id - Wishlist ID
 * @returns {Wishlist & { items: WishlistItemWithProduct[] }}
 */
export async function getWishlistHandler(req: Request, res: Response) {
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
        message: "Wishlist ID is required" 
      });
    }

    const wishlist = await wishlistsRepo.getById(id, user.user_id);
    if (!wishlist) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Wishlist not found" 
      });
    }

    const items = await wishlistsRepo.listItems(id, user.user_id);
    
    return res.status(200).json({
      ...wishlist,
      items,
    });
  } catch (error) {
    console.error('[getWishlistHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch wishlist" 
    });
  }
}

/**
 * Create a new wishlist
 * 
 * POST /api/wishlists
 * 
 * @body {name?: string, is_default?: boolean}
 * @returns {Wishlist} Created wishlist
 */
export async function createWishlistHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    // Validate request body
    const validationResult = insertWishlistSchema.safeParse({
      ...req.body,
      user_id: user.user_id,
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Invalid wishlist data",
        errors: validationResult.error.errors,
      });
    }

    const wishlist = await wishlistsRepo.create(validationResult.data);
    
    return res.status(201).json(wishlist);
  } catch (error) {
    console.error('[createWishlistHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to create wishlist" 
    });
  }
}

/**
 * Update a wishlist
 * 
 * PUT /api/wishlists/:id
 * 
 * @param {string} id - Wishlist ID
 * @body {name?: string, is_default?: boolean}
 * @returns {Wishlist} Updated wishlist
 */
export async function updateWishlistHandler(req: Request, res: Response) {
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
        message: "Wishlist ID is required" 
      });
    }

    // Validate request body (partial update)
    const updateSchema = insertWishlistSchema.partial().omit({ user_id: true });
    const validationResult = updateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Invalid wishlist data",
        errors: validationResult.error.errors,
      });
    }

    const wishlist = await wishlistsRepo.update(id, user.user_id, validationResult.data);
    
    if (!wishlist) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Wishlist not found" 
      });
    }
    
    return res.status(200).json(wishlist);
  } catch (error) {
    console.error('[updateWishlistHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to update wishlist" 
    });
  }
}

/**
 * Delete a wishlist
 * 
 * DELETE /api/wishlists/:id
 * 
 * @param {string} id - Wishlist ID
 * @returns {success: boolean}
 */
export async function deleteWishlistHandler(req: Request, res: Response) {
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
        message: "Wishlist ID is required" 
      });
    }

    const success = await wishlistsRepo.delete(id, user.user_id);
    
    if (!success) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Wishlist not found" 
      });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[deleteWishlistHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to delete wishlist" 
    });
  }
}

/**
 * Add an item to a wishlist
 * 
 * POST /api/wishlists/:id/items
 * 
 * @param {string} id - Wishlist ID
 * @body {product_id: string, variant_id?: string, notes?: string}
 * @returns {WishlistItem} Created wishlist item
 */
export async function addWishlistItemHandler(req: Request, res: Response) {
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
        message: "Wishlist ID is required" 
      });
    }

    // Validate request body
    const validationResult = insertWishlistItemSchema.safeParse({
      ...req.body,
      wishlist_id: id,
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Invalid wishlist item data",
        errors: validationResult.error.errors,
      });
    }

    const item = await wishlistsRepo.addItem(validationResult.data, user.user_id);
    
    return res.status(201).json(item);
  } catch (error: any) {
    console.error('[addWishlistItemHandler] Error:', error);
    
    if (error.message === 'Item already in wishlist') {
      return res.status(409).json({ 
        code: "ALREADY_EXISTS", 
        message: error.message 
      });
    }
    
    if (error.message === 'Wishlist not found or access denied') {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to add item to wishlist" 
    });
  }
}

/**
 * Remove an item from a wishlist
 * 
 * DELETE /api/wishlists/:id/items/:itemId
 * 
 * @param {string} id - Wishlist ID
 * @param {string} itemId - Wishlist item ID
 * @returns {success: boolean}
 */
export async function removeWishlistItemHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST", 
        message: "Item ID is required" 
      });
    }

    const success = await wishlistsRepo.removeItem(itemId, user.user_id);
    
    if (!success) {
      return res.status(404).json({ 
        code: "NOT_FOUND", 
        message: "Wishlist item not found" 
      });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[removeWishlistItemHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to remove item from wishlist" 
    });
  }
}

/**
 * Get user's default wishlist
 * 
 * GET /api/wishlists/default
 * 
 * @returns {Wishlist} Default wishlist
 */
export async function getDefaultWishlistHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required" 
      });
    }

    const wishlist = await wishlistsRepo.getDefault(user.user_id);
    
    if (!wishlist) {
      // Create default wishlist if it doesn't exist
      const newWishlist = await wishlistsRepo.create({
        user_id: user.user_id,
        name: "My Wishlist",
        is_default: true,
      });
      
      return res.status(200).json(newWishlist);
    }
    
    return res.status(200).json(wishlist);
  } catch (error) {
    console.error('[getDefaultWishlistHandler] Error:', error);
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Failed to fetch default wishlist" 
    });
  }
}
