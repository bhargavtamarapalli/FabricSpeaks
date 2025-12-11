import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');
import type { Transporter } from 'nodemailer';
import { loggers } from '../utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      loggers.warn('Email service not configured - missing SMTP credentials');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.isConfigured = true;
      loggers.info('Email service initialized successfully');
    } catch (error) {
      loggers.error('Failed to initialize email service', error as Error);
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      loggers.warn('Email service not configured - email not sent', { to: options.to });
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@fabric-speaks.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      loggers.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      });

      return true;
    } catch (error) {
      loggers.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(to: string, orderData: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    total: string;
    shippingAddress: string;
  }): Promise<boolean> {
    const itemsHtml = orderData.items
      .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Order Confirmation</h1>
            <p>Dear ${orderData.customerName},</p>
            <p>Thank you for your order! Your order <strong>#${orderData.orderNumber}</strong> has been confirmed.</p>
            
            <h2 style="color: #2c3e50; margin-top: 30px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">₹${orderData.total}</td>
                </tr>
              </tfoot>
            </table>
            
            <h2 style="color: #2c3e50; margin-top: 30px;">Shipping Address</h2>
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              ${orderData.shippingAddress.replace(/\n/g, '<br>')}
            </p>
            
            <p style="margin-top: 30px;">
              We'll send you another email when your order ships.
            </p>
            
            <p>
              Best regards,<br>
              <strong>Fabric Speaks Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      html,
      text: `Order Confirmation\n\nDear ${orderData.customerName},\n\nYour order #${orderData.orderNumber} has been confirmed.\n\nTotal: ₹${orderData.total}\n\nThank you for shopping with Fabric Speaks!`
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Password Reset Request</h1>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="color: #e74c3c; margin-top: 30px;">
              <strong>This link will expire in 1 hour.</strong>
            </p>
            
            <p>If you didn't request a password reset, please ignore this email.</p>
            
            <p>
              Best regards,<br>
              <strong>Fabric Speaks Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: 'Password Reset Request - Fabric Speaks',
      html,
      text: `Password Reset Request\n\nHello ${userName},\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    });
  }

  /**
   * Send low stock alert to admin
   */
  async sendLowStockAlert(to: string, products: Array<{ name: string; sku: string; currentStock: number; threshold: number }>): Promise<boolean> {
    const productsHtml = products
      .map(p => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.sku}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #e74c3c; font-weight: bold;">${p.currentStock}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.threshold}</td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Low Stock Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">⚠️ Low Stock Alert</h1>
            <p>The following products are running low on stock:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">SKU</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Current Stock</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
            
            <p style="margin-top: 30px;">
              Please restock these items as soon as possible to avoid stockouts.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: '⚠️ Low Stock Alert - Fabric Speaks',
      html
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
