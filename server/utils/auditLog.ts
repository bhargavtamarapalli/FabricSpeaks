/**
 * Audit Logging Utility
 * Tracks all admin actions for security and compliance
 */

import { supabase as db } from '../db/supabase';
import { loggers } from './logger';
import { AppError } from './AppError';

/**
 * Audit action types
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PERMISSION_CHANGE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE';

/**
 * Resource types that can be audited
 */
export type ResourceType =
  | 'PRODUCT'
  | 'VARIANT'
  | 'ORDER'
  | 'USER'
  | 'CATEGORY'
  | 'REVIEW'
  | 'INVENTORY'
  | 'SETTINGS'
  | 'ADMIN_USER';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 * 
 * @param entry - Audit log entry
 * @returns Audit log ID
 * 
 * @example
 * await logAuditEvent({
 *   userId: req.session.userId,
 *   action: 'DELETE',
 *   resourceType: 'PRODUCT',
 *   resourceId: productId,
 *   ipAddress: req.ip,
 *   userAgent: req.get('user-agent')
 * });
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string> {
  try {
    const { data, error } = await db.rpc('log_audit_event', {
      p_user_id: entry.userId,
      p_action: entry.action,
      p_resource_type: entry.resourceType,
      p_resource_id: entry.resourceId || null,
      p_changes: entry.changes ? JSON.stringify(entry.changes) : null,
      p_ip_address: entry.ipAddress || null,
      p_user_agent: entry.userAgent || null,
    });

    if (error) {
      loggers.error('Failed to log audit event', {
        error: error.message,
        entry,
      });
      throw new AppError(
        'Failed to log audit event',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    loggers.info('Audit event logged', {
      auditLogId: data,
      action: entry.action,
      resourceType: entry.resourceType,
      userId: entry.userId,
    });

    return data as string;
  } catch (error) {
    loggers.error('Audit logging exception', {
      error: error instanceof Error ? error.message : String(error),
      entry,
    });
    throw error;
  }
}

/**
 * Get audit logs for a specific resource
 * 
 * @param resourceType - Resource type
 * @param resourceId - Resource ID
 * @param limit - Maximum number of logs to return
 * @returns Array of audit logs
 */
export async function getAuditLogs(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        'Failed to fetch audit logs',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Failed to fetch audit logs', {
      error: error instanceof Error ? error.message : String(error),
      resourceType,
      resourceId,
    });
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 * @returns Array of audit logs
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        'Failed to fetch user audit logs',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Failed to fetch user audit logs', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}

/**
 * Get recent audit logs (for admin dashboard)
 * 
 * @param limit - Maximum number of logs to return
 * @param offset - Offset for pagination
 * @returns Array of audit logs with user info
 */
export async function getRecentAuditLogs(
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(
        'Failed to fetch recent audit logs',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Failed to fetch recent audit logs', {
      error: error instanceof Error ? error.message : String(error),
      limit,
      offset,
    });
    throw error;
  }
}

/**
 * Search audit logs by action
 * 
 * @param action - Action to search for
 * @param limit - Maximum number of logs to return
 * @returns Array of audit logs
 */
export async function searchAuditLogsByAction(
  action: AuditAction,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        'Failed to search audit logs',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Failed to search audit logs', {
      error: error instanceof Error ? error.message : String(error),
      action,
    });
    throw error;
  }
}

/**
 * Middleware to automatically log audit events
 */
export function auditMiddleware(
  action: AuditAction,
  resourceType: ResourceType,
  getResourceId?: (req: any) => string | undefined
) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return next();
      }

      const resourceId = getResourceId ? getResourceId(req) : undefined;

      // Log the audit event asynchronously (don't block the request)
      logAuditEvent({
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch((error) => {
        loggers.error('Failed to log audit event in middleware', {
          error: error instanceof Error ? error.message : String(error),
        });
      });

      next();
    } catch (error) {
      loggers.error('Audit middleware error', {
        error: error instanceof Error ? error.message : String(error),
      });
      next();
    }
  };
}

/**
 * Search audit logs with multiple filters
 */
export async function searchAuditLogs(options: {
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  try {
    let query = db
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    
    query = query.limit(options.limit || 50);

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        'Failed to search audit logs',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Failed to search audit logs', {
      error: error instanceof Error ? error.message : String(error),
      options,
    });
    throw error;
  }
}
