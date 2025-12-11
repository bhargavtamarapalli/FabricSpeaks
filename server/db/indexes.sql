/**
 * Database Indexes and Constraints
 * 
 * Critical indexes for query performance.
 * Implements BLOCKER B3 - Missing database indexes
 * 
 * **Performance Impact:**
 * - Without indexes: O(n) table scans
 * - With indexes: O(log n) lookups
 * 
 * @module server/db/indexes
 */

-- ============================================================================
-- Products Table Indexes
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Status and filtering indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_is_signature ON products(is_signature);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_status 
  ON products(category_id, status);

CREATE INDEX IF NOT EXISTS idx_products_status_created 
  ON products(status, created_at DESC);

-- Stock management index
CREATE INDEX IF NOT EXISTS idx_products_stock 
  ON products(stock_quantity) 
  WHERE stock_quantity > 0;

-- Low stock alerts
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
  ON products(stock_quantity, low_stock_threshold) 
  WHERE stock_quantity <= low_stock_threshold;

-- Full-text search index for product search
CREATE INDEX IF NOT EXISTS idx_products_name_fts 
  ON products USING GIN (to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_products_description_fts 
  ON products USING GIN (to_tsvector('english', description));

-- ============================================================================
-- Categories Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- Orders Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Composite for user orders
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
  ON orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_user_created 
  ON orders(user_id, created_at DESC);

-- Payment tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
  ON orders(payment_status);

-- ============================================================================
-- Order Items Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Revenue analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_created 
  ON order_items(product_id, created_at);

-- ============================================================================
-- Cart Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart(product_id);

-- Composite for cart lookup
CREATE INDEX IF NOT EXISTS idx_cart_user_product 
  ON cart(user_id, product_id);

-- Active carts
CREATE INDEX IF NOT EXISTS idx_cart_updated 
  ON cart(updated_at DESC);

-- ============================================================================
-- Wishlist Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_product 
  ON wishlist(user_id, product_id);

-- ============================================================================
-- Reviews Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Approved reviews for display
CREATE INDEX IF NOT EXISTS idx_reviews_approved_product 
  ON reviews(product_id, approved) 
  WHERE approved = true;

-- Recent reviews
CREATE INDEX IF NOT EXISTS idx_reviews_created 
  ON reviews(created_at DESC);

-- ============================================================================
-- Inventory Logs Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory_log(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_inventory_created ON inventory_log(created_at DESC);

-- Audit trail
CREATE INDEX IF NOT EXISTS idx_inventory_user 
  ON inventory_log(adjusted_by);

-- ============================================================================
-- Product Variants Table Indexes (if exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- ============================================================================
-- Coupons Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates 
  ON coupons(valid_from, valid_until);

-- Active coupons only
CREATE INDEX IF NOT EXISTS idx_coupons_active_valid 
  ON coupons(is_active, valid_from, valid_until) 
  WHERE is_active = true;

-- ============================================================================
-- Coupon Usage Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);

-- ============================================================================
-- Notifications Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user 
  ON notifications(user_id, is_read) 
  WHERE is_read = false;

-- ============================================================================
-- Audit Logs Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Admin audit trail
CREATE INDEX IF NOT EXISTS idx_audit_admin_actions 
  ON audit_log(user_id, action, created_at DESC);

-- ============================================================================
-- Stock Notifications Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stock_notif_product ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notif_user ON stock_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_notif_notified ON stock_notifications(notified);

-- Pending stock notifications
CREATE INDEX IF NOT EXISTS idx_stock_notif_pending 
  ON stock_notifications(product_id, notified) 
  WHERE notified = false;

-- ============================================================================
-- Login Attempts Table Indexes (Security)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at DESC);

-- Brute force detection
CREATE INDEX IF NOT EXISTS idx_login_attempts_recent 
  ON login_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_recent 
  ON login_attempts(ip_address, created_at DESC);

-- ============================================================================
-- Price History Table Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created ON price_history(created_at DESC);

-- Latest prices
CREATE INDEX IF NOT EXISTS idx_price_history_product_latest 
  ON price_history(product_id, created_at DESC);

-- ============================================================================
-- Analytics Indexes
-- ============================================================================

-- Revenue by date
CREATE INDEX IF NOT EXISTS idx_orders_analytics_date 
  ON orders(DATE(created_at), status);

-- Product popularity
CREATE INDEX IF NOT EXISTS idx_order_items_analytics 
  ON order_items(product_id, created_at);

-- ============================================================================
-- Additional Constraints
-- ============================================================================

-- Prevent duplicate cart items
ALTER TABLE cart 
  ADD CONSTRAINT IF NOT EXISTS unique_cart_user_product 
  UNIQUE (user_id, product_id);

-- Prevent duplicate wishlist items
ALTER TABLE wishlist 
  ADD CONSTRAINT IF NOT EXISTS unique_wishlist_user_product 
  UNIQUE (user_id, product_id);

-- Prevent duplicate coupons
ALTER TABLE coupons 
  ADD CONSTRAINT IF NOT EXISTS unique_coupon_code 
  UNIQUE (code);

-- Ensure positive quantities
ALTER TABLE products 
  ADD CONSTRAINT IF NOT EXISTS check_stock_positive 
  CHECK (stock_quantity >= 0);

-- Ensure positive prices
ALTER TABLE products 
  ADD CONSTRAINT IF NOT EXISTS check_price_positive 
  CHECK (price >= 0);

ALTER TABLE products 
  ADD CONSTRAINT IF NOT EXISTS check_sale_price_positive 
  CHECK (sale_price IS NULL OR sale_price >= 0);

-- Ensure sale price is less than regular price
ALTER TABLE products 
  ADD CONSTRAINT IF NOT EXISTS check_sale_price_less_than_price 
  CHECK (sale_price IS NULL OR sale_price < price);

-- ============================================================================
-- Performance Notes
-- ============================================================================

/*
Index Usage Guidelines:
1. B-Tree indexes (default): Good for equality and range queries
2. GIN indexes: Good for full-text search and JSONB
3. Partial indexes: Good for frequently filtered subsets
4. Composite indexes: Good for multi-column queries

Maintenance:
- REINDEX periodically in production
- VACUUM ANALYZE after bulk operations
- Monitor index usage with pg_stat_user_indexes
- Remove unused indexes

Common Queries Optimized:
✅ Product listings by category
✅ Product search
✅ User orders
✅ Cart lookups
✅ Low stock alerts
✅ Admin analytics
✅ Audit trails
✅ Security monitoring
*/

-- ============================================================================
-- Index Statistics Query
-- ============================================================================

/*
To check index usage:

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/
