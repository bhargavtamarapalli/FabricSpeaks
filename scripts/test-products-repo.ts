
import { SupabaseProductsRepository } from "../server/db/repositories/supabase-products";

async function test() {
  const repo = new SupabaseProductsRepository();
  console.log("Testing categoryId: 'new'...");
  try {
    const resultNew = await repo.list({ limit: 10, categoryId: 'new' });
    console.log("Success 'new':", resultNew.items.length, "items");
  } catch (e) {
    console.error("Error 'new':", e);
  }

  console.log("Testing categoryId: 'sale'...");
  try {
    const resultSale = await repo.list({ limit: 10, categoryId: 'sale' });
    console.log("Success 'sale':", resultSale.items.length, "items");
  } catch (e) {
    console.error("Error 'sale':", e);
  }
  
  process.exit(0);
}

test();
