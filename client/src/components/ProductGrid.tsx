import ProductCard from "./ProductCard";
import { Product } from "../../../shared/schema";
import comingSoonImage from "@assets/coming_soon.png";
import { motion } from "framer-motion";

interface ProductGridProps {
  products: Product[];
  title?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProductGrid({ products, title }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {title && (
            <h2
              data-testid="text-grid-title"
              className="text-3xl md:text-4xl font-light text-center mb-12 tracking-tight"
            >
              {title}
            </h2>
          )}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow-2xl">
              <img
                src={comingSoonImage}
                alt="Coming Soon"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-4xl md:text-6xl font-light text-white tracking-widest uppercase">
                  Coming Soon
                </h3>
              </div>
            </div>
            <p className="text-xl text-muted-foreground font-light max-w-md">
              We are crafting something extraordinary. Stay tuned for our exclusive collection.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2
            data-testid="text-grid-title"
            className="text-3xl md:text-4xl font-light text-center mb-12 tracking-tight"
          >
            {title}
          </h2>
        )}

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={item}>
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
        </motion.div>
      </div>
    </section>
  );
}
