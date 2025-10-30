import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ProductCardProps {
  id: string;
  brand: string;
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
}: ProductCardProps) {
  const discountPercentage = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <Link href={`/product/${id}`}>
      <Card
        data-testid={`card-product-${id}`}
        className="group cursor-pointer overflow-hidden hover-elevate active-elevate-2 transition-all duration-200"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={`${brand} ${name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-product-${id}`}
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
        </div>

        <div className="p-4 space-y-1">
          <div
            data-testid={`text-brand-${id}`}
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            {brand}
          </div>
          <h3
            data-testid={`text-name-${id}`}
            className="font-medium text-base line-clamp-2"
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
                  ${salePrice}
                </span>
                <span
                  data-testid={`text-original-price-${id}`}
                  className="text-sm text-muted-foreground line-through"
                >
                  ${price}
                </span>
              </>
            ) : (
              <span
                data-testid={`text-price-${id}`}
                className="font-medium text-lg"
              >
                ${price}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
