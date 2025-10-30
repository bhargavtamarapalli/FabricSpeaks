import ProductCard from "./ProductCard";

interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  imageUrl: string;
  salePrice?: number;
  isNew?: boolean;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
