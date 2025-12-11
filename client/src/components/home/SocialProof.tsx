import { motion } from "framer-motion";
import { Star, Quote, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SocialProof() {
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['recent-reviews'],
        queryFn: async () => {
            const res = await fetch('/api/reviews/recent?limit=3');
            if (!res.ok) return [];
            return res.json();
        }
    });

    if (isLoading || !reviews || reviews.length === 0) {
        // Fallback or loading state
        return null;
    }

    return (
        <section className="py-24 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-5 h-5 text-amber-500 fill-current" />
                        ))}
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl mb-4 dark:text-white">Trusted by Connoisseurs</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 font-light">Join thousands of satisfied customers.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review: any, i: number) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-black p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative"
                        >
                            <div className="absolute top-6 right-6 text-neutral-200 dark:text-neutral-800">
                                <Quote className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                                ))}
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-300 italic mb-6 leading-relaxed">
                                "{review.comment}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center font-serif font-bold text-neutral-500 dark:text-neutral-400">
                                    {review.user?.full_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm dark:text-white">{review.user?.full_name || "Anonymous"}</h4>
                                    {review.verified_purchase && (
                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Verified Buyer
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
