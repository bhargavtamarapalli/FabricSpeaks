import { Request, Response } from "express";
import { db } from "./db/supabase";
import { newsletterSubscriptions, insertNewsletterSubscriptionSchema } from "../shared/newsletter-schema";
import { eq } from "drizzle-orm";

export async function subscribeNewsletterHandler(req: Request, res: Response) {
  try {
    const data = insertNewsletterSubscriptionSchema.parse(req.body);

    // Check if already subscribed
    const existing = await (db as any)
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      if (!existing[0].is_active) {
        // Reactivate
        await (db as any)
          .update(newsletterSubscriptions)
          .set({ is_active: true, updated_at: new Date() })
          .where(eq(newsletterSubscriptions.email, data.email));
        return res.status(200).json({ message: "Subscription reactivated successfully" });
      }
      return res.status(409).json({ message: "Email already subscribed" });
    }

    await (db as any).insert(newsletterSubscriptions).values(data);
    return res.status(201).json({ message: "Subscribed successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid email address", errors: error.errors });
    }
    console.error("Newsletter subscription error:", error);
    return res.status(500).json({ message: "Failed to subscribe" });
  }
}
