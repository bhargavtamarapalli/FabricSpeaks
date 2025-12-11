import type { Request, Response } from "express";
import { generateSitemap } from "./services/sitemap";
import { getCacheService } from "./services/cache";

export async function sitemapHandler(req: Request, res: Response) {
  try {
    const cache = await getCacheService();
    const cacheKey = "sitemap-xml";

    // Try cache first
    if (cache.isReady()) {
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        res.header("Content-Type", "application/xml");
        return res.send(cached);
      }
    }

    // Generate sitemap
    const xml = await generateSitemap();

    // Cache for 1 hour
    if (cache.isReady()) {
      await cache.set(cacheKey, xml, 3600);
    }

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    res.status(500).send("Error generating sitemap");
  }
}
