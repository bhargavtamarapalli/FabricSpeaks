/**
 * Coupon API (User-facing)
 * Allows users to validate and apply coupons
 */

import type { Request, Response } from "express";
import { validateCoupon } from "./services/coupon-validation";
import { z } from "zod";

/**
 * Validate a coupon code
 * POST /api/coupons/validate
 */
export async function validateCouponHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const { code, orderTotal } = req.body;

    // Validate input
    const schema = z.object({
      code: z.string().min(1).max(50),
      orderTotal: z.number().positive(),
    });

    const validation = schema.safeParse({ code, orderTotal });
    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }

    const { code: validCode, orderTotal: validOrderTotal } = validation.data;

    // Validate coupon
    const result = await validateCoupon({
      code: validCode,
      userId,
      orderTotal: validOrderTotal,
    });

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        error: result.error,
        errorCode: result.errorCode,
      });
    }

    return res.status(200).json({
      valid: true,
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        description: result.coupon.description,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
      },
      discountAmount: result.discountAmount,
      finalTotal: validOrderTotal - (result.discountAmount || 0),
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to validate coupon",
    });
  }
}
