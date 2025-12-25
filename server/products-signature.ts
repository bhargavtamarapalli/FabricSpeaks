import { Request, Response } from "express";
import { productsRepo } from "./products";
import { validatePaginationParams } from "./services/pagination";
import { db } from "./db/supabase";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

/* -------------------------------------------------------------------------
   GET /api/products/signature
   Returns paginated list of products where is_signature = true.
-------------------------------------------------------------------------- */
export async function listSignatureProductsHandler(req: Request, res: Response) {
  console.log("=".repeat(60));
  console.log("[signature] === HANDLER START ===");
  console.log("[signature] Timestamp:", new Date().toISOString());
  console.log("[signature] Request URL:", req.url);
  console.log("[signature] Query params:", JSON.stringify(req.query));

  try {
    // Step 1: Check if db is available
    console.log("[signature] Step 1: Checking db connection...");
    console.log("[signature] db object exists:", !!db);
    console.log("[signature] products table exists:", !!products);
    console.log("[signature] products.is_signature exists:", !!products.is_signature);

    // Step 2: Check eq function
    console.log("[signature] Step 2: Checking eq function...");
    console.log("[signature] eq function exists:", typeof eq === 'function');

    // Step 3: Attempt direct query
    console.log("[signature] Step 3: Attempting direct DB query...");

    let directResult;
    try {
      console.log("[signature] Building query...");
      const query = db
        .select()
        .from(products)
        .where(eq(products.is_signature, true))
        .limit(10);

      console.log("[signature] Executing query...");
      directResult = await query;
      console.log("[signature] Query executed successfully!");
      console.log("[signature] Result count:", directResult?.length || 0);

      if (directResult && directResult.length > 0) {
        console.log("[signature] First product name:", directResult[0]?.name);
        console.log("[signature] First product id:", directResult[0]?.id);
      } else {
        console.log("[signature] No signature products found in database");
      }
    } catch (queryError: any) {
      console.error("[signature] !!! QUERY EXECUTION FAILED !!!");
      console.error("[signature] Error type:", queryError?.constructor?.name);
      console.error("[signature] Error message:", queryError?.message);
      console.error("[signature] Error code:", queryError?.code);
      console.error("[signature] Error stack:", queryError?.stack);
      throw queryError;
    }

    // Step 4: Transform and return
    console.log("[signature] Step 4: Transforming results...");
    const transformedItems = (directResult || []).map(p => ({
      ...p,
      images: p.main_image ? [p.main_image] : []
    }));

    console.log("[signature] Transformed items count:", transformedItems.length);
    console.log("[signature] === HANDLER SUCCESS ===");
    console.log("=".repeat(60));

    return res.status(200).json({
      items: transformedItems,
      total: transformedItems.length
    });

  } catch (err: any) {
    console.error("=".repeat(60));
    console.error("[signature] !!! HANDLER ERROR !!!");
    console.error("[signature] Error type:", err?.constructor?.name);
    console.error("[signature] Error message:", err?.message);
    console.error("[signature] Error code:", err?.code);
    console.error("[signature] Error stack:", err?.stack);
    console.error("=".repeat(60));

    return res
      .status(500)
      .json({
        code: "INTERNAL_ERROR",
        message: err?.message || "Failed to list signatures",
        errorType: err?.constructor?.name
      });
  }
}
