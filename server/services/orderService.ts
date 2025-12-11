/**
 * Enhanced Orders Service with Transaction Support
 * Handles order creation with atomic stock deduction and payment idempotency
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase as db } from '../db/supabase';
import { loggers } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { withTransaction, deductStock, restoreStock } from '../db/transaction';
import { logAuditEvent } from '../utils/auditLog';

/**
 * Razorpay configuration
 */
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

if (!razorpay) {
  loggers.warn('Razorpay not configured: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing');
}

/**
 * Cart item interface
 */
export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  size?: string;
}

/**
 * Order creation data
 */
export interface CreateOrderData {
  userId: string;
  cartId: string;
  addressId: string;
  items: CartItem[];
  totalAmount: number;
  razorpayOrderId: string;
}

/**
 * Payment verification data
 */
export interface PaymentVerificationData {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

/**
 * Validate cart items against current inventory and prices
 * 
 * @param items - Cart items to validate
 * @returns Validation result with errors if any
 */
export async function validateCartItems(items: CartItem[]): Promise<{
  isValid: boolean;
  errors: any[];
  recalculatedTotal: number;
}> {
  const errors: any[] = [];
  let recalculatedTotal = 0;

  try {
    // Get all variant IDs
    const variantIds = items.map(item => item.variant_id);

    // Fetch variants with product info
    const { data: variants, error } = await db
      .from('product_variants')
      .select(`
        id,
        product_id,
        stock_quantity,
        price,
        products:product_id (
          id,
          name,
          status,
          price,
          sale_price
        )
      `)
      .in('id', variantIds);

    if (error) {
      loggers.error('Failed to fetch variants for validation', { error: error.message });
      throw AppError.internal('Failed to validate cart items');
    }

    if (!variants || variants.length === 0) {
      throw AppError.badRequest('No valid products found in cart');
    }

    // Create a map for quick lookup
    const variantsMap = new Map(variants.map(v => [v.id, v]));

    // Validate each item
    for (const item of items) {
      const variant = variantsMap.get(item.variant_id);

      if (!variant) {
        errors.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          error: 'VARIANT_NOT_FOUND',
          message: 'Product variant is no longer available',
        });
        continue;
      }

      const product = (variant as any).products;

      if (!product || product.status !== 'active') {
        errors.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          error: 'PRODUCT_UNAVAILABLE',
          message: 'Product is no longer available for purchase',
        });
        continue;
      }

      // Check stock
      if (variant.stock_quantity < item.quantity) {
        errors.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          error: 'INSUFFICIENT_STOCK',
          message: `Only ${variant.stock_quantity} item(s) available. You requested ${item.quantity}.`,
          available: variant.stock_quantity,
          requested: item.quantity,
        });
        continue;
      }

      // Check price
      const currentPrice = variant.price || product.sale_price || product.price;
      if (Math.abs(Number(currentPrice) - Number(item.unit_price)) > 0.01) {
        errors.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          error: 'PRICE_CHANGED',
          message: `Price has changed from ₹${item.unit_price} to ₹${currentPrice}`,
          oldPrice: item.unit_price,
          newPrice: currentPrice,
        });
        continue;
      }

      recalculatedTotal += Number(item.unit_price) * item.quantity;
    }

    return {
      isValid: errors.length === 0,
      errors,
      recalculatedTotal,
    };
  } catch (error) {
    loggers.error('Cart validation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create Razorpay order
 * 
 * @param amount - Order amount in INR
 * @returns Razorpay order
 */
export async function createRazorpayOrder(amount: number): Promise<any> {
  if (!razorpay) {
    throw AppError.internal('Payment service is not configured', {
      code: 'RAZORPAY_NOT_CONFIGURED',
    });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    loggers.info('Razorpay order created', {
      orderId: order.id,
      amount: order.amount,
    });

    return order;
  } catch (error) {
    loggers.error('Failed to create Razorpay order', {
      error: error instanceof Error ? error.message : String(error),
      amount,
    });
    throw AppError.internal('Failed to create payment order', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Verify Razorpay payment signature
 * 
 * @param data - Payment verification data
 * @returns true if signature is valid
 */
export function verifyPaymentSignature(data: PaymentVerificationData): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw AppError.internal('Razorpay secret not configured');
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    const isValid = digest === razorpaySignature;

    if (!isValid) {
      loggers.warn('Payment signature verification failed', {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      });
    }

    return isValid;
  } catch (error) {
    loggers.error('Payment signature verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Create order with atomic stock deduction
 * Uses database transaction to ensure data consistency
 * 
 * @param data - Order creation data
 * @returns Created order
 */
export async function createOrderWithStockDeduction(
  data: CreateOrderData
): Promise<any> {
  const { userId, cartId, addressId, items, totalAmount, razorpayOrderId } = data;

  try {
    loggers.info('Creating order with stock deduction', {
      userId,
      itemCount: items.length,
      totalAmount,
    });

    // Check for duplicate payment
    const { data: existingOrder, error: duplicateCheckError } = await db
      .from('orders')
      .select('id, status')
      .eq('razorpay_order_id', razorpayOrderId)
      .single();

    if (existingOrder) {
      loggers.warn('Duplicate payment attempt detected', {
        orderId: existingOrder.id,
        razorpayOrderId,
      });
      throw new AppError(
        'This payment has already been processed',
        409,
        'DUPLICATE_PAYMENT',
        { orderId: existingOrder.id }
      );
    }

    // Use database function for atomic order creation
    const { data: orderId, error } = await db.rpc('create_order_with_stock_deduction', {
      p_user_id: userId,
      p_cart_id: cartId,
      p_address_id: addressId,
      p_total_amount: totalAmount,
      p_razorpay_order_id: razorpayOrderId,
      p_cart_items: JSON.stringify(items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.unit_price,
      }))),
    });

    if (error) {
      loggers.error('Order creation failed', {
        error: error.message,
        userId,
        razorpayOrderId,
      });

      // Check if it's a stock issue
      if (error.message.includes('Insufficient stock')) {
        throw new AppError(
          'One or more items are out of stock',
          400,
          'INSUFFICIENT_STOCK',
          { originalError: error.message }
        );
      }

      throw new AppError(
        'Failed to create order',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    loggers.info('Order created successfully', {
      orderId,
      userId,
      totalAmount,
    });

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'CREATE',
      resourceType: 'ORDER',
      resourceId: orderId as string,
    }).catch((err: any) => {
      loggers.error('Failed to log audit event', { error: err.message });
    });

    // Fetch and return the created order
    const { data: order, error: fetchError } = await db
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*),
          product_variants (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      loggers.error('Failed to fetch created order', {
        error: fetchError?.message,
        orderId,
      });
      throw AppError.internal('Order created but failed to retrieve details');
    }

    return order;
  } catch (error) {
    loggers.error('Order creation exception', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}

/**
 * Update order payment status
 * 
 * @param orderId - Order ID
 * @param paymentId - Razorpay payment ID
 * @returns Updated order
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentId: string
): Promise<any> {
  try {
    const { data, error } = await db
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        payment_method: 'razorpay',
        razorpay_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      loggers.error('Failed to update order payment status', {
        error: error.message,
        orderId,
        paymentId,
      });
      throw AppError.internal('Failed to update order status');
    }

    loggers.info('Order payment status updated', {
      orderId,
      paymentId,
    });

    return data;
  } catch (error) {
    loggers.error('Order payment update exception', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
    });
    throw error;
  }
}

/**
 * Cancel order and restore stock
 * 
 * @param orderId - Order ID
 * @param userId - User ID (for authorization)
 * @returns Cancelled order
 */
export async function cancelOrder(orderId: string, userId: string): Promise<any> {
  try {
    loggers.info('Cancelling order', { orderId, userId });

    // Get order with items
    const { data: order, error: fetchError } = await db
      .from('orders')
      .select(`
        *,
        order_items (
          variant_id,
          quantity
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      throw AppError.notFound('Order not found');
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      throw AppError.badRequest('Order cannot be cancelled', {
        currentStatus: order.status,
      });
    }

    // Restore stock for each item
    const orderItems = (order as any).order_items || [];
    for (const item of orderItems) {
      await restoreStock(item.variant_id, item.quantity);
    }

    // Update order status
    const { data: cancelledOrder, error: updateError } = await db
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw AppError.internal('Failed to cancel order');
    }

    loggers.info('Order cancelled successfully', { orderId });

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'UPDATE',
      resourceType: 'ORDER',
      resourceId: orderId,
      changes: { status: 'cancelled' },
    }).catch((err: any) => {
      loggers.error('Failed to log audit event', { error: err.message });
    });

    return cancelledOrder;
  } catch (error) {
    loggers.error('Order cancellation failed', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      userId,
    });
    throw error;
  }
}
