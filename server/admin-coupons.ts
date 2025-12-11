/**
 * Admin Coupon Management API
 * Allows admins to create, update, and manage coupons
 */

import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { coupons, couponUsage } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

/**
 * List all coupons
 * GET /api/admin/coupons
 */
export async function listCouponsHandler(req: Request, res: Response) {
  try {
    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.created_at));

    return res.status(200).json({
      coupons: allCoupons,
      count: allCoupons.length,
    });
  } catch (error) {
    console.error("Error listing coupons:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to list coupons",
    });
  }
}

/**
 * Create a new coupon
 * POST /api/admin/coupons
 */
export async function createCouponHandler(req: Request, res: Response) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      userSpecific,
      userId,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    // Validate input
    const schema = z.object({
      code: z.string().min(3).max(50),
      description: z.string().optional(),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().positive(),
      minOrderValue: z.number().min(0).optional(),
      maxDiscountAmount: z.number().positive().optional(),
      usageLimit: z.number().int().positive().optional(),
      userSpecific: z.boolean().optional(),
      userId: z.string().uuid().optional(),
      validFrom: z.string().datetime().optional(),
      validUntil: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    });

    const validation = schema.safeParse({
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      userSpecific,
      userId,
      validFrom,
      validUntil,
      isActive,
    });

    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }

    const data = validation.data;

    // Check if code already exists
    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, data.code.toUpperCase()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({
        code: "CODE_EXISTS",
        message: "A coupon with this code already exists",
      });
    }

    // Create coupon
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: data.code.toUpperCase(),
        description: data.description,
        discount_type: data.discountType,
        discount_value: data.discountValue.toString(),
        min_order_value: data.minOrderValue?.toString() || "0",
        max_discount_amount: data.maxDiscountAmount?.toString(),
        usage_limit: data.usageLimit,
        user_specific: data.userSpecific || false,
        user_id: data.userId,
        valid_from: data.validFrom ? new Date(data.validFrom) : new Date(),
        valid_until: data.validUntil ? new Date(data.validUntil) : null,
        is_active: data.isActive !== undefined ? data.isActive : true,
      })
      .returning();

    return res.status(201).json({
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to create coupon",
    });
  }
}

/**
 * Update a coupon
 * PUT /api/admin/coupons/:id
 */
export async function updateCouponHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    // Check if coupon exists
    const existing = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Coupon not found",
      });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date(),
    };

    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discount_type = discountType;
    if (discountValue !== undefined) updateData.discount_value = discountValue.toString();
    if (minOrderValue !== undefined) updateData.min_order_value = minOrderValue.toString();
    if (maxDiscountAmount !== undefined) updateData.max_discount_amount = maxDiscountAmount.toString();
    if (usageLimit !== undefined) updateData.usage_limit = usageLimit;
    if (validFrom !== undefined) updateData.valid_from = new Date(validFrom);
    if (validUntil !== undefined) updateData.valid_until = new Date(validUntil);
    if (isActive !== undefined) updateData.is_active = isActive;

    // Update coupon
    const [updatedCoupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    return res.status(200).json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to update coupon",
    });
  }
}

/**
 * Delete a coupon
 * DELETE /api/admin/coupons/:id
 */
export async function deleteCouponHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const existing = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Coupon not found",
      });
    }

    // Delete coupon (cascade will delete usage records)
    await db.delete(coupons).where(eq(coupons.id, id));

    return res.status(200).json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to delete coupon",
    });
  }
}

/**
 * Get coupon usage statistics
 * GET /api/admin/coupons/:id/stats
 */
export async function getCouponStatsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get coupon
    const coupon = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (coupon.length === 0) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Coupon not found",
      });
    }

    // Get usage records
    const usage = await db
      .select()
      .from(couponUsage)
      .where(eq(couponUsage.coupon_id, id))
      .orderBy(desc(couponUsage.used_at));

    // Calculate total discount given
    const totalDiscount = usage.reduce((sum, record) => {
      return sum + parseFloat(record.discount_amount.toString());
    }, 0);

    return res.status(200).json({
      coupon: coupon[0],
      stats: {
        totalUses: usage.length,
        totalDiscountGiven: totalDiscount,
        usageRecords: usage,
      },
    });
  } catch (error) {
    console.error("Error getting coupon stats:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get coupon statistics",
    });
  }
}
