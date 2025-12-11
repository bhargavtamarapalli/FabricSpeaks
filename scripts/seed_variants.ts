
import '../server/env'; // Must be first
import { db } from '../server/db/supabase';
import { products, productVariants } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding test data for Product Variants...');

  try {
    // 1. Create a test product
    const productData = {
      name: "Premium Cotton T-Shirt",
      sku: "TSHIRT-BASE-001", // Added required SKU
      description: "A high-quality cotton t-shirt available in multiple sizes and colours.",
      price: "29.99",
      sale_price: null,
      stock_quantity: 100, // Aggregate stock
      brand: "Fabric Speaks",
      category_id: null, // Optional
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      fabric_quality: "Premium Cotton",
      care_instructions: "Machine wash cold",
      seasonality: "All Season",
      size: null, // Legacy field
      colour: null, // Legacy field
      status: "active"
    };

    console.log('Creating product...');
    const [product] = await db.insert(products).values(productData).returning();
    console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);

    // 2. Create variants
    const variantsData = [
      {
        product_id: product.id,
        size: "S",
        colour: "White",
        stock_quantity: 10,
        sku: "TSHIRT-WHT-S",
        price_adjustment: "0"
      },
      {
        product_id: product.id,
        size: "M",
        colour: "White",
        stock_quantity: 15,
        sku: "TSHIRT-WHT-M",
        price_adjustment: "0"
      },
      {
        product_id: product.id,
        size: "L",
        colour: "White",
        stock_quantity: 0, // Out of stock test
        sku: "TSHIRT-WHT-L",
        price_adjustment: "0"
      },
      {
        product_id: product.id,
        size: "S",
        colour: "Black",
        stock_quantity: 20,
        sku: "TSHIRT-BLK-S",
        price_adjustment: "0"
      },
      {
        product_id: product.id,
        size: "M",
        colour: "Black",
        stock_quantity: 5, // Low stock
        sku: "TSHIRT-BLK-M",
        price_adjustment: "0"
      },
      {
        product_id: product.id,
        size: "XL",
        colour: "Black",
        stock_quantity: 8,
        sku: "TSHIRT-BLK-XL",
        price_adjustment: "5.00" // Price increase for XL
      }
    ];

    console.log('Creating variants...');
    const variants = await db.insert(productVariants).values(variantsData).returning();
    console.log(`✅ Created ${variants.length} variants`);

    console.log('\n🎉 Seeding complete!');
    console.log('------------------------------------------------');
    console.log(`👉 Test URL: http://localhost:5000/product/${product.id}`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
