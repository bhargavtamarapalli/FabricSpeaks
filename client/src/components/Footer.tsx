import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/women" data-testid="link-footer-women">
                  <span className="text-muted-foreground hover:text-foreground">Women</span>
                </Link>
              </li>
              <li>
                <Link href="/men" data-testid="link-footer-men">
                  <span className="text-muted-foreground hover:text-foreground">Men</span>
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" data-testid="link-footer-new">
                  <span className="text-muted-foreground hover:text-foreground">New Arrivals</span>
                </Link>
              </li>
              <li>
                <Link href="/sale" data-testid="link-footer-sale">
                  <span className="text-muted-foreground hover:text-foreground">Sale</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">About</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" data-testid="link-footer-about">
                  <span className="text-muted-foreground hover:text-foreground">Our Story</span>
                </Link>
              </li>
              <li>
                <Link href="/sustainability" data-testid="link-footer-sustainability">
                  <span className="text-muted-foreground hover:text-foreground">Sustainability</span>
                </Link>
              </li>
              <li>
                <Link href="/careers" data-testid="link-footer-careers">
                  <span className="text-muted-foreground hover:text-foreground">Careers</span>
                </Link>
              </li>
              <li>
                <Link href="/press" data-testid="link-footer-press">
                  <span className="text-muted-foreground hover:text-foreground">Press</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Customer Service</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" data-testid="link-footer-contact">
                  <span className="text-muted-foreground hover:text-foreground">Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping" data-testid="link-footer-shipping">
                  <span className="text-muted-foreground hover:text-foreground">Shipping & Returns</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" data-testid="link-footer-faq">
                  <span className="text-muted-foreground hover:text-foreground">FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/size-guide" data-testid="link-footer-size">
                  <span className="text-muted-foreground hover:text-foreground">Size Guide</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 uppercase tracking-wider text-sm">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                data-testid="input-newsletter"
                className="flex-1"
              />
              <Button data-testid="button-subscribe" className="bg-accent text-accent-foreground border-accent-border">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Atelier. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-instagram"
            >
              <Instagram className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-facebook"
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-twitter"
            >
              <Twitter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
