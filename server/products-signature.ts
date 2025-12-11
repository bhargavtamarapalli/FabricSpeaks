import { Request, Response } from "express";
import { productsRepo } from "./products";
import { validatePaginationParams } from "./services/pagination";

/* -------------------------------------------------------------------------
   GET /api/products/signature
   Returns paginated list of products where is_signature = true.
-------------------------------------------------------------------------- */
export async function listSignatureProductsHandler(req: Request, res: Response) {
  try {
    // Re-use existing pagination validation
    const { limit, cursor } = validatePaginationParams(req.query);
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await productsRepo.list({
      limit,
      offset,
      cursor,
      isSignature: true, // <-- our new filter flag
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[signature] list error:", err);
    return res
      .status(500)
      .json({ code: "INTERNAL_ERROR", message: "Failed to list signatures" });
  }
}
