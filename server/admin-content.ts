import { Request, Response } from "express";
import { db } from "./db/supabase";
import { cmsContent } from "@shared/schema";
import { eq, desc, asc, and, or, isNull, lte, gte, sql } from "drizzle-orm";
import { logAuditEvent } from "./utils/auditLog";

export async function listContentHandler(req: Request, res: Response) {
  try {
    const list = await db
      .select()
      .from(cmsContent)
      .orderBy(desc(cmsContent.created_at));
    
    return res.json(list);
  } catch (error) {
    console.error("Error listing content:", error);
    return res.status(500).json({ error: "Failed to list content" });
  }
}

export async function createContentHandler(req: Request, res: Response) {
  try {
    const data = req.body;
    const adminUser = (req as any).user;
    
    console.log('[DEBUG BANNER] Creating content:', data.title, data.type);

    const [content] = await db
      .insert(cmsContent)
      .values({
        ...data,
        created_by: adminUser.user_id,
        content: data.content || {},
        // Ensure display_order is set, default to 0 if not provided
        display_order: data.display_order || 0
      })
      .returning();
      
    await logAuditEvent({
      userId: adminUser.user_id,
      action: "CREATE",
      resourceType: "SETTINGS", // Using SETTINGS as generic content type isn't in enum, or we should add 'CONTENT' to ResourceType
      resourceId: content.id,
      changes: { title: content.title, type: content.type }
    });

    return res.status(201).json(content);
  } catch (error) {
    console.error("Error creating content:", error);
    return res.status(500).json({ error: "Failed to create content" });
  }
}

export async function updateContentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    const adminUser = (req as any).user;

    console.log(`[DEBUG BANNER] Updating content ${id}:`, data.title);

    const [updated] = await db
      .update(cmsContent)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(cmsContent.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Content not found" });
    }

    await logAuditEvent({
      userId: adminUser.user_id,
      action: "UPDATE",
      resourceType: "SETTINGS",
      resourceId: id,
      changes: { title: updated.title, type: updated.type, changes: Object.keys(data) }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error updating content:", error);
    return res.status(500).json({ error: "Failed to update content" });
  }
}

export async function deleteContentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user;

    console.log(`[DEBUG BANNER] Deleting content ${id}`);

    const [deleted] = await db
      .delete(cmsContent)
      .where(eq(cmsContent.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Content not found" });
    }

    await logAuditEvent({
      userId: adminUser.user_id,
      action: "DELETE",
      resourceType: "SETTINGS",
      resourceId: id,
      changes: { title: deleted.title, type: deleted.type }
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting content:", error);
    return res.status(500).json({ error: "Failed to delete content" });
  }
}

export async function getActiveBannersHandler(req: Request, res: Response) {
  try {
    const now = new Date();
    
    // Log for debugging visibility
    console.log('[DEBUG BANNER] Fetching active banners at:', now.toISOString());

    const banners = await db
      .select()
      .from(cmsContent)
      .where(
        and(
          eq(cmsContent.type, 'banner'),
          eq(cmsContent.is_active, true),
          or(isNull(cmsContent.start_date), lte(cmsContent.start_date, now)),
          or(isNull(cmsContent.end_date), gte(cmsContent.end_date, now))
        )
      )
      // Sort by Priority (display_order ASC) first, then by Creation Date DESC
      .orderBy(asc(cmsContent.display_order), desc(cmsContent.created_at));
      
    console.log(`[DEBUG BANNER] Found ${banners.length} active banners`);
      
    return res.json(banners);
  } catch (error) {
    console.error("Error getting active banners:", error);
    return res.status(500).json({ error: "Failed to get active banners" });
  }
}

export async function trackBannerClickHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Use raw SQL for atomic update of JSONB data to avoid race conditions
    // We increment content->stats->clicks
    await db.execute(sql`
      UPDATE cms_content 
      SET content = jsonb_set(
        CASE WHEN content IS NULL THEN '{}'::jsonb ELSE content END,
        '{stats,clicks}', 
        (COALESCE((content->'stats'->>'clicks')::int, 0) + 1)::text::jsonb
      )
      WHERE id = ${id}
    `);

    console.debug(`[DEBUG BANNER] Tracked click for banner ${id}`);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error tracking banner click:", error);
    return res.status(500).json({ error: "Failed to track click" });
  }
}
