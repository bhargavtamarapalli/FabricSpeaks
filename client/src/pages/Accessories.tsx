import { useLocation } from "wouter";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Lock } from "lucide-react";
import comingSoonImage from "@assets/coming_soon.png";

function QuotesMarquee() {
  const quotes = [
    "The details are not the details. They make the design.",
    "Simplicity is the ultimate sophistication.",
    "Elegance is the only beauty that never fades.",
    "Style is a way to say who you are without having to speak.",
    "Quality is remembered long after price is forgotten."
  ];

  return (
    <div className="bg-amber-600 text-white py-6 overflow-hidden border-t border-white/10 relative z-20">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap gap-16 items-center"
      >
        {[...quotes, ...quotes, ...quotes].map((quote, i) => (
          <div key={i} className="flex items-center gap-16">
            <span className="font-display text-2xl md:text-3xl italic">{quote}</span>
            <span className="w-2 h-2 rounded-full bg-black/30" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Accessories() {
  const [, setLocation] = useLocation();

  return (
    <PageLayout className="min-h-screen flex flex-col font-sans bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-white transition-colors duration-300">
      <main className="flex-1 relative flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[85vh]">
          {/* Background Image with Blur */}
          <div className="absolute inset-0 z-0">
            <img
              src={comingSoonImage}
              alt="Background"
              className="w-full h-full object-cover opacity-10 dark:opacity-30 scale-110 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/60 to-transparent dark:from-neutral-900 dark:via-neutral-900/60 dark:to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full py-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 mb-6">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold tracking-widest uppercase">Launching Soon</span>
              </div>
              <h1 className="font-display text-6xl md:text-8xl text-stone-900 dark:text-white mb-6 leading-none">
                Refined <br />
                <span className="text-stone-500 dark:text-neutral-500 italic font-serif-alt">Details</span>
              </h1>
              <p className="text-stone-600 dark:text-neutral-300 text-lg font-light leading-relaxed mb-10 max-w-md">
                True style lies in the details. Our upcoming accessories collection brings you the finishing touches that define a gentleman. From handcrafted leather to artisanal metals.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-md p-2 rounded-full border border-stone-200 dark:border-white/10 max-w-md shadow-sm">
                <Input
                  placeholder="Join the waitlist..."
                  className="bg-transparent border-none text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-neutral-500 focus-visible:ring-0 h-12 px-6"
                />
                <Button className="w-full sm:w-auto rounded-full bg-amber-600 hover:bg-amber-700 text-white px-8 h-12">
                  Join <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <p className="text-stone-500 dark:text-neutral-500 text-xs mt-4 ml-4">Be the first to know when the collection drops.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block relative"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 ease-out">
                <img
                  src={comingSoonImage}
                  alt="Accessories Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 bg-white/80 dark:bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex justify-between items-center text-stone-900 dark:text-white">
                    <div>
                      <p className="font-display text-xl mb-1">Signature Collection</p>
                      <p className="text-xs text-stone-600 dark:text-neutral-300 uppercase tracking-wider">Fall / Winter 2025</p>
                    </div>
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </section>

        {/* Scrolling Quotes Banner */}
        <QuotesMarquee />
      </main>
    </PageLayout>
  );
}
