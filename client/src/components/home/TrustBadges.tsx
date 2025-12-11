import { Truck, ShieldCheck, RefreshCcw, Gem } from "lucide-react";

export default function TrustBadges() {
    const badges = [
        { icon: <Truck className="w-5 h-5" />, text: "Free Worldwide Shipping" },
        { icon: <ShieldCheck className="w-5 h-5" />, text: "Secure Checkout" },
        { icon: <RefreshCcw className="w-5 h-5" />, text: "30-Day Returns" },
        { icon: <Gem className="w-5 h-5" />, text: "Authenticity Guaranteed" },
    ];

    return (
        <section className="py-12 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                    {badges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                            {badge.icon}
                            <span className="text-sm uppercase tracking-wider font-medium">{badge.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
