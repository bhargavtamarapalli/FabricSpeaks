import { db } from "../supabase";
import { products, categories, type Product, type InsertProduct } from "../../../shared/schema";
import {
  createPaginatedResponse,
  decodeCursor,
  type PaginatedResponse
} from "../../services/pagination";
import {
  eq, and, or, lt, gt, lte, gte, ilike,
  isNull, isNotNull, count, desc, asc, type SQL
} from "drizzle-orm";

/**
 * Product list options with cursor-based pagination support
 */
export interface ProductListOptions {
  limit: number;
  offset?: number; // For backward compatibility
  cursor?: string; // Cursor for cursor-based pagination
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  size?: string;
  colour?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
  includeTotal?: boolean; // Whether to include total count (expensive for large datasets)
  isSignature?: boolean;
}

/**
 * Products repository interface
 */
export interface ProductsRepository {
  getById(id: string): Promise<Product | undefined>;
  getBySlug(slug: string): Promise<Product | undefined>;
  list(options: ProductListOptions): Promise<PaginatedResponse<Product> | { items: Product[]; total: number }>;
  create(product: InsertProduct): Promise<Product>;
  update(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  delete(id: string): Promise<boolean>;
}

export class SupabaseProductsRepository implements ProductsRepository {
  async getById(id: string): Promise<Product | undefined> {
    try {
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return result[0] ? this.transformProductImages(result[0]) : undefined;
    } catch (err) {
      // Optionally log error
      throw new Error('Failed to fetch product by id');
    }
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    try {
      const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      return result[0] ? this.transformProductImages(result[0]) : undefined;
    } catch (err) {
      throw new Error('Failed to fetch product by slug');
    }
  }

  /**
   * List products with cursor-based pagination
   * Supports both cursor and offset pagination for backward compatibility
   */
  async list(options: ProductListOptions): Promise<PaginatedResponse<Product> | { items: Product[]; total: number }> {
    try {
      const conditions = [eq(products.status, 'active')];
      const useCursorPagination = !!options.cursor || options.offset === undefined;

      // Decode cursor if present
      let cursorValue: string | null = null;
      if (options.cursor) {
        try {
          const decoded = decodeCursor(options.cursor);
          cursorValue = decoded.value;
        } catch (error) {
          throw new Error('Invalid pagination cursor');
        }
      }

      // Category Filter
      // Handle special flags
      if (options.categoryId === 'sale') {
        conditions.push(and(
          isNotNull(products.sale_price),
          lt(products.sale_price, products.price),
          or(isNull(products.sale_start_at), lte(products.sale_start_at, new Date())),
          or(isNull(products.sale_end_at), gte(products.sale_end_at, new Date()))
        ));
      }

      if (options.categoryId === 'new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        conditions.push(gt(products.updated_at, thirtyDaysAgo));
      }

      // Handle Category ID (if not a flag) or Slug
      if (options.categoryId && options.categoryId !== 'sale' && options.categoryId !== 'new') {
        conditions.push(eq(products.category_id, options.categoryId));
      } else if (options.categorySlug) {
        const categoryResult = await db
          .select()
          .from(categories)
          .where(ilike(categories.name, options.categorySlug))
          .limit(1);

        if (categoryResult.length > 0) {
          const parentCategoryId = categoryResult[0].id;

          // Check if this category has children
          const childCategories = await db
            .select()
            .from(categories)
            .where(eq(categories.parent_id, parentCategoryId));

          if (childCategories.length > 0) {
            // Include products from parent and all child categories
            const categoryIds = [parentCategoryId, ...childCategories.map(c => c.id)];
            conditions.push(
              or(...categoryIds.map(id => eq(products.category_id, id))) as SQL<unknown>
            );
          } else {
            // No children, just use the parent category
            conditions.push(eq(products.category_id, parentCategoryId));
          }
        } else {
          // Return empty result if category not found
          return useCursorPagination
            ? { items: [], nextCursor: null, hasMore: false }
            : { items: [], total: 0 };
        }
      }

      // Search Filter (optimized with proper indexing)
      if (options.search) {
        const searchTerm = `%${options.search}%`;
        conditions.push(or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.brand, searchTerm)
        ) as SQL<unknown>);
      }

      // Fabric Filter
      if (options.fabric) {
        conditions.push(ilike(products.fabric, options.fabric));
      }

      // Size Filter
      if (options.size) {
        // Using ilike to match partially (e.g. "M" in "S, M, L") or exactly
        // For better precision, we might want to use array containment if stored as array,
        // but since it's text, ilike is a reasonable start.
        conditions.push(ilike(products.size, `%${options.size}%`));
      }

      // Colour Filter
      if (options.colour) {
        conditions.push(ilike(products.colour, options.colour));
      }

      // Price Filters
      if (options.minPrice !== undefined) {
        conditions.push(gte(products.price, options.minPrice.toString()));
      }
      if (options.maxPrice !== undefined) {
        conditions.push(lte(products.price, options.maxPrice.toString()));
      }

      // Signature Filter
      if (options.isSignature) {
        conditions.push(eq(products.is_signature, true));
      }

      // Cursor condition for pagination
      if (cursorValue && useCursorPagination) {
        // Add cursor condition based on sort order
        const sortBy = options.sortBy || 'newest';
        switch (sortBy) {
          case 'price_asc':
            conditions.push(gt(products.price, cursorValue));
            break;
          case 'price_desc':
            conditions.push(lt(products.price, cursorValue));
            break;
          case 'name_asc':
            conditions.push(gt(products.name, cursorValue));
            break;
          case 'newest':
          default:
            conditions.push(lt(products.created_at, new Date(cursorValue)));
            break;
        }
      }

      const whereClause = and(...conditions);

      // Determine sort order
      let orderBy: SQL<unknown> = desc(products.created_at);
      const sortBy = options.categoryId === 'new' ? 'newest' : (options.sortBy || 'newest');

      switch (sortBy) {
        case 'price_asc':
          orderBy = asc(products.price);
          break;
        case 'price_desc':
          orderBy = desc(products.price);
          break;
        case 'name_asc':
          orderBy = asc(products.name);
          break;
        case 'newest':
          orderBy = desc(products.created_at);
          break;
      }

      // Fetch items (fetch one extra to determine if there are more)
      const limit = options.limit;
      const fetchLimit = useCursorPagination ? limit + 1 : limit;
      const offset = options.offset || 0;

      const items = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderBy as SQL<unknown>)
        .limit(fetchLimit)
        .offset(useCursorPagination ? 0 : offset);

      // Handle cursor-based pagination
      if (useCursorPagination) {
        const getCursorValue = (item: Product): string | number => {
          switch (sortBy) {
            case 'price_asc':
            case 'price_desc':
              return item.price;
            case 'name_asc':
              return item.name;
            case 'newest':
            default:
              return item.created_at.toISOString();
          }
        };

        // Get total count only if requested (expensive operation)
        const total = options.includeTotal
          ? Number((await db.select({ count: count() })
            .from(products)
            .where(whereClause))[0].count)
          : undefined;

        // Transform items to include images array
        const transformedItems = items.map(item => this.transformProductImages(item));

        return createPaginatedResponse(transformedItems, limit, getCursorValue as any, total);
      }

      // Handle offset-based pagination (backward compatibility)
      const totalResult = await db
        .select({ count: count() })
        .from(products)
        .where(whereClause);

      // Transform items to include images array
      const transformedItems = items.map(item => this.transformProductImages(item));

      return {
        items: transformedItems,
        total: Number(totalResult[0].count)
      };

    } catch (err) {
      console.error('[ProductsRepository] Error listing products:', err);
      throw new Error('Failed to list products');
    }
  }

  /**
   * Transform product to include images array for client compatibility
   */
  transformProductImages(product: Product): Product & { images: string[] } {
    const images: string[] = [];

    // Add main_image first if present
    if ((product as any).main_image) {
      images.push((product as any).main_image);
    }

    // Then extract images from color_images (e.g. { "Black": [url1, url2], "White": [url3] })
    if ((product as any).color_images && typeof (product as any).color_images === 'object') {
      const colorImagesObj = (product as any).color_images as Record<string, string[]>;
      for (const colorUrls of Object.values(colorImagesObj)) {
        if (Array.isArray(colorUrls)) {
          for (const url of colorUrls) {
            if (!images.includes(url)) {
              images.push(url);
            }
          }
        }
      }
    }

    return { ...product, images };
  }

  async create(product: InsertProduct): Promise<Product> {
    // Basic validation
    if (!product.name || !product.slug || !product.price || Number(product.price) <= 0) {
      throw new Error('Invalid product data');
    }
    try {
      const now = new Date();
      const payload = {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        price: product.price,
        description: product.description ?? null,
        size: product.size ?? null,
        colour: product.colour ?? null,
        fabric: product.fabric ?? null,
        fabric_quality: product.fabric_quality ?? null,
        wash_care: product.wash_care ?? null,
        premium_segment: product.premium_segment ?? false,
        imported_from: product.imported_from ?? null,
        cost_price: product.cost_price ?? null,
        sale_price: product.sale_price ?? null,
        low_stock_threshold: product.low_stock_threshold ?? 10,
        category_id: product.category_id ?? null,
        status: product.status ?? 'active',
        is_signature: product.is_signature ?? false,
        signature_details: product.signature_details ?? null,
        created_at: now,
        updated_at: now,
      };
      const result = await db.insert(products).values(payload).returning();
      return result[0];
    } catch (err) {
      throw new Error('Failed to create product');
    }
  }

  async update(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    // Only allow certain fields to be updated
    const allowed: Partial<InsertProduct> = {};
    if (updates.name) allowed.name = updates.name;
    if (updates.slug) allowed.slug = updates.slug;
    if (updates.brand) allowed.brand = updates.brand;
    if (updates.price && Number(updates.price) > 0) allowed.price = updates.price;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.size !== undefined) allowed.size = updates.size;
    if (updates.colour !== undefined) allowed.colour = updates.colour;
    if (updates.fabric !== undefined) allowed.fabric = updates.fabric;
    if (updates.fabric_quality !== undefined) allowed.fabric_quality = updates.fabric_quality;
    if (updates.wash_care !== undefined) allowed.wash_care = updates.wash_care;
    if (updates.premium_segment !== undefined) allowed.premium_segment = updates.premium_segment;
    if (updates.imported_from !== undefined) allowed.imported_from = updates.imported_from;
    if (updates.cost_price !== undefined) allowed.cost_price = updates.cost_price;
    if (updates.sale_price !== undefined) allowed.sale_price = updates.sale_price;
    if (updates.low_stock_threshold !== undefined) allowed.low_stock_threshold = updates.low_stock_threshold;
    if (updates.category_id !== undefined) allowed.category_id = updates.category_id;
    if (updates.status) allowed.status = updates.status;
    if (updates.is_signature !== undefined) allowed.is_signature = updates.is_signature;
    if (updates.signature_details !== undefined) allowed.signature_details = updates.signature_details;
    try {
      const result = await db.update(products)
        .set({ ...allowed, updated_at: new Date() })
        .where(eq(products.id, id))
        .returning();
      return result[0];
    } catch (err) {
      throw new Error('Failed to update product');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(products).where(eq(products.id, id));
      return (result as any).rowCount > 0;
    } catch (err) {
      throw new Error('Failed to delete product');
    }
  }
}
