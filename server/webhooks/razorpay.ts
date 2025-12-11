import type { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/supabase';
import { orders } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { loggers } from '../utils/logger';
import { emailService } from '../services/email';

/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay
 * 
 * Events handled:
 * - payment.authorized
 * - payment.captured
 * - payment.failed
 * - order.paid
 * - refund.created
 */
export async function razorpayWebhookHandler(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      loggers.warn('Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    
    if (!webhookSignature) {
      loggers.security('Razorpay webhook received without signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      loggers.security('Invalid Razorpay webhook signature', {
        expected: expectedSignature.substring(0, 10),
        received: webhookSignature.substring(0, 10)
      });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process webhook event
    const event = req.body;
    const eventType = event.event;
    const payload = event.payload;

    loggers.info('Razorpay webhook received', {
      event: eventType,
      paymentId: payload?.payment?.entity?.id,
      orderId: payload?.order?.entity?.id
    });

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'order.paid':
        await handleOrderPaid(payload);
        break;

      case 'refund.created':
        await handleRefundCreated(payload);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;

      default:
        loggers.info('Unhandled Razorpay webhook event', { event: eventType });
    }

    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    loggers.error('Razorpay webhook processing failed', error as Error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment.entity;
  const paymentId = payment.id;
  const orderId = payment.order_id;
  const amount = payment.amount / 100; // Convert from paisa

  loggers.info('Payment captured', { paymentId, orderId, amount });

  // Find order by payment_provider_id
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.payment_provider_id, paymentId))
    .limit(1);

  if (!order) {
    loggers.warn('Order not found for captured payment', { paymentId, orderId });
    return;
  }

  // Update order status
  await db
    .update(orders)
    .set({
      payment_status: 'paid',
      status: 'processing',
      updated_at: new Date()
    })
    .where(eq(orders.id, order.id));

  loggers.info('Order updated after payment capture', { orderId: order.id });

  // Send confirmation email
  try {
    if (order.user_id) {
      // Get user email from profiles
      const [profile] = await db
        .select()
        .from('profiles' as any)
        .where(eq('user_id' as any, order.user_id))
        .limit(1);

      if (profile && profile.email) {
        await emailService.sendOrderConfirmation(profile.email, {
          orderNumber: order.id.substring(0, 8),
          customerName: profile.full_name || profile.username,
          items: [], // TODO: Fetch order items
          total: order.total_amount,
          shippingAddress: order.shipping_address_id || 'N/A'
        });
      }
    }
  } catch (emailError) {
    loggers.error('Failed to send payment confirmation email', emailError as Error);
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload: any) {
  const payment = payload.payment.entity;
  const paymentId = payment.id;
  const orderId = payment.order_id;
  const errorCode = payment.error_code;
  const errorDescription = payment.error_description;

  loggers.warn('Payment failed', {
    paymentId,
    orderId,
    errorCode,
    errorDescription
  });

  // Find order by Razorpay order ID (stored in receipt or notes)
  // Since we don't have direct mapping, log for manual review
  loggers.info('Payment failure requires manual review', {
    razorpayOrderId: orderId,
    errorCode,
    errorDescription
  });

  // TODO: Send notification to admin about failed payment
}

/**
 * Handle order.paid event
 */
async function handleOrderPaid(payload: any) {
  const order = payload.order.entity;
  const orderId = order.id;
  const amount = order.amount / 100;

  loggers.info('Order paid', { orderId, amount });

  // This event confirms the order is fully paid
  // Usually handled by payment.captured, but good for reconciliation
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(payload: any) {
  const refund = payload.refund.entity;
  const paymentId = refund.payment_id;
  const refundId = refund.id;
  const amount = refund.amount / 100;

  loggers.info('Refund created', { refundId, paymentId, amount });

  // Find order by payment ID
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.payment_provider_id, paymentId))
    .limit(1);

  if (!order) {
    loggers.warn('Order not found for refund', { paymentId, refundId });
    return;
  }

  // Update order payment status
  await db
    .update(orders)
    .set({
      payment_status: 'refund_pending',
      updated_at: new Date()
    })
    .where(eq(orders.id, order.id));

  loggers.info('Order updated after refund creation', { orderId: order.id });
}

/**
 * Handle refund.processed event
 */
async function handleRefundProcessed(payload: any) {
  const refund = payload.refund.entity;
  const paymentId = refund.payment_id;
  const refundId = refund.id;
  const amount = refund.amount / 100;

  loggers.info('Refund processed', { refundId, paymentId, amount });

  // Find order by payment ID
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.payment_provider_id, paymentId))
    .limit(1);

  if (!order) {
    loggers.warn('Order not found for processed refund', { paymentId, refundId });
    return;
  }

  // Update order payment status
  await db
    .update(orders)
    .set({
      payment_status: 'refunded',
      updated_at: new Date()
    })
    .where(eq(orders.id, order.id));

  loggers.info('Order updated after refund processed', { orderId: order.id });

  // Send refund confirmation email
  try {
    if (order.user_id) {
      const [profile] = await db
        .select()
        .from('profiles' as any)
        .where(eq('user_id' as any, order.user_id))
        .limit(1);

      if (profile && profile.email) {
        // TODO: Create refund confirmation email template
        loggers.info('Refund confirmation email should be sent', {
          email: profile.email,
          orderId: order.id,
          amount
        });
      }
    }
  } catch (emailError) {
    loggers.error('Failed to send refund confirmation email', emailError as Error);
  }
}
