/**
 * Coupon Validation Service
 * Handles coupon validation logic and discount calculations
 */

import { db } from "../db/supabase";
import { coupons, couponUsage } from "../../shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discountAmount?: number;
  error?: string;
  errorCode?: string;
}

export interface ValidateCouponOptions {
  code: string;
  userId: string;
  orderTotal: number;
}

/**
 * Validate a coupon code and calculate discount
 */
export async function validateCoupon(options: ValidateCouponOptions): Promise<CouponValidationResult> {
  const { code, userId, orderTotal } = options;

  try {
    // Find coupon by code
    const couponResults = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (couponResults.length === 0) {
      return {
        valid: false,
        error: "Invalid coupon code",
        errorCode: "INVALID_CODE",
      };
    }

    const coupon = couponResults[0];

    // Check if coupon is active
    if (!coupon.is_active) {
      return {
        valid: false,
        error: "This coupon is no longer active",
        errorCode: "INACTIVE",
      };
    }

    // Check validity dates
    const now = new Date();
    
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return {
        valid: false,
        error: "This coupon is not yet valid",
        errorCode: "NOT_YET_VALID",
      };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return {
        valid: false,
        error: "This coupon has expired",
        errorCode: "EXPIRED",
      };
    }

    // Check if user-specific
    if (coupon.user_specific && coupon.user_id !== userId) {
      return {
        valid: false,
        error: "This coupon is not available for your account",
        errorCode: "USER_SPECIFIC",
      };
    }

    // Check usage limit
    if (coupon.usage_limit !== null && (coupon.usage_count || 0) >= coupon.usage_limit) {
      return {
        valid: false,
        error: "This coupon has reached its usage limit",
        errorCode: "USAGE_LIMIT_REACHED",
      };
    }

    // Check if user has already used this coupon
    const userUsage = await db
      .select()
      .from(couponUsage)
      .where(
        and(
          eq(couponUsage.coupon_id, coupon.id),
          eq(couponUsage.user_id, userId)
        )
      )
      .limit(1);

    if (userUsage.length > 0) {
      return {
        valid: false,
        error: "You have already used this coupon",
        errorCode: "ALREADY_USED",
      };
    }

    // Check minimum order value
    const minOrderValue = parseFloat(coupon.min_order_value?.toString() || "0");
    if (orderTotal < minOrderValue) {
      return {
        valid: false,
        error: `Minimum order value of ₹${minOrderValue.toFixed(2)} required`,
        errorCode: "MIN_ORDER_VALUE",
      };
    }

    // Calculate discount
    let discountAmount = 0;
    const discountValue = parseFloat(coupon.discount_value.toString());

    if (coupon.discount_type === "percentage") {
      discountAmount = (orderTotal * discountValue) / 100;
      
      // Apply max discount cap if set
      if (coupon.max_discount_amount) {
        const maxDiscount = parseFloat(coupon.max_discount_amount.toString());
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else if (coupon.discount_type === "fixed") {
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    };
  } catch (error) {
    console.error("[validateCoupon] Error:", error);
    return {
      valid: false,
      error: "Failed to validate coupon",
      errorCode: "VALIDATION_ERROR",
    };
  }
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  try {
    // Insert usage record
    await db.insert(couponUsage).values({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount.toString(),
    });

    // Increment usage count
    await db
      .update(coupons)
      .set({
        usage_count: sql`${coupons.usage_count} + 1`,
        updated_at: new Date(),
      })
      .where(eq(coupons.id, couponId));
  } catch (error) {
    console.error("[recordCouponUsage] Error:", error);
    throw new Error("Failed to record coupon usage");
  }
}
