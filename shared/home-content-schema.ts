import { sql } from "drizzle-orm";
import { pgTable, text, uuid, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Hero Slides for Homepage
export const heroSlides = pgTable("hero_slides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  media_type: text("media_type").notNull(), // 'image' or 'video'
  media_url: text("media_url").notNull(),
  display_order: integer("display_order").notNull().default(0),
  duration_seconds: integer("duration_seconds").default(5), // How long to show this slide
  is_active: boolean("is_active").default(true),
  cta_text: text("cta_text"), // Optional call-to-action text
  cta_link: text("cta_link"), // Optional link
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertHeroSlideSchema = createInsertSchema(heroSlides, {
  title: z.string().min(1, "Title is required").max(100),
  subtitle: z.string().min(1, "Subtitle is required").max(100),
  media_type: z.enum(["image", "video"]),
  media_url: z.string().url("Invalid media URL"),
  display_order: z.number().int().min(0),
  duration_seconds: z.number().int().min(1).max(30),
}).pick({
  title: true,
  subtitle: true,
  media_type: true,
  media_url: true,
  display_order: true,
  duration_seconds: true,
  is_active: true,
  cta_text: true,
  cta_link: true,
});

export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;

// Marquee Messages
export const marqueeMessages = pgTable("marquee_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  display_order: integer("display_order").notNull().default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertMarqueeMessageSchema = createInsertSchema(marqueeMessages, {
  message: z.string().min(1, "Message is required").max(200),
  display_order: z.number().int().min(0),
}).pick({
  message: true,
  display_order: true,
  is_active: true,
});

export type InsertMarqueeMessage = z.infer<typeof insertMarqueeMessageSchema>;
export type MarqueeMessage = typeof marqueeMessages.$inferSelect;

// Featured Fabrics Configuration
export const featuredFabrics = pgTable("featured_fabrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Royal Satin"
  origin: text("origin").notNull(), // e.g., "Imported from Italy"
  description: text("description").notNull(),
  media_type: text("media_type").notNull(), // 'image' or 'video'
  media_url: text("media_url").notNull(),
  fabric_filter: text("fabric_filter").notNull(), // Used to filter products, e.g., "Satin"
  display_order: integer("display_order").notNull().default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertFeaturedFabricSchema = createInsertSchema(featuredFabrics, {
  name: z.string().min(1, "Name is required").max(100),
  origin: z.string().min(1, "Origin is required").max(200),
  description: z.string().min(1, "Description is required").max(500),
  media_type: z.enum(["image", "video"]),
  media_url: z.string().url("Invalid media URL"),
  fabric_filter: z.string().min(1, "Fabric filter is required"),
  display_order: z.number().int().min(0),
}).pick({
  name: true,
  origin: true,
  description: true,
  media_type: true,
  media_url: true,
  fabric_filter: true,
  display_order: true,
  is_active: true,
});

export type InsertFeaturedFabric = z.infer<typeof insertFeaturedFabricSchema>;
export type FeaturedFabric = typeof featuredFabrics.$inferSelect;
