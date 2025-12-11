/**
 * WhatsApp Notification Service
 * Handles sending notifications via WhatsApp Business API
 */

import { db } from "../db/supabase";
import { 
  adminNotifications, 
  notificationRecipients, 
  notificationPreferences 
} from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export enum NotificationType {
  ORDER = 'order',
  INVENTORY = 'inventory',
  BUSINESS = 'business',
  SECURITY = 'security'
}

export enum Priority {
  CRITICAL = 'critical',
  IMPORTANT = 'important',
  INFO = 'info'
}

export interface NotificationData {
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  data?: any;
  tags?: string[];
}

export interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  phoneNumberId: string;
}

class WhatsAppNotificationService {
  private config: WhatsAppConfig;
  
  constructor() {
    this.config = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      apiKey: process.env.WHATSAPP_API_KEY || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    };
  }

  /**
   * Send notification to all active recipients
   */
  async send(notification: NotificationData): Promise<void> {
    try {
      // Get active recipients
      const recipients = await this.getEligibleRecipients(notification);
      
      if (recipients.length === 0) {
        console.log(`No eligible recipients for ${notification.type} notification`);
        return;
      }

      // Check if should batch or send immediately
      if (this.shouldBatch(notification.priority)) {
        await this.addToBatchQueue(notification, recipients);
      } else {
        await this.sendImmediately(notification, recipients);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification directly to a customer
   */
  async sendToCustomer(phoneNumber: string, message: string): Promise<void> {
    try {
      await this.sendWhatsAppMessage(phoneNumber, message);
      console.log(`Sent customer notification to ${phoneNumber}`);
    } catch (error) {
      console.error(`Failed to send customer notification to ${phoneNumber}:`, error);
      // Don't throw to avoid disrupting the main flow
    }
  }

  /**
   * Get recipients eligible for this notification
   */
  private async getEligibleRecipients(
    notification: NotificationData
  ): Promise<any[]> {
    const recipients = await db
      .select()
      .from(notificationRecipients)
      .where(eq(notificationRecipients.is_active, true));

    return recipients.filter(recipient => {
      // Check if notification type is enabled
      const types = recipient.notification_types as any;
      if (!types[notification.type]) return false;

      // Check priority threshold
      const priorityLevels = { info: 0, important: 1, critical: 2 };
      const recipientThreshold = priorityLevels[recipient.priority_threshold as keyof typeof priorityLevels];
      const notificationPriority = priorityLevels[notification.priority];
      
      if (notificationPriority < recipientThreshold) return false;

      // Check quiet hours
      if (recipient.quiet_hours_enabled && this.isQuietHours(
        recipient.quiet_hours_start,
        recipient.quiet_hours_end
      )) {
        return false;
      }

      return true;
    });
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(start: string | null, end: string | null): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Determine if notification should be batched
   */
  private shouldBatch(priority: Priority): boolean {
    // Critical notifications are never batched
    if (priority === Priority.CRITICAL) return false;
    
    // Important and Info can be batched based on preferences
    return true;
  }

  /**
   * Add notification to batch queue
   */
  private async addToBatchQueue(
    notification: NotificationData,
    recipients: any[]
  ): Promise<void> {
    // Implementation for batching logic
    console.log(`Added ${notification.type} notification to batch queue`);
    
    // Store in database for later processing
    for (const recipient of recipients) {
      await db.insert(adminNotifications).values({
        notification_type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        tags: notification.tags || [],
        recipient_id: null,
        recipient_number: recipient.whatsapp_number,
        delivery_status: 'pending'
      });
    }
  }

  /**
   * Send notification immediately
   */
  private async sendImmediately(
    notification: NotificationData,
    recipients: any[]
  ): Promise<void> {
    const formattedMessage = this.formatMessage(notification);

    for (const recipient of recipients) {
      try {
        // Send via WhatsApp API
        const messageId = await this.sendWhatsAppMessage(
          recipient.whatsapp_number,
          formattedMessage
        );

        // Log notification
        await db.insert(adminNotifications).values({
          notification_type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          tags: notification.tags || [],
          recipient_id: null,
          recipient_number: recipient.whatsapp_number,
          whatsapp_message_id: messageId,
          sent_at: new Date(),
          delivery_status: 'sent'
        });

        console.log(`Sent ${notification.type} notification to ${recipient.name}`);
      } catch (error) {
        console.error(`Failed to send to ${recipient.name}:`, error);
        
        // Log failure
        await db.insert(adminNotifications).values({
          notification_type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          tags: notification.tags || [],
          recipient_id: null,
          recipient_number: recipient.whatsapp_number,
          delivery_status: 'failed',
          failure_reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Format notification message with category and priority
   */
  private formatMessage(notification: NotificationData): string {
    const emoji = this.getTypeEmoji(notification.type);
    const priorityEmoji = this.getPriorityEmoji(notification.priority);
    const typeLabel = notification.type.toUpperCase();
    const priorityLabel = notification.priority.toUpperCase();

    return `
${emoji}${priorityEmoji} [${typeLabel}-${priorityLabel}] ${notification.title}

${notification.message}

━━━━━━━━━━━━━━━━
Fabric Speaks Admin Alert
    `.trim();
  }

  /**
   * Get emoji for notification type
   */
  private getTypeEmoji(type: NotificationType): string {
    const emojis = {
      [NotificationType.ORDER]: '🛍️',
      [NotificationType.INVENTORY]: '📦',
      [NotificationType.BUSINESS]: '📊',
      [NotificationType.SECURITY]: '🔒'
    };
    return emojis[type] || '📱';
  }

  /**
   * Get emoji for priority level
   */
  private getPriorityEmoji(priority: Priority): string {
    const emojis = {
      [Priority.CRITICAL]: '🔴',
      [Priority.IMPORTANT]: '🟡',
      [Priority.INFO]: '🟢'
    };
    return emojis[priority] || '⚪';
  }

  /**
   * Send message via WhatsApp Business API
   */
  private async sendWhatsAppMessage(
    phoneNumber: string,
    message: string
  ): Promise<string> {
    // If no API key configured, log to console (development mode)
    if (!this.config.apiKey || !this.config.phoneNumberId) {
      console.log('='.repeat(50));
      console.log('WhatsApp Message (DEV MODE)');
      console.log('To:', phoneNumber);
      console.log('Message:');
      console.log(message);
      console.log('='.repeat(50));
      return `dev_${Date.now()}`;
    }

    // Production: Send via WhatsApp Business API
    const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    const data = await response.json();
    return data.messages[0].id;
  }

  /**
   * Send test notification
   */
  async sendTest(recipientNumber: string): Promise<void> {
    const testNotification: NotificationData = {
      type: NotificationType.SECURITY,
      priority: Priority.INFO,
      title: 'Test Notification',
      message: 'This is a test notification from Fabric Speaks. If you received this, WhatsApp notifications are working correctly!',
      data: { test: true },
      tags: ['test']
    };

    const formattedMessage = this.formatMessage(testNotification);
    await this.sendWhatsAppMessage(recipientNumber, formattedMessage);
  }
}

export const whatsappService = new WhatsAppNotificationService();
