import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function Hero({
  title,
  subtitle,
  imageUrl,
  ctaText = "Shop Now",
  ctaLink = "/shop",
}: HeroProps) {
  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative h-full flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <div className="backdrop-blur-md bg-background/10 rounded-lg p-8 md:p-12">
            <h2
              data-testid="text-hero-title"
              className="text-4xl md:text-6xl font-light text-white mb-4 tracking-tight"
            >
              {title}
            </h2>
            <p
              data-testid="text-hero-subtitle"
              className="text-lg md:text-xl text-white/90 mb-8 font-light"
            >
              {subtitle}
            </p>
            <Link href={ctaLink}>
              <Button
                size="lg"
                variant="outline"
                data-testid="button-hero-cta"
                className="backdrop-blur-sm bg-background/20 text-white border-white/40 hover:bg-background/30 min-h-12 px-8"
              >
                {ctaText}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
