import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, boolean, timestamp, uuid, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for backward compatibility with existing code)
export const users = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().unique(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  email_verified: boolean("email_verified").default(false),
  full_name: text("full_name"),
  phone: text("phone"),
  phone_verified: boolean("phone_verified").default(false),
  avatar_url: text("avatar_url"),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_profiles_user_id").on(table.user_id),
  createdAtIdx: index("idx_profiles_created_at").on(table.created_at),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  user_id: true,
  username: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Profiles table for role-based access (alias for users)
export const profiles = users;

export const insertProfileSchema = insertUserSchema;
export type InsertProfile = InsertUser;
export type Profile = User;

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").unique(),
  name: text("name").notNull().unique(),
  description: text("description").default(""),
  parent_id: uuid("parent_id"),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentIdIdx: index("idx_categories_parent_id").on(table.parent_id),
  nameIdx: index("idx_categories_name").on(table.name),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, {
    relationName: "category_parent",
  }),
  products: many(products),
}));

export const insertCategorySchema = createInsertSchema(categories).pick({
  slug: true,
  name: true,
  description: true,
  parent_id: true,
  display_order: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").unique(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category_id: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
  brand: text("brand"),
  size: text("size"),
  colour: text("colour"),
  fabric: text("fabric"),
  fabric_quality: text("fabric_quality"),
  premium_segment: boolean("premium_segment").default(false),
  is_signature: boolean("is_signature").default(false),
  status: text("status").default("active"),
  stock_quantity: integer("stock_quantity").notNull().default(0),
  low_stock_threshold: integer("low_stock_threshold").default(10),
  signature_details: jsonb("signature_details").$type<any>().default({}),
  wash_care: text("wash_care"),
  imported_from: text("imported_from"),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // New Fabric & Apparel Attributes
  is_imported: boolean("is_imported").default(false),
  gsm: integer("gsm"),
  weave: text("weave"),
  occasion: text("occasion"),
  pattern: text("pattern"),
  fit: text("fit"),
  related_product_ids: jsonb("related_product_ids").$type<string[]>().default([]),
  sale_price: decimal("sale_price", { precision: 10, scale: 2 }),
  sale_start_at: timestamp("sale_start_at"),
  sale_end_at: timestamp("sale_end_at"),
  main_image: text("main_image"),
  color_images: jsonb("color_images").$type<Record<string, string[]>>().default({}),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdIdx: index("idx_products_category_id").on(table.category_id),
  statusIdx: index("idx_products_status").on(table.status),
  createdAtIdx: index("idx_products_created_at").on(table.created_at),
  isOnSaleIdx: index("idx_products_is_on_sale").on(table.sale_price), // Using sale_price as proxy for is_on_sale since is_on_sale isn't a column but a derived state often
  isSignatureIdx: index("idx_products_is_signature").on(table.is_signature),
  statusCategoryIdx: index("idx_products_status_category").on(table.status, table.category_id),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).pick({
  slug: true,
  name: true,
  sku: true,
  description: true,
  category_id: true,
  brand: true,
  size: true,
  colour: true,
  fabric: true,
  fabric_quality: true,
  premium_segment: true,
  is_imported: true,
  gsm: true,
  weave: true,
  occasion: true,
  pattern: true,
  fit: true,
  related_product_ids: true,
  is_signature: true,
  status: true,
  low_stock_threshold: true,
  signature_details: true,
  wash_care: true,
  imported_from: true,
  cost_price: true,
  price: true,
  sale_price: true,
  sale_start_at: true,
  sale_end_at: true,
  color_images: true,
  main_image: true, // Added for main image persistence
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product Variants
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  size: text("size"),
  colour: text("colour"),
  stock_quantity: integer("stock_quantity").notNull().default(0),
  sku: text("sku").unique(),
  price_adjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("active"),
  images: jsonb("images").$type<string[]>().default([]), // Variant-specific images
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).pick({
  product_id: true,
  size: true,
  colour: true,
  stock_quantity: true,
  sku: true,
  price_adjustment: true,
  status: true,
  images: true,
});

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

// Inventory Logs
export const inventoryLogs = pgTable("inventory_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  adjustment_amount: integer("adjustment_amount").notNull(),
  reason: text("reason").default(""),
  previous_quantity: integer("previous_quantity"),
  new_quantity: integer("new_quantity"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).pick({
  product_id: true,
  adjustment_amount: true,
  reason: true,
  previous_quantity: true,
  new_quantity: true,
});

export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;

// Price History
export const priceHistory = pgTable("price_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  old_price: decimal("old_price", { precision: 10, scale: 2 }),
  new_price: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  sale_price: decimal("sale_price", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).pick({
  product_id: true,
  old_price: true,
  new_price: true,
  sale_price: true,
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

// Carts and Items
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => profiles.user_id),
  session_id: text("session_id"), // For guest carts
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cart_id: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id),
  variant_id: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  size: text("size"),
  colour: text("colour"),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  cartIdIdx: index("idx_cart_items_cart_id").on(table.cart_id),
}));

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cart_id: true,
  product_id: true,
  variant_id: true,
  quantity: true,
  size: true,
  colour: true,
  unit_price: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;

// Addresses
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().references(() => profiles.user_id),
  type: text("type").notNull(), // 'billing' or 'shipping'
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  company: text("company"),
  address_line_1: text("address_line_1").notNull(),
  address_line_2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postal_code: text("postal_code").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_addresses_user_id").on(table.user_id),
}));

export const insertAddressSchema = createInsertSchema(addresses).pick({
  user_id: true,
  type: true,
  first_name: true,
  last_name: true,
  company: true,
  address_line_1: true,
  address_line_2: true,
  city: true,
  state: true,
  postal_code: true,
  country: true,
  phone: true,
  is_default: true,
});

export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

// Orders and Order Items
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => profiles.user_id), // Now nullable for guests
  session_id: text("session_id"), // For guest tracking
  guest_email: text("guest_email"),
  guest_phone: text("guest_phone"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shipping_address_id: uuid("shipping_address_id").references(() => addresses.id),
  shipping_address_snapshot: jsonb("shipping_address_snapshot"), // Stores full address object for history/guests
  billing_address_id: uuid("billing_address_id").references(() => addresses.id),
  payment_method: text("payment_method"),
  payment_status: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  payment_provider_id: text("payment_provider_id"),
  tracking_number: text("tracking_number"),
  courier: text("courier"), // e.g., 'FedEx', 'DHL', 'Blue Dart', 'DTDC'
  shipped_at: timestamp("shipped_at"),
  estimated_delivery: timestamp("estimated_delivery"),
  coupon_id: uuid("coupon_id"),
  discount_amount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  delivery_option: text("delivery_option").default("standard"), // 'standard', 'express'
  gift_message: text("gift_message"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_orders_user_id").on(table.user_id),
  sessionIdIdx: index("idx_orders_session_id").on(table.session_id), // New index
  statusIdx: index("idx_orders_status").on(table.status),
  paymentStatusIdx: index("idx_orders_payment_status").on(table.payment_status),
  createdAtIdx: index("idx_orders_created_at").on(table.created_at),
  userStatusIdx: index("idx_orders_user_status").on(table.user_id, table.status),
}));

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id),
  variant_id: uuid("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  size: text("size"),
  total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  orderIdIdx: index("idx_order_items_order_id").on(table.order_id),
  productIdIdx: index("idx_order_items_product_id").on(table.product_id),
}));

export const insertOrderSchema = createInsertSchema(orders).pick({
  user_id: true,
  session_id: true,
  guest_email: true,
  guest_phone: true,
  status: true,
  total_amount: true,
  shipping_address_id: true,
  billing_address_id: true,
  payment_method: true,
  payment_status: true,
  payment_provider_id: true,
  tracking_number: true,
  notes: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  order_id: true,
  product_id: true,
  variant_id: true,
  quantity: true,
  unit_price: true,
  size: true,
  total_price: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

// Wishlists
export const wishlists = pgTable("wishlists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull().default("My Wishlist"),
  is_default: boolean("is_default").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlists, {
  name: z.string().trim().min(1, "Wishlist name is required").max(100, "Wishlist name too long"),
  is_default: z.boolean().optional(),
}).pick({
  user_id: true,
  name: true,
  is_default: true,
});

export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;

// Wishlist Items
export const wishlistItems = pgTable("wishlist_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wishlist_id: uuid("wishlist_id").notNull().references(() => wishlists.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variant_id: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  added_at: timestamp("added_at").defaultNow(),
  notes: text("notes"),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems, {
  notes: z.string().max(500, "Notes too long").optional().nullable(),
}).pick({
  wishlist_id: true,
  product_id: true,
  variant_id: true,
  notes: true,
});

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// Product Reviews
export const productReviews = pgTable("product_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull(),
  variant_id: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment").notNull(),
  verified_purchase: boolean("verified_purchase").default(false),
  helpful_count: integer("helpful_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews, {
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().trim().max(200, "Title too long").optional().nullable(),
  comment: z.string().trim().min(1, "Review comment is required").max(2000, "Review too long"),
}).pick({
  product_id: true,
  user_id: true,
  variant_id: true,
  rating: true,
  title: true,
  comment: true,
  verified_purchase: true,
});

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

// Review Helpful Votes
export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  review_id: uuid("review_id").notNull().references(() => productReviews.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertReviewHelpfulVoteSchema = createInsertSchema(reviewHelpfulVotes).pick({
  review_id: true,
  user_id: true,
});

export type InsertReviewHelpfulVote = z.infer<typeof insertReviewHelpfulVoteSchema>;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;

// Login Attempts
export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  ip_address: text("ip_address").notNull(),
  user_agent: text("user_agent").notNull(),
  success: boolean("success").notNull(),
  failure_reason: text("failure_reason"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).pick({
  username: true,
  ip_address: true,
  user_agent: true,
  success: true,
  failure_reason: true,
});

export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

// Stock Notifications
export const stockNotifications = pgTable("stock_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => profiles.user_id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variant_id: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  notified: boolean("notified").default(false),
  created_at: timestamp("created_at").defaultNow(),
  notified_at: timestamp("notified_at"),
});

export const insertStockNotificationSchema = createInsertSchema(stockNotifications, {
  email: z.string().email("Invalid email address"),
}).pick({
  user_id: true,
  product_id: true,
  variant_id: true,
  email: true,
});

export type InsertStockNotification = z.infer<typeof insertStockNotificationSchema>;
export type StockNotification = typeof stockNotifications.$inferSelect;

// Coupons
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description"),
  discount_type: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discount_value: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  min_order_value: decimal("min_order_value", { precision: 10, scale: 2 }).default("0"),
  max_discount_amount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  usage_limit: integer("usage_limit"),
  usage_count: integer("usage_count").default(0),
  user_specific: boolean("user_specific").default(false),
  user_id: uuid("user_id").references(() => profiles.user_id, { onDelete: "cascade" }),
  valid_from: timestamp("valid_from").defaultNow(),
  valid_until: timestamp("valid_until"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons, {
  code: z.string().min(3).max(50).toUpperCase(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive(),
  min_order_value: z.number().min(0).optional(),
  max_discount_amount: z.number().positive().optional(),
}).pick({
  code: true,
  description: true,
  discount_type: true,
  discount_value: true,
  min_order_value: true,
  max_discount_amount: true,
  usage_limit: true,
  user_specific: true,
  user_id: true,
  valid_from: true,
  valid_until: true,
  is_active: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Coupon Usage
export const couponUsage = pgTable("coupon_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  coupon_id: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => profiles.user_id, { onDelete: "cascade" }),
  order_id: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  discount_amount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  used_at: timestamp("used_at").defaultNow(),
});

export type CouponUsage = typeof couponUsage.$inferSelect;

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().references(() => profiles.user_id),
  action: text("action").notNull(), // e.g., 'create_product', 'update_order'
  entity: text("entity").notNull(), // e.g., 'product', 'order'
  entity_id: text("entity_id").notNull(),
  details: jsonb("details").default(sql`'{}'::jsonb`),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  user_id: true,
  action: true,
  entity: true,
  entity_id: true,
  details: true,
  ip_address: true,
  user_agent: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export * from "./newsletter-schema";

// Inventory Reservations (for race condition handling)
export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variant_id: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  user_id: uuid("user_id").references(() => profiles.user_id, { onDelete: "cascade" }), // Nullable for guests
  quantity: integer("quantity").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  status: text("status").notNull().default("active"), // 'active', 'confirmed', 'expired'
  session_id: text("session_id"), // For guest checkout support
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  product_id: true,
  variant_id: true,
  user_id: true,
  quantity: true,
  expires_at: true,
  status: true,
  session_id: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contact_person: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  lead_time_days: integer("lead_time_days").default(7),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  email: z.string().email().optional().nullable(),
}).pick({
  name: true,
  contact_person: true,
  email: true,
  phone: true,
  address: true,
  lead_time_days: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Product Suppliers (Many-to-Many)
export const productSuppliers = pgTable("product_suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplier_id: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  supplier_sku: text("supplier_sku"),
  is_preferred: boolean("is_preferred").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertProductSupplierSchema = createInsertSchema(productSuppliers).pick({
  product_id: true,
  supplier_id: true,
  cost_price: true,
  supplier_sku: true,
  is_preferred: true,
});

export type InsertProductSupplier = z.infer<typeof insertProductSupplierSchema>;
export type ProductSupplier = typeof productSuppliers.$inferSelect;

// Marketing Campaigns
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'whatsapp', 'email'
  subject: text("subject"), // For email
  message: text("message").notNull(), // Content
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sent', 'failed'
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  recipient_count: integer("recipient_count").default(0),
  sent_count: integer("sent_count").default(0),
  failed_count: integer("failed_count").default(0),
  created_by: uuid("created_by").references(() => profiles.user_id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).pick({
  name: true,
  type: true,
  subject: true,
  message: true,
  status: true,
  scheduled_at: true,
});

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

// CMS Content
export const cmsContent = pgTable("cms_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'banner', 'poll', 'blog'
  title: text("title").notNull(),
  content: jsonb("content").default(sql`'{}'::jsonb`),
  is_active: boolean("is_active").default(true),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  display_order: integer("display_order").default(0),
  created_by: uuid("created_by").references(() => profiles.user_id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertCmsContentSchema = createInsertSchema(cmsContent).pick({
  type: true,
  title: true,
  content: true,
  is_active: true,
  start_date: true,
  end_date: true,
  display_order: true,
});

export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type CmsContent = typeof cmsContent.$inferSelect;

// Poll Votes
export const pollVotes = pgTable("poll_votes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  poll_id: uuid("poll_id").notNull().references(() => cmsContent.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => profiles.user_id, { onDelete: "cascade" }),
  option_index: integer("option_index").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).pick({
  poll_id: true,
  user_id: true,
  option_index: true,
});

export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;

// ============================================================================
// Admin Notifications Tables
// ============================================================================

/**
 * Admin Notifications Table
 * Stores notification history for admin users
 */
export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  recipient_id: uuid("recipient_id").references(() => notificationRecipients.id),
  user_id: uuid("user_id").references(() => profiles.user_id),
  status: varchar("status", { length: 50 }).default("pending"),
  sent_at: timestamp("sent_at"),
  read_at: timestamp("read_at"),
  error: text("error"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).pick({
  type: true,
  priority: true,
  title: true,
  message: true,
  channel: true,
  recipient_id: true,
  user_id: true,
  metadata: true,
});

export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

/**
 * Notification Preferences Table
 */
// Notification Preferences Table
// Notification Preferences Table
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().references(() => profiles.user_id).unique(),
  order_alerts: boolean("order_alerts").default(true),
  inventory_alerts: boolean("inventory_alerts").default(true),
  customer_alerts: boolean("customer_alerts").default(true),
  system_alerts: boolean("system_alerts").default(true),
  marketing_alerts: boolean("marketing_alerts").default(false),
  email_enabled: boolean("email_enabled").default(true),
  whatsapp_enabled: boolean("whatsapp_enabled").default(false),
  sms_enabled: boolean("sms_enabled").default(false),
  in_app_enabled: boolean("in_app_enabled").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).pick({
  user_id: true,
  order_alerts: true,
  inventory_alerts: true,
  customer_alerts: true,
  system_alerts: true,
  marketing_alerts: true,
  email_enabled: true,
  whatsapp_enabled: true,
  sms_enabled: true,
  in_app_enabled: true,
});

export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

/**
 * Notification Recipients Table
 */
export const notificationRecipients = pgTable("notification_recipients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  whatsapp_number: varchar("whatsapp_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 50 }).default("admin"),
  notification_types: jsonb("notification_types").default({}),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertNotificationRecipientSchema = createInsertSchema(notificationRecipients).pick({
  name: true,
  whatsapp_number: true,
  email: true,
  role: true,
  notification_types: true,
  is_active: true,
});

export type InsertNotificationRecipient = z.infer<typeof insertNotificationRecipientSchema>;
export type NotificationRecipient = typeof notificationRecipients.$inferSelect;

// Password Resets (For Phone Auth)
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).pick({
  phone: true,
  otp: true,
  expires_at: true,
});

// Generic Verifications (Email/Phone)
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'email' or 'phone'
  identifier: text("identifier").notNull(), // email or phone number
  otp: text("otp").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verifications).pick({
  type: true,
  identifier: true,
  otp: true,
  expires_at: true,
});

export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;
