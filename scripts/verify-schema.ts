
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

// Load env vars first
dotenv.config({ path: ".env.local" });

async function verifySchema() {
  // Dynamic import to ensure env vars are loaded
  const { db } = await import("../server/db/supabase");

  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('is_imported', 'gsm', 'weave', 'occasion', 'pattern', 'fit', 'related_product_ids');
    `);
    
    console.log("Full Result:", result);
    // console.log("Found columns:", result.rows);
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verifySchema();
