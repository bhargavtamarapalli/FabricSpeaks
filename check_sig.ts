
import { db } from "./server/db/supabase";
import { products } from "./shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    try {
        const result = await db.select().from(products).where(eq(products.is_signature, true));
        console.log("Signature Products Count:", result.length);
        if (result.length > 0) {
            console.log("First product:", result[0].name);
        }
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}
check();
