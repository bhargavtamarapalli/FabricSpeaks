import { Request, Response } from "express";
import { db } from "./db/supabase";
import { marketingCampaigns } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function listCampaignsHandler(req: Request, res: Response) {
  try {
    const campaigns = await db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.created_at));
    
    return res.json(campaigns);
  } catch (error) {
    console.error("Error listing campaigns:", error);
    return res.status(500).json({ error: "Failed to list campaigns" });
  }
}

export async function createCampaignHandler(req: Request, res: Response) {
  try {
    const data = req.body;
    const adminUser = (req as any).user;
    
    const [campaign] = await db
      .insert(marketingCampaigns)
      .values({
        ...data,
        created_by: adminUser.user_id,
        status: data.scheduled_at ? 'scheduled' : 'draft'
      })
      .returning();
      
    return res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
}
