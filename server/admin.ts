import type { Request, Response } from "express";
import { SupabaseProductsRepository } from "./db/repositories/supabase-products";
import { SupabaseCategoriesRepository } from "./db/repositories/supabase-categories";
import { parse } from "csv-parse/sync";
import { logInventoryChange } from "./services/inventory";

const productsRepo = new SupabaseProductsRepository();
const categoriesRepo = new SupabaseCategoriesRepository();

export async function createProductHandler(req: Request, res: Response) {
  try {
    const created = await productsRepo.create(req.body);
    return res.status(201).json(created);
  } catch (e: any) {
    console.error("createProduct error:", e);
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid product" });
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const updated = await productsRepo.update(id, req.body || {});
    if (!updated) return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    return res.status(200).json(updated);
  } catch (e: any) {
    console.error("updateProduct error:", e);
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid product" });
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const ok = await productsRepo.delete(id);
    if (!ok) return res.status(404).json({ code: "NOT_FOUND", message: "Product not found" });
    return res.status(204).send();
  } catch (e: any) {
    console.error("deleteProduct error:", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unable to delete product" });
  }
}

export async function createCategoryHandler(req: Request, res: Response) {
  let { slug, name, description, parent_id, display_order } = req.body || {};
  
  if (!name) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Category name is required" });
  
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  try {
    const created = await categoriesRepo.create({ slug, name, description, parent_id, display_order });
    return res.status(201).json(created);
  } catch (e: any) {
    console.error("createCategory error:", e);
    // Handle unique constraint violation
    if (e.code === '23505') {
        return res.status(409).json({ code: "DUPLICATE", message: "Category already exists" });
    }
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid category" });
  }
}

export async function listCategoriesHandler(_req: Request, res: Response) {
  try {
    const list = await categoriesRepo.list();
    return res.status(200).json(list);
  } catch (e: any) {
    console.error("listCategories error:", e);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unable to list categories" });
  }
}

export async function importProductsHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ code: "NO_FILE", message: "No CSV file uploaded" });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (!records || records.length === 0) {
      return res.status(400).json({ code: "EMPTY_CSV", message: "CSV file is empty" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each product
    for (const record of records as any[]) {
      try {
        // Validate required fields
        if (!record.name || !record.price) {
          results.failed++;
          results.errors.push({ row: record, error: "Missing required fields (name, price)" });
          continue;
        }

        // Prepare product data
        const productData = {
          name: record.name,
          slug: record.slug || record.name.toLowerCase().replace(/\s+/g, '-'),
          description: record.description || '',
          price: String(parseFloat(record.price)),
          sale_price: record.sale_price ? String(parseFloat(record.sale_price)) : null,
          stock_quantity: record.stock_quantity ? parseInt(record.stock_quantity) : 0,
          low_stock_threshold: record.low_stock_threshold ? parseInt(record.low_stock_threshold) : 10,
          category_id: record.category_id || null,
          status: record.status || 'active',
          image_url: record.image_url || null,
          sku: record.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        // Create product
        const created = await productsRepo.create(productData);

        // Log inventory if stock was set
        if (productData.stock_quantity > 0) {
          await logInventoryChange(
            created.id,
            productData.stock_quantity,
            'Bulk Import',
            0,
            productData.stock_quantity
          );
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ row: record, error: error.message || 'Unknown error' });
      }
    }

    return res.status(200).json({
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      ...results
    });

  } catch (error: any) {
    console.error("importProducts error:", error);
    return res.status(500).json({ 
      code: "IMPORT_FAILED", 
      message: error.message || "Failed to import products" 
    });
  }
}

