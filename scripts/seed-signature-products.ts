
import path from 'path';
import dotenv from 'dotenv';
import { eq } from "drizzle-orm";

// Try loading from .env and .env.local
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log(`Loading env from ${envPath}`);
dotenv.config({ path: envPath });

console.log(`Loading env from ${envLocalPath}`);
dotenv.config({ path: envLocalPath, override: true });

console.log('Loaded env vars:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('KEY')));

const SIGNATURE_PRODUCTS = [
  {
    name: "Camel Hair Overcoat",
    price: "1250.00",
    description: "Crafted from 100% Mongolian cashmere. Double-faced fabric, hand-stitched for unlined comfort.",
    images: [
      "/products/camel-overcoat.png",
      "/products/navy-suit.png",
      "/products/cashmere-turtle.png"
    ],
    slug: "camel-hair-overcoat-signature",
    sku: "SIG-001",
    is_signature: true,
    signature_details: {
      tag: "BEST SELLER",
      colorHex: "#C69C6D",
      product_type: "outerwear",
      certificate: true,
      show_video: true,
      video: "https://cdn.coverr.co/videos/coverr-walking-in-a-coat-2656/1080p.mp4",
      details: {
        fit: "True to size. Model is 6'1\" wearing 40R.",
        care: "Dry clean only.",
        fabric: "100% Mongolian Camel Hair",
        origin: "Inner Mongolia",
        styling: "Layer over our Midnight Navy Suit for a commanding business look, or pair with the Cashmere Turtle for refined weekend luxury."
      },
      image: "/products/camel-overcoat.png"
    },
    stock_quantity: 10,
    category_id: null,
    status: "active",
    premium_segment: true
  },
  {
    name: "Midnight Navy Suit",
    price: "2400.00",
    description: "Super 150s wool with full-canvas construction. Hand-sewn buttonholes and structured shoulder.",
    images: ["/products/navy-suit.png"],
    slug: "midnight-navy-suit-signature",
    sku: "SIG-002",
    is_signature: true,
    signature_details: {
      tag: "SIGNATURE",
      colorHex: "#1B2432",
      product_type: "suit",
      certificate: true,
      show_video: false,
      details: {
        fit: "Tailored Slim. Tapered trouser.",
        care: "Brush after wear.",
        fabric: "Super 150s Merino Wool",
        origin: "Biella, Italy",
        styling: "A versatile powerhouse. Pair with a crisp white shirt for the boardroom or a fine-gauge knit for evening cocktails."
      },
      image: "/products/navy-suit.png"
    },
    stock_quantity: 5,
    status: "active",
    premium_segment: true
  },
  {
    name: "Cashmere Turtle",
    price: "895.00",
    description: "Spun from Hircus goat underfleece. Eight times warmer than wool. Knitted on vintage looms.",
    images: ["/products/cashmere-turtle.png"],
    slug: "cashmere-turtle-signature",
    sku: "SIG-003",
    is_signature: true,
    signature_details: {
      tag: "ESSENTIAL",
      colorHex: "#555555",
      product_type: "knitwear",
      certificate: true,
      show_video: false,
      details: {
        fit: "Relaxed fit. Ribbed cuffs.",
        care: "Hand wash cold.",
        fabric: "100% Hircus Goat Cashmere",
        origin: "Inner Mongolia",
        styling: "Effortless elegance. Wear under our Camel Hair Overcoat for texture, or solo with pleated trousers for a relaxed weekend vibe."
      },
      image: "/products/cashmere-turtle.png"
    },
    stock_quantity: 20,
    status: "active",
    premium_segment: true
  },
  {
    name: "Oxblood Leather",
    price: "3100.00",
    description: "Vegetable-tanned calfskin. Assembled with gunmetal hardware and lined with 100% mulberry silk.",
    images: ["/products/oxblood-leather.png"],
    slug: "oxblood-leather-signature",
    sku: "SIG-004",
    is_signature: true,
    signature_details: {
      tag: "LIMITED",
      colorHex: "#49111C",
      product_type: "jacket",
      certificate: true,
      show_video: false,
      details: {
        fit: "Biker silhouette. Cropped.",
        care: "Condition annually.",
        fabric: "Vegetable-Tanned Calfskin",
        origin: "Florence, Italy",
        styling: "The statement piece. Let it shine over a monochrome black outfit, or pair with denim for a rugged, sophisticated edge."
      },
      image: "/products/oxblood-leather.png"
    },
    stock_quantity: 3,
    status: "active",
    premium_segment: true
  }
];

async function seedSignatureProducts() {
  console.log("Seeding signature products...");

  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import("../server/db/supabase");
  const { products } = await import("../shared/schema");

  for (const product of SIGNATURE_PRODUCTS) {
    try {
      // Check if exists
      const existing = await (db as any).select().from(products).where(eq(products.sku, product.sku));
      
      if (existing.length > 0) {
        console.log(`Updating ${product.name}...`);
        await (db as any).update(products).set(product).where(eq(products.sku, product.sku));
      } else {
        console.log(`Creating ${product.name}...`);
        await (db as any).insert(products).values(product);
      }
    } catch (error) {
      console.error(`Error processing ${product.name}:`, error);
    }
  }

  console.log("Done!");
  process.exit(0);
}

seedSignatureProducts();
