
import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db/supabase";
import { products, productVariants } from "../shared/schema";

async function checkImages() {
  console.log("Checking product images...");
  const allProducts = await db.select().from(products).limit(10);
  
  console.log("\nProducts:");
  allProducts.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}`);
    console.log(`Image 1: ${p.image1}`);
    console.log(`Image 2: ${p.image2}`);
    console.log(`Images Array:`, p.images);
    console.log("---");
  });
}

checkImages().catch(console.error).then(() => process.exit(0));
