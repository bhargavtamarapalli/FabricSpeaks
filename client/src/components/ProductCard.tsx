import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { WishlistButtonCompact } from "@/components/WishlistButton";

interface ProductCardProps {
  id: string;
  brand: string | null;
  name: string;
  price: number;
  imageUrl: string;
  salePrice?: number;
  isNew?: boolean;
}

export default function ProductCard({
  id,
  brand,
  name,
  price,
  imageUrl,
  salePrice,
  isNew,
  onAddToCart,
}: ProductCardProps & { onAddToCart?: (e: React.MouseEvent) => void }) {
  const [imgError, setImgError] = useState(false);
  const discountPercentage = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  // Fallback image (using a placeholder service or a local asset if available)
  const fallbackImage = "https://placehold.co/400x600/f5f5f5/a3a3a3?text=No+Image";

  return (
    <div className="relative group">
      <Link href={`/product/${id}`}>
        <Card
          data-testid={`card-product-${id}`}
          className="cursor-pointer overflow-hidden hover-elevate active-elevate-2 transition-all duration-200 border-none shadow-none bg-transparent"
        >

          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
            <WishlistButtonCompact productId={id} />
            <img
              src={imgError ? fallbackImage : (imageUrl || fallbackImage)}
              alt={`${brand || ''} ${name}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              data-testid={`img-product-${id}`}
              onError={() => setImgError(true)}
            />
            {(salePrice || isNew) && (
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {salePrice && (
                  <Badge
                    data-testid={`badge-sale-${id}`}
                    className="bg-accent text-accent-foreground border-accent-border"
                  >
                    -{discountPercentage}%
                  </Badge>
                )}
                {isNew && (
                  <Badge
                    data-testid={`badge-new-${id}`}
                    variant="secondary"
                  >
                    NEW
                  </Badge>
                )}
              </div>
            )}

            {onAddToCart && (
              <>
                {/* Desktop: Slide-up button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart(e);
                  }}
                  className="hidden md:block absolute bottom-0 left-0 w-full bg-black text-white py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 font-medium text-sm uppercase tracking-wide z-10"
                >
                  Quick Add
                </button>

                {/* Mobile: Floating Action Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart(e);
                  }}
                  className="md:hidden absolute bottom-3 right-3 h-10 w-10 bg-white text-black rounded-full shadow-lg flex items-center justify-center z-10 active:scale-90 transition-transform"
                  aria-label="Add to Cart"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="space-y-1">
            {brand && (
              <div
                data-testid={`text-brand-${id}`}
                className="text-xs uppercase tracking-widest text-muted-foreground"
              >
                {brand}
              </div>
            )}
            <h3
              data-testid={`text-name-${id}`}
              className="font-display text-xl mb-1 line-clamp-2"
            >
              {name}
            </h3>
            <div className="flex items-center gap-2 pt-1">
              {salePrice ? (
                <>
                  <span
                    data-testid={`text-sale-price-${id}`}
                    className="font-medium text-lg"
                  >
                    ₹{salePrice}
                  </span>
                  <span
                    data-testid={`text-original-price-${id}`}
                    className="text-sm text-muted-foreground line-through"
                  >
                    ₹{price}
                  </span>
                </>
              ) : (
                <span
                  data-testid={`text-price-${id}`}
                  className="font-medium text-lg"
                >
                  ₹{price}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
