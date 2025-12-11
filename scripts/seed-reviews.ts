
import path from 'path';
import dotenv from 'dotenv';
import { eq } from "drizzle-orm";
import crypto from 'crypto';

// Try loading from .env and .env.local
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log(`Loading env from ${envPath}`);
dotenv.config({ path: envPath });

console.log(`Loading env from ${envLocalPath}`);
dotenv.config({ path: envLocalPath, override: true });

const REVIEWS = [
  {
    sku: "SIG-001", // Camel Hair Overcoat
    reviews: [
      {
        rating: 5,
        title: "Unparalleled Craftsmanship",
        comment: "The craftsmanship is simply unparalleled. I've worn this to multiple high-stakes meetings and it never fails to make an impression.",
        verified_purchase: true,
        user_name: "James D."
      },
      {
        rating: 5,
        title: "Absolute Masterpiece",
        comment: "An absolute masterpiece. The fabric feels incredible against the skin, and the fit was perfect right out of the box.",
        verified_purchase: true,
        user_name: "Michael R."
      }
    ]
  },
  {
    sku: "SIG-002", // Midnight Navy Suit
    reviews: [
      {
        rating: 5,
        title: "The Perfect Suit",
        comment: "I've owned many suits, but this one stands apart. The fabric drape is exquisite and the construction is top-tier.",
        verified_purchase: true,
        user_name: "Arthur B."
      },
      {
        rating: 5,
        title: "Worth Every Penny",
        comment: "An investment piece that pays dividends in confidence. The fit is sharp yet comfortable.",
        verified_purchase: true,
        user_name: "David K."
      }
    ]
  },
  {
    sku: "SIG-003", // Cashmere Turtle
    reviews: [
      {
        rating: 5,
        title: "Cloud-Like Softness",
        comment: "Incredibly soft and warm without being bulky. It's become my go-to for winter layering.",
        verified_purchase: true,
        user_name: "Elena S."
      },
      {
        rating: 4,
        title: "Beautiful Texture",
        comment: "The texture is rich and luxurious. Fits slightly large, so I sized down for a more tailored look.",
        verified_purchase: true,
        user_name: "Thomas M."
      }
    ]
  },
  {
    sku: "SIG-004", // Oxblood Leather
    reviews: [
      {
        rating: 5,
        title: "Statement Piece",
        comment: "The color is stunning—deep and rich. The leather is supple and requires zero break-in time.",
        verified_purchase: true,
        user_name: "Olivia P."
      },
      {
        rating: 5,
        title: "Exquisite Quality",
        comment: "Every detail, from the hardware to the silk lining, screams luxury. A true collector's item.",
        verified_purchase: true,
        user_name: "Richard L."
      }
    ]
  }
];

async function seedReviews() {
  console.log("Seeding reviews...");

  // Dynamic imports
  const { db } = await import("../server/db/supabase");
  const { products, productReviews, users } = await import("../shared/schema");

  // Get a default user ID to associate reviews with (or create a dummy one)
  // We will create users dynamically in the loop based on reviewer names.


  for (const item of REVIEWS) {
    try {
      // Find product by SKU
      const product = await (db as any).select().from(products).where(eq(products.sku, item.sku)).limit(1);
      
      if (product.length === 0) {
        console.log(`Product with SKU ${item.sku} not found. Skipping.`);
        continue;
      }

      const productId = product[0].id;

      // Insert reviews
      for (const review of item.reviews) {
        // Create or find user for this review
        let reviewUserId;
        const username = review.user_name.toLowerCase().replace(/[^a-z0-9]/g, '') + "_reviewer";
        
        const existingUser = await (db as any).select().from(users).where(eq(users.username, username)).limit(1);
        
        if (existingUser.length > 0) {
            reviewUserId = existingUser[0].user_id;
        } else {
            // Create new user
            console.log(`Creating user ${review.user_name}...`);
            const newUserId = crypto.randomUUID();
            await (db as any).insert(users).values({
                user_id: newUserId,
                username: username,
                full_name: review.user_name,
                email: `${username}@example.com`,
                role: 'user'
            });
            reviewUserId = newUserId;
        }

        // Check if review already exists
        const existingReview = await (db as any).select().from(productReviews).where(
            eq(productReviews.product_id, productId)
        );
        
        const isDuplicate = existingReview.some((r: any) => r.comment === review.comment);

        if (!isDuplicate) {
            console.log(`Adding review for ${item.sku} by ${review.user_name}...`);
            await (db as any).insert(productReviews).values({
                product_id: productId,
                user_id: reviewUserId,
                rating: review.rating,
                title: review.title,
                comment: review.comment,
                verified_purchase: review.verified_purchase,
            });
        } else {
            console.log(`Review for ${item.sku} already exists.`);
        }
      }
    } catch (error) {
      console.error(`Error processing reviews for ${item.sku}:`, error);
    }
  }

  console.log("Done!");
  process.exit(0);
}

seedReviews();
