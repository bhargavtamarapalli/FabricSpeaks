import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ProductDetailProps {
  brand: string;
  name: string;
  price: number;
  salePrice?: number;
  description: string;
  images: string[];
  sizes: string[];
  onAddToCart: (size: string) => void;
}

export default function ProductDetail({
  brand,
  name,
  price,
  salePrice,
  description,
  images,
  sizes,
  onAddToCart,
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleAddToCart = () => {
    if (selectedSize) {
      onAddToCart(selectedSize);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            <img
              src={images[selectedImage]}
              alt={`${brand} ${name}`}
              className="w-full h-full object-cover"
              data-testid="img-main-product"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-[3/4] bg-muted rounded-md overflow-hidden ${
                    selectedImage === index ? "ring-2 ring-primary" : ""
                  }`}
                  data-testid={`button-thumbnail-${index}`}
                >
                  <img
                    src={image}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          <div>
            <div
              data-testid="text-brand"
              className="text-xs uppercase tracking-widest text-muted-foreground mb-2"
            >
              {brand}
            </div>
            <h1 data-testid="text-product-name" className="text-3xl font-light mb-4">
              {name}
            </h1>
            <div className="flex items-center gap-3">
              {salePrice ? (
                <>
                  <span data-testid="text-sale-price" className="text-2xl font-medium">
                    ${salePrice}
                  </span>
                  <span
                    data-testid="text-original-price"
                    className="text-lg text-muted-foreground line-through"
                  >
                    ${price}
                  </span>
                  <Badge className="bg-accent text-accent-foreground border-accent-border">
                    Save ${price - salePrice}
                  </Badge>
                </>
              ) : (
                <span data-testid="text-price" className="text-2xl font-medium">
                  ${price}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider">Select Size</Label>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  onClick={() => setSelectedSize(size)}
                  data-testid={`button-size-${size}`}
                  className="h-12"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedSize}
            onClick={handleAddToCart}
            data-testid="button-add-to-cart"
          >
            Add to Bag
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Free shipping on orders over $200
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger data-testid="button-description">
                Description
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details">
              <AccordionTrigger data-testid="button-details">
                Product Details
              </AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Made in Italy</li>
                  <li>• Premium quality materials</li>
                  <li>• Dry clean only</li>
                  <li>• True to size</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger data-testid="button-shipping">
                Shipping & Returns
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Free standard shipping on orders over $200. Express shipping available.
                  Easy returns within 30 days.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-medium ${className}`}>{children}</div>;
}
