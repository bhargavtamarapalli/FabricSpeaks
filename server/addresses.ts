import type { Request, Response } from "express";
import { SupabaseAddressRepository } from "./db/repositories/supabase-addresses";
import { requireAuth } from "./middleware/auth";
import { handleRouteError } from "./utils/errors";
import { z } from "zod";

const addressRepo = new SupabaseAddressRepository();

// Validation schemas
const createAddressSchema = z.object({
  type: z.enum(["billing", "shipping"]),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  address_line_1: z.string().min(1, "Address line 1 is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  is_default: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

export const requireAddressAuth = requireAuth;

/**
 * GET /api/addresses
 * List user's addresses
 */
export async function listAddressesHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const type = req.query.type as "billing" | "shipping" | undefined;
    const addresses = await addressRepo.listByUser(userId, type);

    return res.status(200).json(addresses);
  } catch (error) {
    return handleRouteError(error, res, "Fetching addresses");
  }
}

/**
 * POST /api/addresses
 * Create a new address
 */
export async function createAddressHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    // Validate input
    const validationResult = createAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Invalid address data",
          details: validationResult.error.issues
        }
      });
    }

    const addressData = {
      user_id: userId,
      ...validationResult.data
    };

    const address = await addressRepo.create(addressData);

    return res.status(201).json(address);
  } catch (error) {
    return handleRouteError(error, res, "Creating address");
  }
}

/**
 * GET /api/addresses/:id
 * Get a specific address
 */
export async function getAddressHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const addressId = req.params.id;
    if (!addressId) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Address ID is required" }
      });
    }

    const address = await addressRepo.getById(userId, addressId);
    if (!address) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Address not found" }
      });
    }

    return res.status(200).json(address);
  } catch (error) {
    return handleRouteError(error, res, "Fetching address");
  }
}

/**
 * PUT /api/addresses/:id
 * Update an address
 */
export async function updateAddressHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const addressId = req.params.id;
    if (!addressId) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Address ID is required" }
      });
    }

    // Validate input
    const validationResult = updateAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Invalid address data",
          details: validationResult.error.issues
        }
      });
    }

    const address = await addressRepo.update(userId, addressId, validationResult.data);
    if (!address) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Address not found" }
      });
    }

    return res.status(200).json(address);
  } catch (error) {
    return handleRouteError(error, res, "Updating address");
  }
}

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
export async function deleteAddressHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const addressId = req.params.id;
    if (!addressId) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Address ID is required" }
      });
    }

    const deleted = await addressRepo.delete(userId, addressId);
    if (!deleted) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Address not found" }
      });
    }

    return res.status(204).send();
  } catch (error) {
    return handleRouteError(error, res, "Deleting address");
  }
}

/**
 * POST /api/addresses/:id/default
 * Set address as default
 */
export async function setDefaultAddressHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const addressId = req.params.id;
    if (!addressId) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Address ID is required" }
      });
    }

    const success = await addressRepo.setDefault(userId, addressId);
    if (!success) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Address not found" }
      });
    }

    return res.status(200).json({ message: "Address set as default" });
  } catch (error) {
    return handleRouteError(error, res, "Setting default address");
  }
}

/**
 * GET /api/addresses/default
 * Get default addresses
 */
export async function getDefaultAddressesHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" }
      });
    }

    const [shipping, billing] = await Promise.all([
      addressRepo.getDefault(userId, "shipping"),
      addressRepo.getDefault(userId, "billing")
    ]);

    return res.status(200).json({
      shipping,
      billing
    });
  } catch (error) {
    return handleRouteError(error, res, "Fetching default addresses");
  }
}
