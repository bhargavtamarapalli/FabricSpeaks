import { db } from "./db/supabase";
import { auditLogs } from "../shared/schema";

export async function logAuditAction(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: any = {},
  req?: any // Optional request object to extract IP/User Agent
) {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    await db.insert(auditLogs).values({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details,
      ip_address: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw error to avoid blocking the main action
  }
}
