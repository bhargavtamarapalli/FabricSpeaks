/**
 * Similar Apparels Component
 * 
 * Displays recommendations based on:
 * 1. Similar by Fabric - products with same fabric type
 * 2. For This Occasion - products with same occasion
 */

import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SimilarApparelsProps {
    productId: string;
}

interface SimilarApparelsResponse {
    byFabric: any[];
    byOccasion: any[];
}

export default function SimilarApparels({ productId }: SimilarApparelsProps) {
    const { data, isLoading } = useQuery<SimilarApparelsResponse>({
        queryKey: ['similar-apparels', productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}/similar-apparels`);
            if (!res.ok) return { byFabric: [], byOccasion: [] };
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
        );
    }

    const hasFabric = data?.byFabric && data.byFabric.length > 0;
    const hasOccasion = data?.byOccasion && data.byOccasion.length > 0;

    if (!hasFabric && !hasOccasion) {
        return null;
    }

    return (
        <>
            {/* Similar by Fabric Section */}
            {hasFabric && (
                <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="font-display text-3xl md:text-4xl mb-4 dark:text-white">Similar Fabric</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 font-light">
                                More pieces in the same premium fabric.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {data.byFabric.map((product: any, i: number) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <ProductCard
                                        id={product.id}
                                        brand={product.brand}
                                        name={product.name}
                                        price={Number(product.price)}
                                        imageUrl={(product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : ""}
                                        salePrice={product.sale_price ? Number(product.sale_price) : undefined}
                                        isNew={product.created_at ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* For This Occasion Section */}
            {hasOccasion && (
                <section className="py-16 bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-800">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="font-display text-3xl md:text-4xl mb-4 dark:text-white">For This Occasion</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 font-light">
                                Perfect matches for the same setting.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {data.byOccasion.map((product: any, i: number) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <ProductCard
                                        id={product.id}
                                        brand={product.brand}
                                        name={product.name}
                                        price={Number(product.price)}
                                        imageUrl={(product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : ""}
                                        salePrice={product.sale_price ? Number(product.sale_price) : undefined}
                                        isNew={product.created_at ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
