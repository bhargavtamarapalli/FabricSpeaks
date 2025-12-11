import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import '../server/env';

async function applyMigration() {
  // Import db after env vars are loaded
  const { db } = await import("../server/db/supabase");
  
  console.log("🚀 Applying Product Reviews migration...");

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20251120_create_reviews.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Split into statements (simple split by semicolon for this specific file structure)
    // Note: This is a basic parser. For complex SQL, use a proper migration tool.
    // We're splitting by semicolon but need to be careful about function bodies.
    // However, since we're using Supabase's postgres connection via Drizzle, 
    // we can try executing the whole block or split carefully.
    
    // For this specific file, we can execute it as one block if the driver supports it,
    // or we can use the raw SQL execution.
    
    console.log("📝 Executing SQL...");
    
    // Execute the raw SQL
    await db.execute(sql.raw(migrationSql));

    console.log("✅ Migration applied successfully!");
    
    // Verify tables exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('product_reviews', 'review_helpful_votes');
    `);

    console.log("📊 Created tables:", result.map((r: any) => r.table_name).join(", "));

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

applyMigration();
