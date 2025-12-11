import { Request, Response } from 'express';
import { supabase } from './db/supabase.js';
import { handleRouteError } from './utils/errors.js';
import { z } from 'zod';

const adminNotifySchema = z.object({
  type: z.literal('new_admin_request'),
  newAdminEmail: z.string().email().max(254), // RFC 5321 limit
  requestedAt: z.string().datetime(), // ISO 8601 datetime string
});

export async function adminNotify(req: Request, res: Response) {
  try {
    // Validate input
    const validationResult = adminNotifySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid notification payload'
        }
      });
    }

    const { type, newAdminEmail, requestedAt } = validationResult.data;

    if (type === 'new_admin_request') {
      // Store the request in database for tracking with validated data
      const { error } = await supabase
        .from('admin_requests')
        .insert({
          email: newAdminEmail,
          requested_at: requestedAt,
          status: 'pending'
        });

      if (error) {
        return handleRouteError(error, res, 'Admin notification storage');
      }

      res.json({ message: 'Admin notification sent successfully' });
    } else {
      res.status(400).json({
        error: {
          code: 'INVALID_NOTIFICATION_TYPE',
          message: 'Invalid notification type'
        }
      });
    }
  } catch (error) {
    return handleRouteError(error, res, 'Admin notification');
  }
}
