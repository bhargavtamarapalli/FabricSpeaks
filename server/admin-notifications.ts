/**
 * Admin Notification Management Routes
 * API endpoints for managing WhatsApp notifications and recipients
 */

import type { Request, Response } from "express";
import { db } from "./db/supabase";
import { 
  notificationRecipients, 
  notificationPreferences,
  adminNotifications 
} from "../shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { whatsappService } from "./services/whatsapp-notifications";
import { handleRouteError } from "./utils/errors";

// ==================== RECIPIENTS MANAGEMENT ====================

/**
 * List all notification recipients
 */
export async function listRecipientsHandler(req: Request, res: Response) {
  try {
    const recipients = await db
      .select()
      .from(notificationRecipients)
      .orderBy(desc(notificationRecipients.created_at));

    return res.json(recipients);
  } catch (error) {
    return handleRouteError(error, res, 'List recipients');
  }
}

/**
 * Create new notification recipient
 */
export async function createRecipientHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).user;
    const recipientData = req.body;

    const [recipient] = await db
      .insert(notificationRecipients)
      .values({
        ...recipientData,
        created_by: adminUser.user_id
      })
      .returning();

    return res.status(201).json(recipient);
  } catch (error) {
    return handleRouteError(error, res, 'Create recipient');
  }
}

/**
 * Update notification recipient
 */
export async function updateRecipientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updated] = await db
      .update(notificationRecipients)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(notificationRecipients.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Recipient not found' 
      });
    }

    return res.json(updated);
  } catch (error) {
    return handleRouteError(error, res, 'Update recipient');
  }
}

/**
 * Delete notification recipient
 */
export async function deleteRecipientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await db
      .delete(notificationRecipients)
      .where(eq(notificationRecipients.id, id));

    return res.json({ success: true });
  } catch (error) {
    return handleRouteError(error, res, 'Delete recipient');
  }
}

/**
 * Toggle recipient active status
 */
export async function toggleRecipientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [updated] = await db
      .update(notificationRecipients)
      .set({ 
        is_active,
        updated_at: new Date()
      })
      .where(eq(notificationRecipients.id, id))
      .returning();

    return res.json(updated);
  } catch (error) {
    return handleRouteError(error, res, 'Toggle recipient');
  }
}

// ==================== PREFERENCES MANAGEMENT ====================

/**
 * Get admin notification preferences
 */
export async function getPreferencesHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).user;

    let [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.user_id, adminUser.user_id));

    // Create default preferences if none exist
    if (!preferences) {
      [preferences] = await db
        .insert(notificationPreferences)
        .values({
          user_id: adminUser.user_id
        })
        .returning();
    }

    return res.json(preferences);
  } catch (error) {
    return handleRouteError(error, res, 'Get preferences');
  }
}

/**
 * Update admin notification preferences
 */
export async function updatePreferencesHandler(req: Request, res: Response) {
  try {
    const adminUser = (req as any).user;
    const updates = req.body;

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.user_id, adminUser.user_id));

    let preferences;
    
    if (existing) {
      // Update existing
      [preferences] = await db
        .update(notificationPreferences)
        .set({
          ...updates,
          updated_at: new Date()
        })
        .where(eq(notificationPreferences.user_id, adminUser.user_id))
        .returning();
    } else {
      // Create new
      [preferences] = await db
        .insert(notificationPreferences)
        .values({
          user_id: adminUser.user_id,
          channels: updates.channels || {},
          ...updates
        })
        .returning();
    }

    return res.json(preferences);
  } catch (error) {
    return handleRouteError(error, res, 'Update preferences');
  }
}

// ==================== NOTIFICATION HISTORY ====================

/**
 * List notification history
 */
export async function listNotificationsHandler(req: Request, res: Response) {
  try {
    const { 
      type, 
      priority, 
      status, 
      limit = 50, 
      offset = 0,
      days = 7 
    } = req.query;

    let query = db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.created_at))
      .limit(Number(limit))
      .offset(Number(offset));

    // Filter by date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    
    const conditions = [
      gte(adminNotifications.created_at, daysAgo)
    ];

    if (type) {
      conditions.push(eq(adminNotifications.type, type as string));
    }

    if (priority) {
      conditions.push(eq(adminNotifications.priority, priority as string));
    }

    if (status) {
      conditions.push(eq(adminNotifications.status, status as string));
    }

    const notifications = await db
      .select()
      .from(adminNotifications)
      .where(and(...conditions))
      .orderBy(desc(adminNotifications.created_at))
      .limit(Number(limit))
      .offset(Number(offset));

    return res.json(notifications);
  } catch (error) {
    return handleRouteError(error, res, 'List notifications');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationReadHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(adminNotifications)
      .set({ 
        read_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(adminNotifications.id, id))
      .returning();

    return res.json(updated);
  } catch (error) {
    return handleRouteError(error, res, 'Mark notification read');
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatsHandler(req: Request, res: Response) {
  try {
    const { days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const notifications = await db
      .select()
      .from(adminNotifications)
      .where(gte(adminNotifications.created_at, daysAgo));

    // Calculate statistics
    const stats = {
      total: notifications.length,
      by_type: {
        order: notifications.filter(n => n.type === 'order').length,
        inventory: notifications.filter(n => n.type === 'inventory').length,
        business: notifications.filter(n => n.type === 'business').length,
        security: notifications.filter(n => n.type === 'security').length,
      },
      by_priority: {
        critical: notifications.filter(n => n.priority === 'critical').length,
        important: notifications.filter(n => n.priority === 'important').length,
        info: notifications.filter(n => n.priority === 'info').length,
      },
      by_status: {
        sent: notifications.filter(n => n.delivery_status === 'sent').length,
        delivered: notifications.filter(n => n.delivery_status === 'delivered').length,
        failed: notifications.filter(n => n.delivery_status === 'failed').length,
        pending: notifications.filter(n => n.delivery_status === 'pending').length,
      },
      unread: notifications.filter(n => !n.read_at).length
    };

    return res.json(stats);
  } catch (error) {
    return handleRouteError(error, res, 'Get notification stats');
  }
}

// ==================== TEST NOTIFICATION ====================

/**
 * Send test notification
 */
export async function sendTestNotificationHandler(req: Request, res: Response) {
  try {
    const { whatsapp_number } = req.body;

    if (!whatsapp_number) {
      return res.status(400).json({
        code: 'INVALID_INPUT',
        message: 'WhatsApp number is required'
      });
    }

    await whatsappService.sendTest(whatsapp_number);

    return res.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    return handleRouteError(error, res, 'Send test notification');
  }
}
