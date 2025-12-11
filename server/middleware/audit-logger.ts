/**
 * Audit Logging Middleware
 * 
 * Tracks all admin actions for security and compliance.
 * Records who did what, when, and from where.
 * 
 * Day 15: Security Hardening (CRITICAL C6)
 * 
 * @module server/middleware/audit-logger
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'upload'
  | 'export'
  | 'bulk_update'
  | 'settings_change';

export type AuditEntity =
  | 'product'
  | 'order'
  | 'customer'
  | 'user'
  | 'category'
  | 'inventory'
  | 'coupon'
  | 'settings'
  | 'notification';

// ============================================================================
// In-Memory Storage (Replace with database in production)
// ============================================================================

const auditLogs:  AuditLogEntry[] = [];
const MAX_MEMORY_LOGS = 10000; // Keep last 10k logs in memory

/**
 * Stores audit log entry
 * In production, this should write to database
 * 
 * @param entry - Audit log entry
 */
async function storeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // In production, insert into database
    // await db.insert(auditLogs).values(entry);
    
    // For now, keep in memory
    auditLogs.push(entry);
    
    // Prevent memory overflow
    if (auditLogs.length > MAX_MEMORY_LOGS) {
      auditLogs.shift();
    }
    
    logger.info('[Audit] Action logged', {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      success: entry.success,
    });
  } catch (error) {
    // Never fail the request due to audit logging error
    logger.error('[Audit] Failed to store audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entry,
    });
  }
}

// ============================================================================
// Audit Middleware
// ============================================================================

/**
 * Creates audit logging middleware
 * 
 * @param action - Action being performed
 * @param entity - Entity being acted upon
 * @returns Express middleware
 */
export function auditLog(action: AuditAction, entity: AuditEntity) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capture original res.json to detect success/failure
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    
    let statusCode = 200;
    let responseBody: unknown = null;
    
    // Override res.status to capture status code
    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    };
    
    // Override res.json to capture response
    res.json = function (body: unknown) {
      responseBody = body;
      return originalJson(body);
    };
    
    // Continue with request
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const success = statusCode >= 200 && statusCode < 400;
        
        // Extract user ID from request (adjust based on your auth system)
        const userId = (req as any).user?.id || 'anonymous';
        
        // Extract entity ID from params or body
        const entityId = req.params.id || (req.body as any)?.id;
        
        // Get IP address
        const ipAddress = 
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
          (req.headers['x-real-ip'] as string) ||
          req.socket.remoteAddress ||
          'unknown';
        
        // Get user agent
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Create audit log entry
        const entry: AuditLogEntry = {
          userId,
          action,
          entity,
          entityId,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body),
            duration,
          },
          ipAddress,
          userAgent,
          timestamp: new Date(),
          success,
          errorMessage: success ? undefined : extractErrorMessage(responseBody),
        };
        
        await storeAuditLog(entry);
      } catch (error) {
        logger.error('[Audit] Failed to create audit log', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
    
    next();
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitizes request body to remove sensitive data
 * 
 * @param body - Request body
 * @returns Sanitized body
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sanitized = { ...body } as Record<string, unknown>;
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
  ];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Extracts error message from response body
 * 
 * @param responseBody - Response body
 * @returns Error message
 */
function extractErrorMessage(responseBody: unknown): string | undefined {
  if (!responseBody || typeof responseBody !== 'object') {
    return undefined;
  }
  
  const body = responseBody as Record<string, unknown>;
  
  return (
    (body.error as any)?.message ||
    (body.message as string) ||
    'Unknown error'
  );
}

// ============================================================================
// Audit Log Queries (for viewing logs)
// ============================================================================

/**
 * Gets audit logs for a user
 * 
 * @param userId - User ID
 * @param limit - Max number of logs
 * @returns Audit logs
 */
export function getUserAuditLogs(
  userId: string,
  limit: number = 100
): AuditLogEntry[] {
  return auditLogs
    .filter(log => log.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Gets audit logs for an entity
 * 
 * @param entity - Entity type
 * @param entityId - Entity ID
 * @param limit - Max number of logs
 * @returns Audit logs
 */
export function getEntityAuditLogs(
  entity: AuditEntity,
  entityId: string,
  limit: number = 100
): AuditLogEntry[] {
  return auditLogs
    .filter(log => log.entity === entity && log.entityId === entityId)
    .slice(-limit)
    .reverse();
}

/**
 * Gets recent audit logs
 * 
 * @param limit - Max number of logs
 * @returns Recent audit logs
 */
export function getRecentAuditLogs(limit: number = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit).reverse();
}

/**
 * Gets audit log statistics
 * 
 * @returns Audit statistics
 */
export function getAuditStats(): {
  totalLogs: number;
  successRate: number;
  actionCounts: Record<string, number>;
  entityCounts: Record<string, number>;
} {
  const successCount = auditLogs.filter(log => log.success).length;
  const successRate = auditLogs.length > 0 ? successCount / auditLogs.length : 0;
  
  const actionCounts: Record<string, number> = {};
  const entityCounts: Record<string, number> = {};
  
  for (const log of auditLogs) {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    entityCounts[log.entity] = (entityCounts[log.entity] || 0) + 1;
  }
  
  return {
    totalLogs: auditLogs.length,
    successRate,
    actionCounts,
    entityCounts,
  };
}

// ============================================================================
// CSV Export Prevention
// ============================================================================

/**
 * Sanitizes CSV cell to prevent CSV injection
 * 
 * @param value - Cell value
 * @returns Sanitized value
 */
export function sanitizeCSVCell(value: unknown): string {
  const str = String(value ?? '');
  
  // Prevent CSV injection
  if (str.match(/^[=+\-@]/)) {
    return `'${str}`;
  }
  
  // Escape quotes
  if (str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  // Escape commas and newlines
  if (str.includes(',') || str.includes('\n')) {
    return `"${str}"`;
  }
  
  return str;
}

/**
 * Exports audit logs to CSV
 * 
 * @param logs - Audit logs
 * @returns CSV string
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): string {
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Entity',
    'Entity ID',
    'IP Address',
    'User Agent',
    'Success',
    'Error Message',
  ];
  
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.userId,
    log.action,
    log.entity,
    log.entityId || '',
    log.ipAddress,
    log.userAgent,
    log.success ? 'Yes' : 'No',
    log.errorMessage || '',
  ]);
  
  const csvRows = [
    headers.map(sanitizeCSVCell).join(','),
    ...rows.map(row => row.map(sanitizeCSVCell).join(',')),
  ];
  
  return csvRows.join('\n');
}
