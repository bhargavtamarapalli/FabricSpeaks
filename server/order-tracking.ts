/**
 * Order Tracking Admin API
 * Allows admins to update shipping information for orders
 */

import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { orders, profiles } from "../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendShippingConfirmationEmail } from "./utils/email";
import { whatsappService } from "./services/whatsapp-notifications";
import { formatNotification } from "./services/notification-templates";

/**
 * Update shipping information for an order
 * PATCH /api/admin/orders/:id/shipping
 */
export async function updateOrderShippingHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trackingNumber, courier, estimatedDelivery } = req.body;

    // Validate input
    const schema = z.object({
      trackingNumber: z.string().min(1, "Tracking number is required"),
      courier: z.string().min(1, "Courier name is required"),
      estimatedDelivery: z.string().datetime().optional(),
    });

    const validation = schema.safeParse({
      trackingNumber,
      courier,
      estimatedDelivery,
    });

    if (!validation.success) {
      return res.status(400).json({
        code: "INVALID_INPUT",
        message: "Invalid input",
        errors: validation.error.issues,
      });
    }

    const { trackingNumber: validTrackingNumber, courier: validCourier, estimatedDelivery: validEstimatedDelivery } = validation.data;

    // Check if order exists
    const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (order.length === 0) {
      return res.status(404).json({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      });
    }

    // Update order with shipping information
    const updateData: any = {
      tracking_number: validTrackingNumber,
      courier: validCourier,
      shipped_at: new Date(),
      status: "shipped",
      updated_at: new Date(),
    };

    if (validEstimatedDelivery) {
      updateData.estimated_delivery = new Date(validEstimatedDelivery);
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    // Get user email for notification
    const user = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.user_id, order[0].user_id))
      .limit(1);

    // Send shipping confirmation email
    if (user.length > 0 && user[0].email) {
      try {
        // Get order items for email
        const orderItems = await db.query.orderItems.findMany({
          where: (orderItems, { eq }) => eq(orderItems.order_id, id),
          with: {
            product: true,
          },
        });

        await sendShippingConfirmationEmail({
          to: user[0].email,
          orderId: id,
          trackingNumber: validTrackingNumber,
          courier: validCourier,
          estimatedDelivery: validEstimatedDelivery ? new Date(validEstimatedDelivery) : undefined,
          items: orderItems.map((item: any) => ({
            quantity: item.quantity,
            product_name: item.product?.name || 'Product',
          })),
        });
      } catch (emailError) {
        console.error("Failed to send shipping confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // 🆕 Send customer WhatsApp notification
    try {
      const userAddress = await db.query.addresses.findFirst({
        where: (addresses, { eq, and }) => and(
          eq(addresses.user_id, order[0].user_id),
          eq(addresses.is_default, true)
        )
      });

      if (userAddress?.phone) {
        const customerMsg = formatNotification('order_shipped', {
          order_id: id.substring(0, 8),
          courier: validCourier,
          tracking_number: validTrackingNumber,
          estimated_delivery: validEstimatedDelivery ? new Date(validEstimatedDelivery).toLocaleDateString() : 'Soon',
          tracking_url: `https://fabricspeaks.com/orders`
        });
        
        await whatsappService.sendToCustomer(userAddress.phone, customerMsg.message);
      }
    } catch (customerNotifError) {
      console.error('Failed to send customer shipping notification:', customerNotifError);
    }

    return res.status(200).json({
      message: "Shipping information updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating shipping information:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to update shipping information",
    });
  }
}

/**
 * Get tracking information for an order
 * GET /api/orders/:id/tracking
 */
export async function getOrderTrackingHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;

    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Get order with tracking information
    const order = await db
      .select({
        id: orders.id,
        status: orders.status,
        tracking_number: orders.tracking_number,
        courier: orders.courier,
        shipped_at: orders.shipped_at,
        estimated_delivery: orders.estimated_delivery,
        created_at: orders.created_at,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (order.length === 0) {
      return res.status(404).json({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      });
    }

    // Verify order belongs to user
    const fullOrder = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (fullOrder[0].user_id !== userId) {
      return res.status(403).json({
        code: "FORBIDDEN",
        message: "You don't have permission to view this order",
      });
    }

    return res.status(200).json({
      tracking: order[0],
    });
  } catch (error) {
    console.error("Error getting tracking information:", error);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get tracking information",
    });
  }
}
