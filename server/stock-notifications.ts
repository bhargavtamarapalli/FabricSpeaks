/**
 * Stock Notifications API Handler
 * Allows users to request notifications when out-of-stock products are back in stock
 */

import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { stockNotifications, products, productVariants } from "../shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

/**
 * Create a stock notification request
 * POST /api/stock-notifications
 */
export async function createStockNotificationHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string | undefined;
    
    const { productId, variantId, email } = req.body;
    
    // Validate input
    const schema = z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional().nullable(),
      email: z.string().email(),
    });
    
    const validation = schema.safeParse({ productId, variantId, email });
    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }
    
    const { productId: validProductId, variantId: validVariantId, email: validEmail } = validation.data;
    
    // Check if product exists
    const product = await db.select().from(products).where(eq(products.id, validProductId)).limit(1);
    if (product.length === 0) {
      return res.status(404).json({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      });
    }
    
    // Check if product is actually out of stock
    let isInStock = false;
    if (validVariantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, validVariantId))
        .limit(1);
      if (variant && variant.stock_quantity > 0) isInStock = true;
    } else {
      // Check if any variant has stock
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.product_id, validProductId));
      if (variants.some((v) => v.stock_quantity > 0)) isInStock = true;
    }

    if (isInStock) {
      return res.status(400).json({
        code: "PRODUCT_IN_STOCK",
        message: "Product is currently in stock",
      });
    }
    
    // Check if notification already exists
    const existingNotification = await db
      .select()
      .from(stockNotifications)
      .where(
        and(
          userId ? eq(stockNotifications.user_id, userId) : eq(stockNotifications.email, validEmail),
          eq(stockNotifications.product_id, validProductId),
          validVariantId 
            ? eq(stockNotifications.variant_id, validVariantId)
            : isNull(stockNotifications.variant_id)
        )
      )
      .limit(1);
    
    if (existingNotification.length > 0) {
      return res.status(200).json({
        message: "You are already subscribed to notifications for this product",
        notification: existingNotification[0],
      });
    }
    
    // Create notification
    const [notification] = await db
      .insert(stockNotifications)
      .values({
        user_id: userId || null,
        product_id: validProductId,
        variant_id: validVariantId || null,
        email: validEmail,
        notified: false,
      })
      .returning();
    
    return res.status(201).json({
      message: "You will be notified when this product is back in stock",
      notification,
    });
  } catch (error) {
    console.error("Error creating stock notification:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to create stock notification",
    });
  }
}

/**
 * List user's stock notifications
 * GET /api/stock-notifications
 */
export async function listStockNotificationsHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;
    
    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    
    const notifications = await db
      .select({
        id: stockNotifications.id,
        product_id: stockNotifications.product_id,
        variant_id: stockNotifications.variant_id,
        email: stockNotifications.email,
        notified: stockNotifications.notified,
        created_at: stockNotifications.created_at,
        notified_at: stockNotifications.notified_at,
        product_name: products.name,
        product_images: products.color_images,
      })
      .from(stockNotifications)
      .leftJoin(products, eq(stockNotifications.product_id, products.id))
      .where(eq(stockNotifications.user_id, userId))
      .orderBy(stockNotifications.created_at);
    
    return res.status(200).json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error listing stock notifications:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to list stock notifications",
    });
  }
}

/**
 * Delete a stock notification
 * DELETE /api/stock-notifications/:id
 */
export async function deleteStockNotificationHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    
    // Check if notification exists and belongs to user
    const notification = await db
      .select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.id, id),
          eq(stockNotifications.user_id, userId)
        )
      )
      .limit(1);
    
    if (notification.length === 0) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Notification not found",
      });
    }
    
    // Delete notification
    await db
      .delete(stockNotifications)
      .where(eq(stockNotifications.id, id));
    
    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting stock notification:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to delete stock notification",
    });
  }
}
