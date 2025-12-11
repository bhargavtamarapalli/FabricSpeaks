import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { products, insertProductSchema, categories, productVariants } from "../shared/schema";
import { eq, ilike, or, desc, and, inArray, sql, count } from "drizzle-orm";
import { z } from "zod";
import { logAuditAction } from "./audit";

// --- Types ---
const adminListProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  categoryId: z.string().optional(),
  stockStatus: z.enum(['all', 'in-stock', 'low-stock', 'out-of-stock']).default('all'),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc']).default('newest'),
});

// Signature Details Schema for validation
const signatureDetailsSchema = z.object({
  tag: z.string().optional(),
  certificate: z.boolean().optional(),
  image: z.string().url().optional().or(z.literal('')),
  video: z.string().url().optional().or(z.literal('')),
  show_video: z.boolean().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  details: z.object({
    fabric: z.string().optional(),
    origin: z.string().optional(),
    styling: z.string().optional(),
  }).optional(),
}).optional();

// Helper function to validate signature products
function validateSignatureProduct(productData: any): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (productData.is_signature) {
    const sigDetails = productData.signature_details;
    
    // Check for hero image
    if (!sigDetails?.image && !productData.main_image) {
      warnings.push('Signature products should have a hero image for best display quality');
    }
    
    // Check for tag
    if (!sigDetails?.tag) {
      warnings.push('Consider adding a tag (e.g., "Limited Edition") for signature products');
    }
    
    // Log signature details for debugging
    console.log('[SIGNATURE PRODUCT] Validation:', {
      is_signature: productData.is_signature,
      has_hero_image: !!(sigDetails?.image || productData.main_image),
      has_tag: !!sigDetails?.tag,
      has_certificate: !!sigDetails?.certificate,
      has_video: !!sigDetails?.video,
      signature_details: sigDetails
    });
  }
  
  return { valid: true, warnings };
}

// --- Handlers ---

/**
 * GET /api/admin/products
 * List products with search, filter, and pagination
 */
export async function getAdminProductsHandler(req: Request, res: Response) {
  try {
    const query = adminListProductsQuerySchema.parse(req.query);
    console.log('[DEBUG] Admin Products Query:', query);
    const offset = (query.page - 1) * query.limit;

    // Build conditions
    const conditions = [];
    
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          ilike(products.name, searchTerm),
          ilike(products.sku, searchTerm),
          ilike(products.description || '', searchTerm)
        )
      );
    }

    if (query.status !== 'all') {
      conditions.push(eq(products.status, query.status));
    }

    if (query.categoryId) {
      conditions.push(eq(products.category_id, query.categoryId));
    }

    // Build Sort
    let orderBy;
    switch (query.sortBy) {
      case 'price_asc': orderBy = products.price; break;
      case 'price_desc': orderBy = desc(products.price); break;
      case 'name_asc': orderBy = products.name; break;
      case 'newest': default: orderBy = desc(products.created_at); break;
    }

    // Execute Query - fetch more to allow filtering by stock later
    const fetchLimit = query.stockStatus !== 'all' ? 200 : query.limit;
    const [data, countResult] = await Promise.all([
      db.select({
        ...products,
        category_name: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(and(...conditions))
      .limit(fetchLimit)
      .offset(query.stockStatus !== 'all' ? 0 : offset)
      .orderBy(orderBy),
      
      db.select({ count: count(products.id) })
        .from(products)
        .where(and(...conditions))
    ]);

    // Fetch variants for these products to calculate stock
    const productIds = data.map(p => p.id);
    let productStockMap = new Map<string, number>();

    if (productIds.length > 0) {
      const variants = await db
        .select({
          productId: productVariants.product_id,
          stock: productVariants.stock_quantity
        })
        .from(productVariants)
        .where(inArray(productVariants.product_id, productIds));

      // Aggregate stock by product
      variants.forEach(v => {
        const current = productStockMap.get(v.productId) || 0;
        productStockMap.set(v.productId, current + (v.stock || 0));
      });
      console.log('[DEBUG] Stock Map:', Object.fromEntries(productStockMap));
    }

    // Transform data to include imageUrl from color_images or main_image
    let transformedData = data.map(product => {
      let imageUrl = (product as any).main_image;
      
      // Extract first image from color_images object if no main_image
      if (!imageUrl && product.color_images && typeof product.color_images === 'object') {
        const colors = Object.values(product.color_images);
        if (colors.length > 0 && Array.isArray(colors[0]) && colors[0].length > 0) {
          imageUrl = colors[0][0];
        }
      }
      
      // Use placeholder if no image found
      if (!imageUrl) {
        imageUrl = 'https://placehold.co/400x400/1e293b/94a3b8?text=No+Image';
      }
      
      const calculatedStock = productStockMap.get(product.id) || 0;
      const lowStockThreshold = product.low_stock_threshold || 10;

      return {
        ...product,
        imageUrl,
        mainImage: (product as any).main_image,
        stockQuantity: calculatedStock,
        stockStatus: calculatedStock === 0 ? 'out-of-stock' : calculatedStock <= lowStockThreshold ? 'low-stock' : 'in-stock',
        category: product.category_name ? { name: product.category_name } : null
      };
    });

    // Filter by stockStatus if specified
    if (query.stockStatus !== 'all') {
      console.log(`[DEBUG] Filtering by stockStatus: ${query.stockStatus}`);
      transformedData = transformedData.filter(p => {
        const matches = p.stockStatus === query.stockStatus;
        console.log(`[DEBUG] Product ${p.name}: stockStatus=${p.stockStatus}, matches=${matches}`);
        return matches;
      });
    }

    // Apply pagination after stock filtering
    const filteredTotal = query.stockStatus !== 'all' ? transformedData.length : Number(countResult[0]?.count || 0);
    if (query.stockStatus !== 'all') {
      transformedData = transformedData.slice(offset, offset + query.limit);
    }

    return res.json({
      data: transformedData,
      meta: {
        total: filteredTotal,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(filteredTotal / query.limit)
      }
    });

  } catch (error) {
    console.error("Admin List Products Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to list products" });
  }
}

/**
 * GET /api/admin/products/:id
 * Get a single product with variants
 */
export async function getAdminProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [product] = await db
      .select({
        ...products,
        category_name: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Fetch variants
    const variantsList = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.product_id, id));

    console.log(`[DEBUG] Get Product ${id}:`, {
        name: product.name,
        color_images: product.color_images,
        variantsCount: variantsList.length
    });

    return res.json({
      ...product,
      variants: variantsList
    });

  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to fetch product" });
  }
}

/**
 * POST /api/admin/products
 * Create a new product with validation
 */
export async function createAdminProductHandler(req: Request, res: Response) {
  try {
    // Separate variants from product data
    const { variants, ...productData } = req.body;

    console.log('[CREATE PRODUCT] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[CREATE PRODUCT] Variants:', variants);
    console.log('[CREATE PRODUCT] Product data color_images:', productData.color_images);
    console.log('[CREATE PRODUCT] Product data main_image:', productData.main_image);

    // Map camelCase mainImage to snake_case main_image
    if ((productData as any).mainImage) {
      (productData as any).main_image = (productData as any).mainImage;
    }

    // Validate body against Zod schema
    const payload = insertProductSchema.parse(productData);

    // Ensure slug is unique if provided, or generate one
    if (!payload.slug) {
      payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    }

    const [created] = await db.insert(products).values(payload).returning();
    
    // Handle Variants
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsToInsert = variants.map((v: any) => ({
        product_id: created.id,
        size: v.size,
        colour: v.color, // Frontend sends 'color', backend expects 'colour'
        stock_quantity: Number(v.stock) || 0,
        sku: v.sku || `${created.sku}-${v.size}-${v.color}`.toUpperCase(),
        images: v.images || [], // Handle variant images
        status: 'active'
      }));
      
      await db.insert(productVariants).values(variantsToInsert);
    }
    
    // Validate signature product and collect warnings
    const signatureValidation = validateSignatureProduct(productData);
    
    // Audit Log
    await logAuditAction((req as any).user.user_id, 'create_product', 'product', created.id, payload, req);

    // Return with warnings if signature product has issues
    return res.status(201).json({
      ...created,
      _warnings: signatureValidation.warnings.length > 0 ? signatureValidation.warnings : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ code: "VALIDATION_ERROR", errors: error.errors });
    }
    console.error("Create Product Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to create product" });
  }
}

export async function updateAdminProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log('[UPDATE PRODUCT] Request body:', JSON.stringify(req.body, null, 2));
    
    // Separate variants from product data
    const { variants, ...productData } = req.body;

    console.log('[UPDATE PRODUCT] Variants:', variants);
    console.log('[UPDATE PRODUCT] Field values:', {
      fabric_quality: productData.fabric_quality,
      wash_care: productData.wash_care,
      category_id: productData.category_id,
      sale_price: productData.sale_price,
      low_stock_threshold: productData.low_stock_threshold,
      color_images: productData.color_images,
      main_image: productData.main_image,
      // New Attributes Debug
      is_imported: (productData as any).is_imported,
      gsm: (productData as any).gsm,
      weave: (productData as any).weave,
      fit: (productData as any).fit,
      pattern: (productData as any).pattern,
      occasion: (productData as any).occasion,
      is_signature: (productData as any).is_signature
    });

    // Map camelCase mainImage to snake_case main_image
    if ((productData as any).mainImage) {
      (productData as any).main_image = (productData as any).mainImage;
    }

    const payload = insertProductSchema.partial().parse(productData);

    const [updated] = await db
      .update(products)
      .set({ ...payload, updated_at: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Handle Variants Update (Delete all and re-create)
    if (variants && Array.isArray(variants)) {
      // 1. Delete existing variants
      await db.delete(productVariants).where(eq(productVariants.product_id, id));

      // 2. Insert new variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v: any) => ({
          product_id: id,
          size: v.size,
          colour: v.color, // Frontend sends 'color', backend expects 'colour'
          stock_quantity: Number(v.stock) || 0,
          sku: v.sku || `${updated.sku}-${v.size}-${v.color}`.toUpperCase(),
          images: v.images || [], // Handle variant images
          status: 'active'
        }));
        
        await db.insert(productVariants).values(variantsToInsert);
      }
    }

    // Validate signature product and collect warnings
    const signatureValidation = validateSignatureProduct(productData);

    // Audit Log
    await logAuditAction((req as any).user.user_id, 'update_product', 'product', id, payload, req);

    // Return with warnings if signature product has issues
    return res.json({
      ...updated,
      _warnings: signatureValidation.warnings.length > 0 ? signatureValidation.warnings : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE PRODUCT] Validation errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ 
        code: "VALIDATION_ERROR", 
        message: "Validation failed",
        errors: error.errors 
      });
    }
    console.error("Update Product Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to update product" });
  }
}

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
export async function deleteAdminProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Audit Log
    await logAuditAction((req as any).user.user_id, 'delete_product', 'product', id, {}, req);

    return res.status(204).send();
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to delete product" });
  }
}

/**
 * POST /api/admin/products/bulk-status
 * Bulk update product status
 */
export async function bulkUpdateProductStatusHandler(req: Request, res: Response) {
  try {
    const schema = z.object({
      productIds: z.array(z.string().uuid()),
      status: z.enum(['active', 'inactive'])
    });

    const { productIds, status } = schema.parse(req.body);

    if (productIds.length === 0) {
      return res.json({ updatedCount: 0 });
    }

    const result = await db
      .update(products)
      .set({ status, updated_at: new Date() })
      .where(inArray(products.id, productIds))
      .returning({ id: products.id });

    // Audit Log
    await logAuditAction((req as any).user.user_id, 'bulk_update_product_status', 'product', 'bulk', { productIds, status }, req);

    return res.json({ 
      success: true, 
      updatedCount: result.length 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ code: "VALIDATION_ERROR", errors: error.errors });
    }
    console.error("Bulk Update Status Error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to update product status" });
  }
}
