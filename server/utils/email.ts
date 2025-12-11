import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || (smtpUser ?? "no-reply@fabric-speaks.local");

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
  // Do not throw — allow service to run without email in dev. Log a warning.
  console.warn("Email service not fully configured. SMTP emails will be disabled.");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: smtpHost ? { user: smtpUser, pass: smtpPass } : undefined,
});

async function sendMail(options: { to: string; subject: string; html: string; text?: string }) {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn("Skipping sendMail: SMTP not configured");
    return;
  }

  const mail = {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    text: options.text || options.html.replace(/<[^>]+>/g, ""),
    html: options.html,
  };

  // Simple retry logic
  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt++;
      // transporter.sendMail returns a Promise
      await transporter.sendMail(mail as any);
      return;
    } catch (err: any) {
      console.error(`Email send attempt ${attempt} failed:`, err?.message || err);
      if (attempt >= maxAttempts) throw err;
      // wait before retry
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

export async function sendOrderConfirmationEmail(opts: { to: string; orderId: string; items: any[]; total: number; userName?: string }) {
  const itemsHtml = opts.items.map(i => `<li>${i.quantity} × ${i.product_name || i.productId} — ₹${(Number(i.unit_price || i.price) * i.quantity).toFixed(2)}</li>`).join("");
  const html = `
    <h2>Thank you for your order${opts.userName ? `, ${opts.userName}` : ''}!</h2>
    <p>Your order <strong>#${opts.orderId}</strong> has been received and is being processed.</p>
    <ul>${itemsHtml}</ul>
    <p><strong>Total:</strong> ₹${opts.total.toFixed(2)}</p>
    <p>We will notify you when your order ships.</p>
  `;

  await sendMail({ to: opts.to, subject: `Order Confirmation — #${opts.orderId}`, html });
}

export async function sendOrderStatusUpdateEmail(opts: { to: string; orderId: string; status: string }) {
  const html = `
    <p>Your order <strong>#${opts.orderId}</strong> status has been updated to <strong>${opts.status}</strong>.</p>
  `;
  await sendMail({ to: opts.to, subject: `Order Update — #${opts.orderId}`, html });
}

export async function sendLowStockAlertEmail(opts: { to: string; products: { name: string; stock: number; threshold: number }[] }) {
  const itemsHtml = opts.products.map(p => `<li><strong>${p.name}</strong>: Stock ${p.stock} (Threshold: ${p.threshold})</li>`).join("");
  const html = `
    <h2>Low Stock Alert</h2>
    <p>The following products are running low on stock:</p>
    <ul>${itemsHtml}</ul>
    <p>Please restock immediately.</p>
  `;
  await sendMail({ to: opts.to, subject: `Low Stock Alert - ${opts.products.length} items`, html });
}

/**
 * Send "Back in Stock" notification email
 */
export async function sendBackInStockEmail(opts: { 
  to: string; 
  productName: string; 
  productId: string;
  productImage?: string;
  productPrice?: number;
  productUrl?: string;
}) {
  const imageHtml = opts.productImage 
    ? `<img src="${opts.productImage}" alt="${opts.productName}" style="max-width: 300px; height: auto; margin: 20px 0;" />`
    : '';
  
  const priceHtml = opts.productPrice 
    ? `<p style="font-size: 24px; color: #2563eb; font-weight: bold;">₹${opts.productPrice.toFixed(2)}</p>`
    : '';
  
  const ctaButton = opts.productUrl
    ? `<a href="${opts.productUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">Shop Now</a>`
    : '';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Good News! ${opts.productName} is Back in Stock! 🎉</h2>
      <p style="font-size: 16px; color: #4b5563;">
        The product you requested a notification for is now available.
      </p>
      ${imageHtml}
      <h3 style="color: #1f2937;">${opts.productName}</h3>
      ${priceHtml}
      <p style="color: #6b7280;">
        Hurry! Stock is limited. Order now to avoid missing out again.
      </p>
      ${ctaButton}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af;">
        You received this email because you requested to be notified when this product is back in stock.
      </p>
    </div>
  `;

  await sendMail({ 
    to: opts.to, 
    subject: `${opts.productName} is Back in Stock! 🎉`, 
    html 
  });
}

/**
 * Send shipping confirmation email with tracking information
 */
export async function sendShippingConfirmationEmail(opts: {
  to: string;
  orderId: string;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: Date;
  items: any[];
  shippingAddress?: string;
}) {
  const trackingHtml = opts.trackingNumber && opts.courier
    ? `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">Tracking Information</h3>
        <p style="margin: 10px 0;"><strong>Tracking Number:</strong> ${opts.trackingNumber}</p>
        <p style="margin: 10px 0;"><strong>Courier:</strong> ${opts.courier}</p>
        ${opts.estimatedDelivery ? `<p style="margin: 10px 0;"><strong>Estimated Delivery:</strong> ${opts.estimatedDelivery.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
      </div>
    `
    : '';

  const itemsHtml = opts.items.map(i => `<li>${i.quantity} × ${i.product_name || i.productId}</li>`).join('');
  
  const addressHtml = opts.shippingAddress
    ? `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937;">Shipping Address</h3>
        <p style="color: #4b5563; white-space: pre-line;">${opts.shippingAddress}</p>
      </div>
    `
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Your Order Has Been Shipped! 📦</h2>
      <p style="font-size: 16px; color: #4b5563;">
        Great news! Your order <strong>#${opts.orderId}</strong> is on its way to you.
      </p>
      
      ${trackingHtml}
      
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937;">Order Items</h3>
        <ul style="color: #4b5563;">
          ${itemsHtml}
        </ul>
      </div>
      
      ${addressHtml}
      
      <p style="color: #6b7280; margin-top: 30px;">
        You can track your shipment using the tracking number provided above.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af;">
        If you have any questions about your order, please contact our support team.
      </p>
    </div>
  `;

  await sendMail({
    to: opts.to,
    subject: `Your Order #${opts.orderId} Has Been Shipped! 📦`,
    html
  });
}

export default { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendLowStockAlertEmail, sendBackInStockEmail, sendShippingConfirmationEmail };
