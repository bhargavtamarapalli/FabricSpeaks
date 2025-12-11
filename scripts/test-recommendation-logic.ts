
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load environment variables BEFORE importing db
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Verify env is loaded
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing from .env.local");
    process.exit(1);
}

// Dynamic import to ensure env is loaded first
const { db } = await import("../server/db/supabase");
const { products, categories } = await import("../shared/schema");
const { recommendationService } = await import("../server/services/recommendations");
const { eq } = await import("drizzle-orm");

async function runTest() {
    console.log("Starting Recommendation Logic Test...");

    try {
        // 0. Pre-Cleanup (in case previous run failed)
        console.log("Pre-cleaning test data...");
        await db.delete(products).where(eq(products.slug, "test-blue-shirt"));
        await db.delete(products).where(eq(products.slug, "test-beige-pants"));
        await db.delete(products).where(eq(products.slug, "test-red-pants"));
        await db.delete(categories).where(eq(categories.slug, "test-shirts"));
        await db.delete(categories).where(eq(categories.slug, "test-pants"));

        // 1. Setup Test Data
        console.log("Setting up test categories...");
        
        let shirtCatId: string;
        let pantCatId: string;

        // Find or Create 'shirts' category
        const existingShirtCat = await db.query.categories.findFirst({
            where: eq(categories.slug, "shirts")
        });
        if (existingShirtCat) {
            shirtCatId = existingShirtCat.id;
            console.log("Using existing 'shirts' category.");
        } else {
            const [newCat] = await db.insert(categories).values({
                name: "Shirts",
                slug: "shirts",
                description: "Test Category"
            }).returning();
            shirtCatId = newCat.id;
            console.log("Created 'shirts' category.");
        }

        // Find or Create 'pants' category
        const existingPantCat = await db.query.categories.findFirst({
            where: eq(categories.slug, "pants")
        });
        if (existingPantCat) {
            pantCatId = existingPantCat.id;
            console.log("Using existing 'pants' category.");
        } else {
            const [newCat] = await db.insert(categories).values({
                name: "Pants",
                slug: "pants",
                description: "Test Category"
            }).returning();
            pantCatId = newCat.id;
            console.log("Created 'pants' category.");
        }

        console.log("Creating test products...");
        const [blueShirt] = await db.insert(products).values({
            name: "Test Blue Shirt",
            slug: "test-blue-shirt-final",
            sku: "TEST-SHIRT-FINAL",
            price: "100",
            category_id: shirtCatId,
            colour: "Blue",
            occasion: "Formal",
            status: "active"
        }).returning();

        const [beigePants] = await db.insert(products).values({
            name: "Test Beige Pants",
            slug: "test-beige-pants-final",
            sku: "TEST-PANTS-FINAL",
            price: "100",
            category_id: pantCatId,
            colour: "Beige",
            occasion: "Formal",
            status: "active"
        }).returning();

        const [redPants] = await db.insert(products).values({
            name: "Test Red Pants",
            slug: "test-red-pants-final",
            sku: "TEST-PANTS-FINAL-2",
            price: "100",
            category_id: pantCatId,
            colour: "Red",
            occasion: "Formal", 
            status: "active"
        }).returning();

        // 2. Run Recommendation Service
        console.log(`Getting recommendations for ${blueShirt.name}...`);
        const recommendations = await recommendationService.getRecommendations(blueShirt.id);

        console.log("Recommendations found:", recommendations.map(p => `${p.name} (${p.colour})`));

        // 3. Verify Results
        // Expect Beige Pants to be first because Blue + Beige is a high contrast match in our map
        const firstRec = recommendations[0];
        if (firstRec && firstRec.id === beigePants.id) {
            console.log("✅ SUCCESS: Beige Pants recommended first (Color Contrast Match).");
        } else {
            console.log("❌ FAILURE: Expected Beige Pants first.");
        }

        // 4. Cleanup
        console.log("Cleaning up test data...");
        await db.delete(products).where(eq(products.slug, "test-blue-shirt-final"));
        await db.delete(products).where(eq(products.slug, "test-beige-pants-final"));
        await db.delete(products).where(eq(products.slug, "test-red-pants-final"));
        // Do NOT delete categories as they might be shared/real now

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        process.exit(0);
    }
}

runTest();
