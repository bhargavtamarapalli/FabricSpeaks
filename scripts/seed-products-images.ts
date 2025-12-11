import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { products, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase for Storage
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Drizzle for DB
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

const IMAGES_DIR = path.resolve(__dirname, '../../product_Images');
const BUCKET_NAME = 'products';

// Mock Data Helpers
function inferCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('coat') || lower.includes('blazer') || lower.includes('shirt') || lower.includes('sweater') || lower.includes('jacket') || lower.includes('top') || lower.includes('saree')) return 'Topwear';
  if (lower.includes('trouser') || lower.includes('pant') || lower.includes('jeans') || lower.includes('skirt')) return 'Bottomwear';
  if (lower.includes('boot') || lower.includes('shoe') || lower.includes('sandal')) return 'Footwear';
  if (lower.includes('bag') || lower.includes('belt') || lower.includes('scarf') || lower.includes('hat')) return 'Accessories';
  return 'Topwear'; // Default
}

function inferPrice(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('luxury') || lower.includes('cashmere') || lower.includes('silk')) return (Math.floor(Math.random() * 10000) + 15000).toString();
  if (lower.includes('coat') || lower.includes('blazer')) return (Math.floor(Math.random() * 5000) + 8000).toString();
  if (lower.includes('shoe') || lower.includes('boot')) return (Math.floor(Math.random() * 4000) + 5000).toString();
  return (Math.floor(Math.random() * 3000) + 2000).toString();
}

function inferFabric(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('cashmere')) return 'Cashmere';
  if (lower.includes('wool')) return 'Wool';
  if (lower.includes('silk')) return 'Silk';
  if (lower.includes('leather')) return 'Leather';
  if (lower.includes('denim')) return 'Denim';
  if (lower.includes('cotton')) return 'Cotton';
  return 'Premium Blend';
}

function cleanName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/_[a-f0-9]{8}$/, "") // Remove hash suffix if present
    .replace(/_/g, " "); // Replace underscores with spaces
}

async function ensureCategories() {
  const cats = ['Topwear', 'Bottomwear', 'Footwear', 'Accessories'];
  const catMap = new Map<string, string>();

  for (const name of cats) {
    let [existing] = await db.select().from(categories).where(eq(categories.name, name));
    if (!existing) {
      console.log(`Creating category: ${name}`);
      [existing] = await db.insert(categories).values({ 
        name, 
        description: `Premium ${name} collection` 
      }).returning();
    }
    catMap.set(name, existing.id);
  }
  return catMap;
}

async function uploadImage(filePath: string, filename: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`seed/${filename}`, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error(`Failed to upload ${filename}:`, error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`seed/${filename}`);

  return publicUrl;
}

async function seed() {
  console.log('Starting seed process...');
  
  // 1. Ensure Categories
  const catMap = await ensureCategories();
  console.log('Categories ensured.');

  // 2. Process Images
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  console.log(`Found ${files.length} images.`);

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const name = cleanName(file);
    const categoryName = inferCategory(name);
    const categoryId = catMap.get(categoryName);
    const price = inferPrice(name);
    const fabric = inferFabric(name);
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    const sku = `SKU-${slug.substring(0, 10).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Upload Image
    const imageUrl = await uploadImage(path.join(IMAGES_DIR, file), file);
    if (!imageUrl) continue;

    console.log(`Uploaded ${file} -> ${imageUrl}`);

    // Insert Product
    try {
      await db.insert(products).values({
        name,
        slug,
        sku,
        description: `A premium ${name} made from high-quality ${fabric}. Perfect for any occasion.`,
        category_id: categoryId,
        price: price,
        cost_price: (parseInt(price) * 0.6).toString(),
        stock_quantity: 50,
        fabric,
        fabric_quality: 'Premium',
        images: [imageUrl],
        status: 'active'
      }).onConflictDoUpdate({
        target: products.sku,
        set: {
          images: [imageUrl],
          price: price,
          stock_quantity: 50
        }
      });
      console.log(`Inserted/Updated product: ${name}`);
    } catch (err) {
      console.error(`Failed to insert product ${name}:`, err);
    }
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed();
