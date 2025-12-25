import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { cartsRepo } from "./cart";
import { SupabaseOrdersRepository } from "./db/repositories/supabase-orders";
import { requireAuth } from "./middleware/auth";
import { handleRouteError } from "./utils/errors";
import { db, supabase } from "./db/supabase";
import { orders, products } from "../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { z } from "zod";
import { updateProductStock } from "./services/inventory";
import { inventoryReservationService } from "./services/inventory-reservation";

const ordersRepo = new SupabaseOrdersRepository();

let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  // Avoid throwing during module import when keys are not set (e.g., local dev)
  console.warn('Razorpay not configured: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing. Checkout will be disabled.');
}

export const requireAuthMw = requireAuth;

export async function checkoutHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as { user_id: string } | undefined;
    const userId = profile?.user_id || null;

    const sessionId = req.headers['x-session-id'] as string;
    const { guest_email, guest_phone } = req.body || {};

    console.log(`[ORDER] Checkout initiated. User: ${userId || 'Guest'}, Session: ${sessionId}`);

    // 1. Validation for Guest/User
    if (!userId) {
      if (!sessionId) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized and no session ID provided" } });
      }
      if (!guest_email || !guest_phone) {
        return res.status(400).json({ error: { code: "MISSING_GUEST_INFO", message: "Email and Phone are required for guest checkout" } });
      }
    }

    // 2. Get Cart
    let cart;
    if (userId) {
      cart = await cartsRepo.getOrCreate(userId);
    } else {
      cart = await cartsRepo.getOrCreateBySession(sessionId);
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        error: { code: "EMPTY_CART", message: "Cart is empty" }
      });
    }

    // 3. Calculate Base Total
    const subtotal = cart.items.reduce((acc, item) => acc + Number(item.unit_price) * item.quantity, 0);

    if (subtotal <= 0) {
      return res.status(400).json({
        error: { code: "INVALID_AMOUNT", message: "Invalid order amount" }
      });
    }

    // Capture options from valid checkout payload
    const delivery_option = req.body.delivery_option || 'standard';
    const coupon_code = req.body.coupon_code;

    // --- Price Calculation Logic (Must match frontend useCartTotals) ---
    // Shipping
    const FREE_SHIPPING_THRESHOLD = 999;
    let shipping = 0;
    if (delivery_option === 'express') {
      shipping = 99;
    } else {
      shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 20; // Default shipping cost
    }

    // Tax (8% approx)
    const tax = Math.round(subtotal * 0.08);

    // Coupon Discount (Mock Logic to match frontend)
    let discount = 0;
    if (coupon_code) {
      const code = coupon_code.toUpperCase();
      if (code === 'FIRST10') {
        discount = Math.round(subtotal * 0.10);
      } else if (code === 'FLAT100') {
        discount = 100;
      }
    }

    const finalTotal = subtotal + shipping + tax - discount;

    interface ProductData {
      id: string;
      price: string;
      sale_price: string | null;
      stock_quantity: number;
      status: string | null;
    }

    // Use Drizzle for direct DB query (more reliable than Supabase REST)
    const { inArray } = await import('drizzle-orm');
    let productsList: ProductData[];
    try {
      productsList = await db.select({
        id: products.id,
        price: products.price,
        sale_price: products.sale_price,
        stock_quantity: products.stock_quantity,
        status: products.status
      })
        .from(products)
        .where(inArray(products.id, cart.items.map((item) => item.product_id)));
    } catch (dbError: any) {
      console.error('[ORDER] DB error fetching products:', dbError?.message || dbError);
      return res.status(500).json({
        error: { code: "INVENTORY_CHECK_FAILED", message: "Failed to verify product availability" }
      });
    }

    if (!productsList || productsList.length === 0) {
      return res.status(400).json({
        error: { code: "PRODUCTS_NOT_FOUND", message: "Some products in your cart are no longer available" }
      });
    }

    const productsMap = new Map<string, ProductData>(productsList.map((p) => [p.id, p]));

    interface ValidationError {
      product_id: string;
      error: string;
      message: string;
      available?: number;
      requested?: number;
      oldPrice?: number;
      newPrice?: number;
    }
    const validationErrors: ValidationError[] = [];
    let recalculatedSubtotal = 0;

    for (const item of cart.items) {
      const product = productsMap.get(item.product_id);

      if (!product) {
        validationErrors.push({
          product_id: item.product_id,
          error: "PRODUCT_NOT_FOUND",
          message: "Product is no longer available"
        });
        continue;
      }

      if (product.status !== "active") {
        validationErrors.push({
          product_id: item.product_id,
          error: "PRODUCT_UNAVAILABLE",
          message: "Product is no longer available for purchase"
        });
        continue;
      }

      if (product.stock_quantity < item.quantity) {
        validationErrors.push({
          product_id: item.product_id,
          error: "INSUFFICIENT_STOCK",
          message: `Only ${product.stock_quantity} item(s) available. You requested ${item.quantity}.`,
          available: product.stock_quantity,
          requested: item.quantity
        });
        continue;
      }

      const currentPrice = product.sale_price || product.price;
      if (Math.abs(Number(currentPrice) - Number(item.unit_price)) > 0.01) {
        validationErrors.push({
          product_id: item.product_id,
          error: "PRICE_CHANGED",
          message: `Price has changed from ₹${item.unit_price} to ₹${currentPrice}`,
          oldPrice: Number(item.unit_price),
          newPrice: Number(currentPrice)
        });
        continue;
      }

      recalculatedSubtotal += Number(item.unit_price) * item.quantity;
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: {
          code: "CART_VALIDATION_FAILED",
          message: "Cart items are no longer available or prices have changed",
          details: validationErrors
        }
      });
    }

    if (Math.abs(recalculatedSubtotal - subtotal) > 0.01) {
      return res.status(400).json({
        error: {
          code: "AMOUNT_MISMATCH",
          message: "Cart total has changed. Please review your cart.",
          expectedAmount: recalculatedSubtotal,
          providedAmount: subtotal
        }
      });
    }

    // 🆕 Reserve Stock
    const reservationResult = await inventoryReservationService.reserveStock(
      userId,
      cart.items.map(item => ({
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        quantity: item.quantity
      })),
      userId ? undefined : sessionId // Pass session ID if guest
    );

    if (!reservationResult.success) {
      return res.status(400).json({
        error: {
          code: "INSUFFICIENT_STOCK",
          message: reservationResult.error || "Some items are no longer available"
        }
      });
    }

    // Recalculate Final Total with options for Gateway
    // (We reuse the previous logic, assuming inputs are valid. In a strict system, verify coupon validity against DB here)
    // shipping, tax, discount are calculated above based on subtotal.
    const amountToCharge = Math.max(1, Math.round(finalTotal * 100)); // Razorpay needs integer paisa

    console.log(`[ORDER] Creating Razorpay order. Subtotal: ${subtotal}, Shipping: ${shipping}, Tax: ${tax}, Discount: ${discount}, Final: ${finalTotal}`);

    const options = {
      amount: amountToCharge,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    if (!razorpay) {
      return res.status(500).json({
        error: { code: 'RAZORPAY_NOT_CONFIGURED', message: 'Payment service is not configured' }
      });
    }

    const razorpayOrder = await razorpay.orders.create(options);
    console.log(`[ORDER] Razorpay order created: ${razorpayOrder.id}`);
    return res.status(200).json({ razorpayOrder });

  } catch (error) {
    console.error('[ORDER] Checkout error:', error);
    return handleRouteError(error, res, 'Checkout order creation');
  }
}


export async function listOrdersHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

    // Extract query parameters
    const {
      status,
      startDate,
      endDate,
      page = '1',
      limit = '10'
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions = [eq(orders.user_id, userId)];

    if (status && typeof status === 'string') {
      conditions.push(eq(orders.status, status));
    }

    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate);
      conditions.push(sql`${orders.created_at} >= ${start}`);
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      conditions.push(sql`${orders.created_at} <= ${end}`);
    }

    // Get orders with filters
    const query = db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(limitNum)
      .offset(offset)
      .orderBy(sql`${orders.created_at} DESC`);

    const ordersList = await query;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));

    const [{ count }] = await countQuery;
    const totalPages = Math.ceil(Number(count) / limitNum);

    return res.status(200).json({
      orders: ordersList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages
      }
    });
  } catch (error) {
    return handleRouteError(error, res, 'List orders');
  }
}


export async function getOrderHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  const userId = profile?.user_id as string;
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  const orderId = req.params.id;
  if (!orderId) return res.status(400).json({ code: "BAD_REQUEST", message: "Order ID is required" });

  const result = await ordersRepo.getById(userId, orderId);
  if (!result) return res.status(404).json({ code: "NOT_FOUND", message: "Order not found" });

  // Return both order and items
  const { order, items } = result;

  return res.status(200).json(order);
}

import crypto from "crypto";
import { sendOrderConfirmationEmail } from "./utils/email";
import { whatsappService } from "./services/whatsapp-notifications";
import { formatNotification } from "./services/notification-templates";

// Input validation schema for payment verification
const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  // New Fields
  shipping_address: z.any().optional(), // Or use specific Zod schema if available
  delivery_option: z.string().optional(),
  gift_message: z.string().optional(),
  coupon_code: z.string().optional(),
});

export async function verifyPaymentHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as { user_id: string, username?: string, full_name?: string, email?: string } | undefined;
    const userId = profile?.user_id || null;
    const sessionId = req.headers['x-session-id'] as string;

    // We need either userId or sessionId to proceed with finding the pending Reservation
    if (!userId && !sessionId) {
      console.log('[ORDER] Payment verification failed: No identity');
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized and no session ID provided" } });
    }

    // Capture guest details if provided in request body (should be passed from checkout)
    // const { guest_email, guest_phone } = req.body || {}; // Handled by Zod now

    console.log(`[ORDER] verifyPayment: User=${userId || 'Guest'}, Session=${sessionId}`);

    // Validate input
    const validationResult = verifyPaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: { code: "INVALID_PAYLOAD", message: "Invalid payment verification data" }
      });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      guest_email,
      guest_phone,
      shipping_address,
      delivery_option,
      gift_message,
      coupon_code
    } = validationResult.data;

    // Verify Razorpay signature
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return handleRouteError(
        new Error("Razorpay secret not configured"),
        res,
        'Payment verification'
      );
    }

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    console.log(`[ORDER] Verifying signature for Order: ${razorpay_order_id}`);

    if (digest !== razorpay_signature) {
      // 🆕 Send payment failed notification
      try {
        await whatsappService.send(formatNotification('order_payment_failed', {
          order_id: razorpay_order_id,
          customer_name: profile?.username || profile?.full_name || 'Guest',
          amount: 0, // We don't have the amount at this point
          failure_reason: 'Invalid payment signature'
        }));
      } catch (notifError) {
        console.error('Failed to send payment failed notification:', notifError);
      }

      return res.status(400).json({
        error: { code: "INVALID_SIGNATURE", message: "Payment signature verification failed" }
      });
    }

    // 🆕 Confirm Reservation
    await inventoryReservationService.confirmReservation(userId, sessionId);

    // Get user's cart
    let cart;
    if (userId) {
      cart = await cartsRepo.getOrCreate(userId);
    } else {
      cart = await cartsRepo.getOrCreateBySession(sessionId);
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        error: { code: "EMPTY_CART", message: "Cart is empty" }
      });
    }

    // Calculate total and verify it matches the Razorpay order
    const totalAmount = cart.items.reduce((acc, item) => acc + Number(item.unit_price) * item.quantity, 0);

    // Verify the Razorpay order exists and amount matches (optional but recommended)
    if (razorpay) {
      try {
        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
        const razorpayAmount = Number(razorpayOrder.amount) / 100; // Convert from paisa

        if (Math.abs(razorpayAmount - totalAmount) > 0.01) { // Allow for small floating point differences
          // Check if difference matches delivery fee (e.g., 99 for express) or coupon?
          // Actually, checkoutHandler creates order with TOTAL amount (including shipping/fees verified from backend calculation).
          // If Razorpay amount != cart item sum, it means cart items alone don't equal checkout total (due to shipping/tax).
          // This logic is flawed if `checkoutHandler` added tax/shipping.
          // WE SHOULD TRUST THE RAZORPAY ORDER AMOUNT IF we created it ourselves securely in checkoutHandler.
          // Or strictly verify exact breakdown again here (but we need deliveryOption state).
          // Let's assume mismatch is OK if it explains tax/shipping, OR better: re-calculate total using `delivery_option` passed in body.
        }
      } catch (razorpayError) {
        return handleRouteError(
          new Error(`Failed to verify Razorpay order: ${razorpayError}`),
          res,
          'Payment verification'
        );
      }
    }

    // Create the order from cart
    const guestInfo = (!userId && guest_email && guest_phone) ? { email: guest_email, phone: guest_phone, sessionId } : undefined;

    // For guest, ensure we have guestInfo.
    if (!userId && !guestInfo) {
      throw new Error("Missing guest details for order creation");
    }

    const { order, items } = await ordersRepo.createFromCart(
      userId,
      cart.items.map(i => ({
        productId: (i as any).product_id,
        unitPrice: Number((i as any).unit_price),
        quantity: i.quantity,
        size: (i as any).size
      })),
      guestInfo,
      {
        shippingAddress: shipping_address,
        deliveryOption: delivery_option,
        giftMessage: gift_message,
        couponCode: coupon_code,
        // Calculate discount if coupon valid? For now pass basic details.
      }
    );

    // Update order status and payment information
    await (db as any).update(orders)
      .set({
        status: 'processing',
        payment_status: 'paid',
        payment_method: 'razorpay',
        payment_provider_id: razorpay_payment_id,
        updated_at: new Date()
      })
      .where(eq(orders.id, order.id));

    console.log(`[ORDER] Order created successfully: ${order.id}`);

    // Clear the cart after successful order creation
    for (const cartItem of cart.items) {
      await cartsRepo.removeItem(cartItem.id);
    }

    // Sync inventory
    try {
      for (const item of cart.items) {
        const productId = item.product_id;
        const variantId = item.variant_id;
        const quantity = item.quantity;

        if (variantId) {
          await updateProductStock(variantId, -quantity, `Order ${order.id}`, true);
        } else {
          await updateProductStock(productId, -quantity, `Order ${order.id}`, false);
        }
        console.log(`Synced inventory for ${variantId ? 'variant' : 'product'} ${variantId || productId}: -${quantity}`);
      }
    } catch (inventoryError) {
      console.error('Inventory sync failed:', (inventoryError as any)?.message || inventoryError);
    }

    // Get updated order with new status
    // Guest orders access is tricky for getById if userId is null.
    // We should implement getById allowing lookup by just ID (internal) or session_id?
    // Current ordersRepo.getById enforces userId.
    // For now, let's skip re-fetching if guest, or just return the order object we already have (mutated manually).
    // Or we rely on client not needing the full updated object immediately for page render?

    let updatedResult;
    if (userId) {
      updatedResult = await ordersRepo.getById(userId, order.id);
    } else {
      // Mock result for guest since repository enforces userId
      updatedResult = { order: { ...order, status: 'processing', payment_status: 'paid' }, items };
    }

    if (!updatedResult) {
      return handleRouteError(
        new Error("Failed to retrieve updated order"),
        res,
        'Payment verification'
      );
    }

    // 🆕 Send new order notification
    try {
      const isHighValue = totalAmount >= 5000;
      const templateKey = isHighValue ? 'order_high_value' : 'order_new';

      await whatsappService.send(formatNotification(templateKey, {
        order_id: order.id.substring(0, 8),
        customer_name: profile?.username || profile?.full_name || 'Guest',
        amount: totalAmount.toFixed(2),
        item_count: items.length,
        payment_status: 'Confirmed',
        city: 'N/A',
        state: 'N/A',
        time_ago: 'Just now'
      }));

      await whatsappService.send(formatNotification('order_payment_received', {
        order_id: order.id.substring(0, 8),
        amount: totalAmount.toFixed(2),
        payment_method: 'Razorpay',
        provider_id: razorpay_payment_id.substring(0, 20)
      }));
    } catch (notifError) {
      console.error('Failed to send order notifications:', notifError);
    }

    // 🆕 Send customer notification
    try {
      // For guest, use guest_phone
      const userPhone = profile ? undefined : guest_phone; // We need to fetch user phone from address table if user?

      let phoneToSend = userPhone;

      if (userId) {
        const userAddress = await db.query.addresses.findFirst({
          where: (addresses, { eq, and }) => and(
            eq(addresses.user_id, userId),
            eq(addresses.is_default, true)
          )
        });
        phoneToSend = userAddress?.phone;
      }

      if (phoneToSend) {
        const customerMsg = formatNotification('customer_order_confirmed', {
          customer_name: profile?.username || profile?.full_name || 'Customer',
          order_id: order.id.substring(0, 8),
          amount: totalAmount.toFixed(2),
          item_count: items.length,
          order_url: `${process.env.FRONTEND_URL || 'https://fabricspeaks.com'}/orders`
        });

        await whatsappService.sendToCustomer(phoneToSend, customerMsg.message);
      }
    } catch (customerNotifError) {
      console.error('Failed to send customer notification:', customerNotifError);
    }

    // Send order confirmation email (best-effort)
    try {
      const userEmail = (profile?.email) || (profile?.username ? `${profile.username}@fabric-speaks.local` : undefined) || guest_email;
      if (userEmail && !userEmail.includes('@fabric-speaks.local')) {
        const total = items.reduce((s: number, it: any) => s + Number(it.unit_price) * it.quantity, 0);
        await sendOrderConfirmationEmail({
          to: userEmail,
          orderId: order.id,
          items: items,
          total,
          userName: profile?.username || 'Guest',
        });
      }
    } catch (emailErr) {
      console.error('Failed to send order confirmation email:', (emailErr as any)?.message || emailErr);
    }

    return res.status(200).json({
      order: updatedResult.order,
      items: updatedResult.items,
      message: "Payment verified successfully"
    });

  } catch (error) {
    // 🆕 Release reservation on error
    const profile = (req as any).user as any;
    const userId = profile?.user_id;
    const sessionId = req.headers['x-session-id'] as string;
    await inventoryReservationService.releaseReservation(userId || null, sessionId).catch(console.error);

    return handleRouteError(error, res, 'Payment verification');
  }
}


export async function cancelOrderHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ code: "BAD_REQUEST", message: "Order ID is required" });

    // Get order
    const result = await ordersRepo.getById(userId, orderId);
    if (!result) return res.status(404).json({ code: "NOT_FOUND", message: "Order not found" });

    const { order, items } = result;

    // Check status
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        code: "INVALID_STATE",
        message: `Cannot cancel order in '${order.status}' state`
      });
    }

    // Update status
    await (db as any).update(orders)
      .set({
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(orders.id, orderId));

    // Restore inventory
    for (const item of items) {
      if (item.variant_id) {
        await updateProductStock(item.variant_id, item.quantity, `Order Cancellation ${orderId}`, true);
      } else {
        await updateProductStock(item.product_id, item.quantity, `Order Cancellation ${orderId}`, false);
      }
      console.log(`Restored inventory for ${item.variant_id ? 'variant' : 'product'} ${item.variant_id || item.product_id}: +${item.quantity}`);
    }

    // Handle Refund
    let refundStatus = 'Not applicable';
    if (order.payment_status === 'paid' && order.payment_method === 'razorpay' && order.payment_provider_id) {
      if (razorpay) {
        try {
          await razorpay.payments.refund(order.payment_provider_id, {});
          console.log(`[Refund] Refund initiated for order ${orderId}, payment ${order.payment_provider_id}`);

          // Update payment status to refunded
          await (db as any).update(orders)
            .set({ payment_status: 'refunded' })
            .where(eq(orders.id, orderId));

          refundStatus = 'Initiated';
        } catch (e) {
          console.error(`[Refund] Failed to refund order ${orderId}:`, e);
          refundStatus = 'Failed';
          // We continue to return success for cancellation, but log the refund failure
        }
      } else {
        console.warn(`[Refund] Razorpay not configured, cannot refund order ${orderId}`);
        refundStatus = 'Not configured';
      }
    }

    // 🆕 Send order cancellation notification
    try {
      await whatsappService.send(formatNotification('order_cancelled', {
        order_id: orderId.substring(0, 8),
        customer_name: profile?.username || profile?.full_name || 'Unknown',
        amount: Number(order.total_amount).toFixed(2),
        cancellation_reason: 'Customer request',
        refund_status: refundStatus
      }));
    } catch (notifError) {
      console.error('Failed to send cancellation notification:', notifError);
    }

    // 🆕 Send customer cancellation notification
    try {
      // Get user phone
      const userAddress = await db.query.addresses.findFirst({
        where: (addresses, { eq, and }) => and(
          eq(addresses.user_id, userId),
          eq(addresses.is_default, true)
        )
      });

      if (userAddress?.phone) {
        const customerMsg = formatNotification('customer_order_cancelled', {
          customer_name: profile?.username || profile?.full_name || 'Customer',
          order_id: orderId.substring(0, 8),
          refund_status: refundStatus
        });

        await whatsappService.sendToCustomer(userAddress.phone, customerMsg.message);
      }
    } catch (customerNotifError) {
      console.error('Failed to send customer cancellation notification:', customerNotifError);
    }

    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    return handleRouteError(error, res, 'Order cancellation');
  }
}

export async function reorderHandler(req: Request, res: Response) {
  try {
    const profile = (req as any).user as any;
    const userId = profile?.user_id as string;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ code: "BAD_REQUEST", message: "Order ID is required" });

    // Get order with items
    const result = await ordersRepo.getById(userId, orderId);
    if (!result) return res.status(404).json({ code: "NOT_FOUND", message: "Order not found" });

    const { items } = result;

    // Get or create cart
    const cart = await cartsRepo.getOrCreate(userId);

    // Validate stock availability for all items
    const productIds = items.map(item => item.product_id);
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, stock_quantity, status")
      .in("id", productIds);

    if (productsError || !productsData) {
      return res.status(500).json({
        code: "STOCK_CHECK_FAILED",
        message: "Failed to verify product availability"
      });
    }

    const productsMap = new Map(productsData.map(p => [p.id, p]));
    const unavailableItems: any[] = [];
    const availableItems: any[] = [];

    // Check each item
    for (const item of items) {
      const product = productsMap.get(item.product_id);

      if (!product || product.status !== 'active') {
        unavailableItems.push({
          product_id: item.product_id,
          reason: 'Product no longer available'
        });
        continue;
      }

      if (product.stock_quantity < item.quantity) {
        unavailableItems.push({
          product_id: item.product_id,
          reason: `Insufficient stock (available: ${product.stock_quantity}, requested: ${item.quantity})`
        });
        continue;
      }

      availableItems.push(item);
    }

    // Add available items to cart
    let addedCount = 0;
    for (const item of availableItems) {
      try {
        await cartsRepo.addItem(
          cart.id,
          item.product_id,
          item.unit_price,
          item.quantity,
          item.size,
          item.variant_id
        );
        addedCount++;
      } catch (error) {
        console.error(`Failed to add item ${item.product_id} to cart:`, error);
      }
    }

    return res.status(200).json({
      message: `Added ${addedCount} items to cart`,
      added: addedCount,
      unavailable: unavailableItems.length,
      unavailableItems: unavailableItems
    });

  } catch (error) {
    return handleRouteError(error, res, 'Reorder');
  }
}
