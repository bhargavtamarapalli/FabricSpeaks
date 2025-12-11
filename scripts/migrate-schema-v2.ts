
import dotenv from "dotenv";
import { eq, sql } from "drizzle-orm";

// Load env vars before importing db
dotenv.config({ path: ".env.local" });

async function migrateSchemaAndCategories() {
  console.log("Starting Schema & Category Migration...");

  // Dynamic import to ensure env vars are loaded
  const { db } = await import("../server/db/supabase");
  const { categories } = await import("../shared/schema");

  try {
    // 1. Add New Columns to Products Table (Raw SQL)
    console.log("Adding new columns to products table...");
    
    const columns = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS gsm INTEGER;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS weave TEXT;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion TEXT;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern TEXT;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS fit TEXT;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS related_product_ids JSONB DEFAULT '[]'::jsonb;"
    ];

    for (const query of columns) {
      await db.execute(sql.raw(query));
    }
    console.log("Schema columns added successfully.");

    // 2. Create Root Categories
    console.log("Creating Root Categories...");
    
    const [clothing] = await db.insert(categories).values({
      name: "Clothing",
      slug: "clothing",
      description: "Apparel and garments",
      display_order: 1
    }).onConflictDoUpdate({
      target: categories.name,
      set: { slug: "clothing" }
    }).returning();

    const [accessories] = await db.insert(categories).values({
      name: "Accessories",
      slug: "accessories",
      description: "Fashion accessories",
      display_order: 2
    }).onConflictDoUpdate({
      target: categories.name,
      set: { slug: "accessories" }
    }).returning();

    console.log(`Roots created: Clothing (${clothing.id}), Accessories (${accessories.id})`);

    // 3. Create Sub-Categories (Level 2)
    console.log("Creating Sub-Categories...");

    const [topwear] = await db.insert(categories).values({
      name: "Topwear",
      slug: "topwear",
      parent_id: clothing.id,
      description: "Upper body clothing",
      display_order: 1
    }).onConflictDoUpdate({
      target: categories.name,
      set: { parent_id: clothing.id, slug: "topwear" }
    }).returning();

    const [bottomwear] = await db.insert(categories).values({
      name: "Bottomwear",
      slug: "bottomwear",
      parent_id: clothing.id,
      description: "Lower body clothing",
      display_order: 2
    }).onConflictDoUpdate({
      target: categories.name,
      set: { parent_id: clothing.id, slug: "bottomwear" }
    }).returning();

    console.log(`Subs created: Topwear (${topwear.id}), Bottomwear (${bottomwear.id})`);

    // 4. Map Existing Categories to New Parents (Level 3)
    console.log("Mapping Leaf Categories...");

    const topwearMap = [
      "Shirts", "T-Shirts", "Jackets", "Sweaters", "Blazers", "Coats", "Hoodies", "Kurtas"
    ];

    const bottomwearMap = [
      "Pants", "Jeans", "Trousers", "Shorts", "Joggers", "Chinos"
    ];

    const accessoriesMap = [
      "Belts", "Wallets", "Ties", "Socks", "Scarves", "Hats", "Bags"
    ];

    // Helper to update parent
    const updateParent = async (names: string[], parentId: string) => {
      for (const name of names) {
        // Check if exists first (case-insensitive check would be better but simple name match for now)
        const existing = await db.query.categories.findFirst({
          where: eq(categories.name, name)
        });

        if (existing) {
          console.log(`Updating parent for ${name}...`);
          await db.update(categories)
            .set({ parent_id: parentId })
            .where(eq(categories.id, existing.id));
        } else {
          console.log(`Creating new category ${name}...`);
          await db.insert(categories).values({
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            parent_id: parentId,
            display_order: 99
          });
        }
      }
    };

    await updateParent(topwearMap, topwear.id);
    await updateParent(bottomwearMap, bottomwear.id);
    await updateParent(accessoriesMap, accessories.id);

    console.log("Migration Complete! ✅");
    process.exit(0);

  } catch (error) {
    console.error("Migration Failed:", error);
    process.exit(1);
  }
}

migrateSchemaAndCategories();
