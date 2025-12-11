/**
 * WhatsApp Notification Templates
 * Pre-defined message formats for different notification types
 */

import { NotificationType, Priority } from './whatsapp-notifications';

export interface TemplateData {
  [key: string]: any;
}

export interface NotificationTemplate {
  type: NotificationType;
  priority: Priority;
  format: (data: TemplateData) => { title: string; message: string };
}

export const notificationTemplates = {
  // ==================== ORDER NOTIFICATIONS ====================
  
  order_new: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'New Order Placed',
      message: `
Order: #${data.order_id}
Customer: ${data.customer_name}
Amount: ₹${data.amount}
Items: ${data.item_count}
Payment: ${data.payment_status}

📍 ${data.city}, ${data.state}
⏰ ${data.time_ago}
      `.trim()
    })
  },

  order_payment_received: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Payment Received',
      message: `
Order: #${data.order_id}
Amount: ₹${data.amount}
Method: ${data.payment_method}
Provider ID: ${data.provider_id}

✅ Payment confirmed
      `.trim()
    })
  },

  order_shipped: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Order Shipped! 🚚',
      message: `
Order: #${data.order_id}
Courier: ${data.courier}
Tracking: ${data.tracking_number}
Expected: ${data.estimated_delivery || 'Soon'}

Track here: ${data.tracking_url || 'N/A'}

📦 Your package is on the way!
      `.trim()
    })
  },

  order_payment_failed: {
    type: NotificationType.ORDER,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'Payment Failed',
      message: `
Order: #${data.order_id}
Customer: ${data.customer_name}
Amount: ₹${data.amount}
Reason: ${data.failure_reason}

⚠️ Action Required
Customer may need assistance
      `.trim()
    })
  },

  order_cancelled: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Order Cancelled',
      message: `
Order: #${data.order_id}
Customer: ${data.customer_name}
Amount: ₹${data.amount}
Reason: ${data.cancellation_reason}

${data.refund_status ? `💰 Refund: ${data.refund_status}` : ''}
      `.trim()
    })
  },

  order_high_value: {
    type: NotificationType.ORDER,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'High Value Order',
      message: `
Order: #${data.order_id}
Customer: ${data.customer_name}
Amount: ₹${data.amount} 💎

Items: ${data.item_count}
Payment: ${data.payment_status}

🎯 VIP Customer Alert
      `.trim()
    })
  },

  customer_order_confirmed: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Order Confirmed! 🎉',
      message: `
Hi ${data.customer_name},

Thank you for your order! 🛍️

Order: #${data.order_id}
Amount: ₹${data.amount}
Items: ${data.item_count}

We will notify you once your order is shipped.

View Order: ${data.order_url || 'https://fabricspeaks.com/orders'}
      `.trim()
    })
  },

  customer_order_cancelled: {
    type: NotificationType.ORDER,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Order Cancelled',
      message: `
Hi ${data.customer_name},

Your order #${data.order_id} has been cancelled as requested.

Refund Status: ${data.refund_status}

If you have any questions, please contact our support.
      `.trim()
    })
  },

  // ==================== INVENTORY NOTIFICATIONS ====================

  inventory_low_stock: {
    type: NotificationType.INVENTORY,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Low Stock Alert',
      message: `
Product: ${data.product_name}
${data.variant ? `Variant: ${data.variant}` : ''}
Current: ${data.current_stock} units
Threshold: ${data.threshold} units

📈 Last 7 days sold: ${data.weekly_sales || 'N/A'}
📊 Trend: ${data.trend || 'Stable'}
      `.trim()
    })
  },

  inventory_out_of_stock: {
    type: NotificationType.INVENTORY,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'Out of Stock',
      message: `
Product: ${data.product_name}
${data.variant ? `Variant: ${data.variant}` : ''}
Last Sold: ${data.last_sold_time}

🔥 Demand Level: ${data.demand_level || 'High'}

⚠️ Immediate restocking recommended
      `.trim()
    })
  },

  inventory_restocked: {
    type: NotificationType.INVENTORY,
    priority: Priority.INFO,
    format: (data: TemplateData) => ({
      title: 'Inventory Restocked',
      message: `
Product: ${data.product_name}
${data.variant ? `Variant: ${data.variant}` : ''}
Added: ${data.quantity_added} units
New Total: ${data.new_stock} units

✅ Stock updated successfully
      `.trim()
    })
  },

  inventory_high_demand: {
    type: NotificationType.INVENTORY,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'High Demand Alert',
      message: `
Product: ${data.product_name}
Sold Today: ${data.sold_today} units
Current Stock: ${data.current_stock} units

🔥 TRENDING PRODUCT
Consider increasing stock levels
      `.trim()
    })
  },

  // ==================== BUSINESS INTELLIGENCE ====================

  business_daily_report: {
    type: NotificationType.BUSINESS,
    priority: Priority.INFO,
    format: (data: TemplateData) => ({
      title: 'Daily Sales Report',
      message: `
Date: ${data.date}
━━━━━━━━━━━━━━━━
📦 Orders: ${data.order_count}
💰 Revenue: ₹${data.revenue}
👥 New Customers: ${data.new_customers}
⭐ Avg Rating: ${data.avg_rating || 'N/A'}

🔥 Top Product: ${data.top_product}
📈 Conversion: ${data.conversion_rate}%

${data.notes || ''}
      `.trim()
    })
  },

  business_weekly_report: {
    type: NotificationType.BUSINESS,
    priority: Priority.INFO,
    format: (data: TemplateData) => ({
      title: 'Weekly Performance Report',
      message: `
Week: ${data.week_start} - ${data.week_end}
━━━━━━━━━━━━━━━━
📦 Total Orders: ${data.order_count}
💰 Total Revenue: ₹${data.revenue}
📊 Avg Order Value: ₹${data.avg_order_value}
👥 New Customers: ${data.new_customers}

🔥 Top 3 Products:
1. ${data.top_products[0]}
2. ${data.top_products[1]}
3. ${data.top_products[2]}

📈 vs Last Week: ${data.growth_percentage}%
      `.trim()
    })
  },

  business_milestone: {
    type: NotificationType.BUSINESS,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Milestone Achieved! 🎉',
      message: `
${data.milestone_title}

${data.milestone_description}

🎯 Achievement unlocked!
${data.celebration_message || 'Keep up the great work!'}
      `.trim()
    })
  },

  // ==================== SECURITY ALERTS ====================

  security_failed_login: {
    type: NotificationType.SECURITY,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'Failed Login Attempts',
      message: `
Account: ${data.username}
Attempts: ${data.attempt_count}
IP Address: ${data.ip_address}
${data.location ? `Location: ${data.location}` : ''}
Time: ${data.time}

⚠️ Possible security breach
Review and take action if suspicious
      `.trim()
    })
  },

  security_admin_action: {
    type: NotificationType.SECURITY,
    priority: Priority.INFO,
    format: (data: TemplateData) => ({
      title: 'Admin Action Logged',
      message: `
Admin: ${data.admin_name}
Action: ${data.action_type}
Target: ${data.target}
Time: ${data.time}

${data.details || ''}
      `.trim()
    })
  },

  security_suspicious_order: {
    type: NotificationType.SECURITY,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'Suspicious Order Detected',
      message: `
Order: #${data.order_id}
Customer: ${data.customer_name}
Amount: ₹${data.amount}

⚠️ Red Flags:
${data.red_flags.map((flag: string) => `• ${flag}`).join('\n')}

Review order before processing
      `.trim()
    })
  },

  security_price_change: {
    type: NotificationType.SECURITY,
    priority: Priority.IMPORTANT,
    format: (data: TemplateData) => ({
      title: 'Product Price Changed',
      message: `
Product: ${data.product_name}
Old Price: ₹${data.old_price}
New Price: ₹${data.new_price}
Change: ${data.change_percentage}%

Changed By: ${data.changed_by}
Time: ${data.time}
      `.trim()
    })
  },

  // ==================== SYSTEM ALERTS ====================

  system_error: {
    type: NotificationType.SECURITY,
    priority: Priority.CRITICAL,
    format: (data: TemplateData) => ({
      title: 'System Error',
      message: `
Error Type: ${data.error_type}
Component: ${data.component}
Time: ${data.time}

${data.error_message}

${data.stack_trace ? '⚠️ Check logs for details' : ''}
      `.trim()
    })
  }
};

/**
 * Get template by key
 */
export function getTemplate(key: keyof typeof notificationTemplates): NotificationTemplate {
  return notificationTemplates[key];
}

/**
 * Format notification using template
 */
export function formatNotification(
  templateKey: keyof typeof notificationTemplates,
  data: TemplateData
) {
  const template = getTemplate(templateKey);
  const { title, message } = template.format(data);
  
  return {
    type: template.type,
    priority: template.priority,
    title,
    message,
    data,
    tags: [templateKey]
  };
}
