
import { db } from "../db/supabase";
import { products, categories } from "../../shared/schema";
import { eq, and, not, or, inArray, desc } from "drizzle-orm";

/**
 * Recommendation Service
 * 
 * Provides algorithmic product recommendations based on:
 * 1. Manual Overrides (related_product_ids)
 * 2. "Complete the Look" (Complementary Categories + Occasion + Color)
 * 3. "Similar Items" (Same Category + Fabric + Occasion)
 */

// Map of Category Slug -> Complementary Category Slugs
const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
    'shirts': ['pants', 'trousers', 'jeans', 'chinos'],
    't-shirts': ['jeans', 'shorts', 'joggers'],
    'pants': ['shirts', 't-shirts', 'polos'],
    'jeans': ['t-shirts', 'casual-shirts', 'hoodies'],
    'trousers': ['formal-shirts', 'blazers'],
    'suits': ['formal-shirts', 'ties'],
    'blazers': ['trousers', 'formal-shirts', 'jeans'],
};

// Simple Color Contrast Map (Source -> Recommended)
const COLOR_CONTRAST: Record<string, string[]> = {
    'blue': ['beige', 'white', 'black', 'grey', 'khaki'],
    'navy': ['beige', 'white', 'grey', 'khaki'],
    'black': ['white', 'blue', 'grey', 'red', 'pink', 'beige'],
    'white': ['blue', 'black', 'beige', 'grey', 'navy'],
    'beige': ['blue', 'black', 'white', 'green', 'navy'],
    'grey': ['black', 'white', 'blue', 'navy'],
    'red': ['black', 'blue', 'white'],
    'green': ['beige', 'white', 'black', 'navy'],
};

export class RecommendationService {
    
    async getRecommendations(productId: string, limit: number = 4) {
        console.log(`[RecommendationService] Getting recommendations for product: ${productId}`);
        try {
            // 1. Get Source Product with Category
            const sourceProduct = await db.query.products.findFirst({
                where: eq(products.id, productId),
                with: {
                    category: true
                }
            });

            if (!sourceProduct) {
                console.warn(`[RecommendationService] Product not found: ${productId}`);
                return [];
            }

            console.log(`[RecommendationService] Source Product: ${sourceProduct.name} (${sourceProduct.category?.slug})`);

            // 2. Check Manual Overrides (Highest Priority)
            const manualIds = sourceProduct.related_product_ids as string[];
            if (manualIds && manualIds.length > 0) {
                console.log(`[RecommendationService] Found ${manualIds.length} manual overrides.`);
                const manualProducts = await db.query.products.findMany({
                    where: inArray(products.id, manualIds),
                    limit: limit
                });
                if (manualProducts.length > 0) return manualProducts;
            }

            // 3. "Complete the Look" Logic
            let recommendations: any[] = [];
            
            if (sourceProduct.category) {
                const catSlug = sourceProduct.category.slug || '';
                const targetKey = Object.keys(COMPLEMENTARY_CATEGORIES).find(k => catSlug.includes(k));
                const targetSlugs = targetKey ? COMPLEMENTARY_CATEGORIES[targetKey] : [];
                
                console.log(`[RecommendationService] Category '${catSlug}' matches rule '${targetKey}' -> Targets: ${targetSlugs.join(', ')}`);

                if (targetSlugs.length > 0) {
                    // Find Category IDs for these slugs
                    const targetCategories = await db.select().from(categories)
                        .where(inArray(categories.slug, targetSlugs));
                    
                    const targetCategoryIds = targetCategories.map(c => c.id);

                    if (targetCategoryIds.length > 0) {
                        // Build Query
                        const sourceColor = sourceProduct.colour?.toLowerCase() || '';
                        const contrastColors = Object.entries(COLOR_CONTRAST)
                            .find(([k]) => sourceColor.includes(k))?.[1] || [];
                        
                        console.log(`[RecommendationService] Color '${sourceColor}' contrasts with: ${contrastColors.join(', ')}`);

                        const conditions = [
                            not(eq(products.id, productId)),
                            inArray(products.category_id, targetCategoryIds),
                            eq(products.status, 'active')
                        ];

                        // Strict Occasion Match if present
                        if (sourceProduct.occasion) {
                            console.log(`[RecommendationService] Filtering by occasion: ${sourceProduct.occasion}`);
                            conditions.push(eq(products.occasion, sourceProduct.occasion));
                        }

                        let query = db.select().from(products).where(and(...conditions));
                        let candidates = await query;
                        console.log(`[RecommendationService] Found ${candidates.length} candidates for 'Complete the Look'`);

                        // Sort by Color Contrast
                        if (contrastColors.length > 0) {
                            candidates.sort((a, b) => {
                                const aColor = a.colour?.toLowerCase() || '';
                                const bColor = b.colour?.toLowerCase() || '';
                                const aScore = contrastColors.some(c => aColor.includes(c)) ? 1 : 0;
                                const bScore = contrastColors.some(c => bColor.includes(c)) ? 1 : 0;
                                return bScore - aScore;
                            });
                        }

                        recommendations = candidates;
                    }
                }
            }

            // 4. Fallback: "Similar Items" (Same Category + Fabric)
            if (recommendations.length < limit) {
                console.log(`[RecommendationService] Not enough recommendations (${recommendations.length}/${limit}). Falling back to 'Similar Items'.`);
                const similarConditions = [
                    not(eq(products.id, productId)),
                    eq(products.category_id, sourceProduct.category_id), // Same Category
                    eq(products.status, 'active')
                ];

                // Prioritize same Fabric
                if (sourceProduct.fabric) {
                    similarConditions.push(eq(products.fabric, sourceProduct.fabric));
                }

                const similarProducts = await db.query.products.findMany({
                    where: and(...similarConditions),
                    limit: limit - recommendations.length
                });
                
                console.log(`[RecommendationService] Found ${similarProducts.length} similar items.`);

                recommendations = [...recommendations, ...similarProducts];
            }

            // 5. Final Fallback: Any Active Products (Random/Newest)
            if (recommendations.length < limit) {
                console.log(`[RecommendationService] Still need more. Fetching fallback products.`);
                const fallback = await db.query.products.findMany({
                    where: and(
                        not(eq(products.id, productId)),
                        eq(products.status, 'active')
                    ),
                    orderBy: [desc(products.created_at)],
                    limit: limit - recommendations.length
                });
                recommendations = [...recommendations, ...fallback];
            }

            return recommendations.slice(0, limit);

        } catch (error) {
            console.error("[RecommendationService] Error fetching recommendations:", error);
            return [];
        }
    }

    /**
     * Get Similar Apparels - products matching by fabric and/or occasion
     * 
     * Returns two groups:
     * 1. Similar by Fabric - products with same fabric type
     * 2. For This Occasion - products with same occasion
     */
    async getSimilarApparels(productId: string, limit: number = 4) {
        console.log(`[RecommendationService] Getting similar apparels for: ${productId}`);
        
        try {
            // Get source product
            const sourceProduct = await db.query.products.findFirst({
                where: eq(products.id, productId)
            });

            if (!sourceProduct) {
                console.warn(`[RecommendationService] Product not found: ${productId}`);
                return { byFabric: [], byOccasion: [] };
            }

            const sourceFabric = sourceProduct.fabric?.toLowerCase().trim();
            const sourceOccasion = sourceProduct.occasion?.toLowerCase().trim();
            
            console.log(`[RecommendationService] Source: fabric="${sourceFabric}", occasion="${sourceOccasion}"`);

            // Get Similar by Fabric
            let byFabric: any[] = [];
            if (sourceFabric) {
                byFabric = await db.query.products.findMany({
                    where: and(
                        not(eq(products.id, productId)),
                        eq(products.status, 'active'),
                        eq(products.fabric, sourceProduct.fabric) // Case-sensitive match
                    ),
                    orderBy: [desc(products.created_at)],
                    limit: limit
                });
                
                // If exact match fails, try case-insensitive via manual filter
                if (byFabric.length === 0 && sourceFabric) {
                    const allProducts = await db.query.products.findMany({
                        where: and(
                            not(eq(products.id, productId)),
                            eq(products.status, 'active')
                        ),
                        limit: 50
                    });
                    byFabric = allProducts
                        .filter(p => p.fabric?.toLowerCase().trim() === sourceFabric)
                        .slice(0, limit);
                }
                
                console.log(`[RecommendationService] Found ${byFabric.length} similar by fabric`);
            }

            // Get By Occasion
            let byOccasion: any[] = [];
            if (sourceOccasion) {
                byOccasion = await db.query.products.findMany({
                    where: and(
                        not(eq(products.id, productId)),
                        eq(products.status, 'active'),
                        eq(products.occasion, sourceProduct.occasion)
                    ),
                    orderBy: [desc(products.created_at)],
                    limit: limit
                });
                
                // Exclude products already in byFabric to avoid duplicates
                const fabricIds = new Set(byFabric.map(p => p.id));
                byOccasion = byOccasion.filter(p => !fabricIds.has(p.id));
                
                console.log(`[RecommendationService] Found ${byOccasion.length} by occasion`);
            }

            return { byFabric, byOccasion };

        } catch (error) {
            console.error("[RecommendationService] Error fetching similar apparels:", error);
            return { byFabric: [], byOccasion: [] };
        }
    }
}

export const recommendationService = new RecommendationService();

