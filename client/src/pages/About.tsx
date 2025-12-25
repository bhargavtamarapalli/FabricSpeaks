import { useLocation } from "wouter";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Card } from "@/components/ui/card";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
              Our Story
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
              About Fabric Speaks
            </h1>
          </motion.div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 md:p-12 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <h2 className="font-display text-3xl mb-6 dark:text-white">The Vision</h2>
                <p className="text-stone-600 dark:text-neutral-400 leading-relaxed mb-6 text-lg font-light">
                  Founded with a vision to redefine men's luxury fashion, Fabric Speaks represents the perfect
                  balance between timeless elegance and contemporary design. Our curated collections
                  feature premium materials and exceptional craftsmanship.
                </p>
                <p className="text-stone-600 dark:text-neutral-400 leading-relaxed text-lg font-light">
                  Every piece in our collection is carefully selected to embody sophistication,
                  quality, and versatility, ensuring that the modern gentleman can build a wardrobe
                  that stands the test of time.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8 md:p-12 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <h2 className="font-display text-3xl mb-8 dark:text-white">Our Values</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="font-display text-xl mb-3 dark:text-white">Quality First</h3>
                    <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed">
                      We source only the finest materials and work with master craftsmen to ensure
                      every piece meets our exacting standards.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-3 dark:text-white">Timeless Design</h3>
                    <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed">
                      Our collections focus on classic silhouettes and refined details that transcend
                      seasonal trends.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-3 dark:text-white">Sustainability</h3>
                    <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed">
                      We're committed to responsible sourcing and ethical production practices that
                      minimize our environmental impact.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-8 md:p-12 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <h2 className="font-display text-3xl mb-6 dark:text-white">Craftsmanship</h2>
                <p className="text-stone-600 dark:text-neutral-400 leading-relaxed text-lg font-light">
                  Each garment in our collection is crafted with meticulous attention to detail.
                  From the initial design sketch to the final stitch, we maintain the highest
                  standards of quality. Our partnerships with renowned European ateliers ensure
                  that every piece exemplifies the pinnacle of luxury menswear.
                </p>
              </Card>
            </motion.div>
          </div>
        </div >
      </main >
    </PageLayout >
  );
}
