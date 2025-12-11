import { db } from "../db/supabase";
import { products, categories } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { create } from "xmlbuilder2";

/**
 * Generates the sitemap.xml content
 * @returns {Promise<string>} XML string
 */
export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.APP_URL || "https://fabric-speaks.com";

  // Fetch data
  const activeProducts = await db
    .select({
      slug: products.slug,
      updatedAt: products.updated_at,
    })
    .from(products)
    .where(eq(products.status, "active"));

  const activeCategories = await db
    .select({
      slug: categories.slug,
    })
    .from(categories);

  // Build XML
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("urlset", { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" });

  // Static pages
  const staticPages = ["", "/products", "/about", "/contact", "/login", "/register"];
  for (const page of staticPages) {
    root.ele("url")
      .ele("loc").txt(`${baseUrl}${page}`).up()
      .ele("changefreq").txt("daily").up()
      .ele("priority").txt(page === "" ? "1.0" : "0.8").up()
      .up();
  }

  // Categories
  for (const category of activeCategories) {
    root.ele("url")
      .ele("loc").txt(`${baseUrl}/category/${category.slug}`).up()
      .ele("changefreq").txt("weekly").up()
      .ele("priority").txt("0.7").up()
      .up();
  }

  // Products
  for (const product of activeProducts) {
    root.ele("url")
      .ele("loc").txt(`${baseUrl}/product/${product.slug}`).up()
      .ele("lastmod").txt(product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString()).up()
      .ele("changefreq").txt("daily").up()
      .ele("priority").txt("0.6").up()
      .up();
  }

  return root.end({ prettyPrint: true });
}
