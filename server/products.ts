import type { Request, Response } from "express";
import { SupabaseProductsRepository } from "./db/repositories/supabase-products";
import { validatePaginationParams, MAX_PAGE_SIZE } from "./services/pagination";

export const productsRepo = new SupabaseProductsRepository();

/**
 * List products handler with cursor-based pagination support
 * Supports both cursor and offset pagination for backward compatibility
 */
export async function listProductsHandler(req: Request, res: Response) {
  try {
    // Parse and validate pagination parameters
    const limit = Math.max(1, Math.min(Number(req.query.limit ?? 20), MAX_PAGE_SIZE));
    const offset = req.query.offset ? Math.max(0, Number(req.query.offset)) : undefined;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    
    // Parse filter parameters
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const categorySlug = typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const fabric = typeof req.query.fabric === "string" ? req.query.fabric : undefined;
    const size = typeof req.query.size === "string" ? req.query.size : undefined;
    const colour = typeof req.query.colour === "string" ? req.query.colour : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sortBy = typeof req.query.sortBy === "string" 
      ? (req.query.sortBy as 'price_asc' | 'price_desc' | 'newest' | 'name_asc') 
      : undefined;
    const isSignature = req.query.isSignature === 'true';
    
    // Include total count only if explicitly requested (expensive for large datasets)
    const includeTotal = req.query.includeTotal === 'true';

    const result = await productsRepo.list({ 
      limit, 
      offset,
      cursor,
      categoryId, 
      categorySlug,
      search,
      fabric,
      size,
      colour,
      minPrice,
      maxPrice,
      sortBy,
      includeTotal,
      isSignature
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('[listProductsHandler] Error:', error);
    return res.status(500).json({ 
      code: 'INTERNAL_ERROR', 
      message: error instanceof Error ? error.message : 'Failed to fetch products' 
    });
  }
}

export async function getProductHandler(req: Request, res: Response) {
  try {
    const idOrSlug = req.params.id;
    const bySlug = await productsRepo.getBySlug(idOrSlug);
    const prod = bySlug ?? (await productsRepo.getById(idOrSlug));
    if (!prod) return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    return res.status(200).json(prod);
  } catch (error) {
    console.error('[getProductHandler] Error:', error);
    return res.status(500).json({ 
      code: 'INTERNAL_ERROR', 
      message: error instanceof Error ? error.message : 'Failed to fetch product' 
    });
  }
}

// Optional: seed for dev/demo (no-op here; tests mock repo instead)


