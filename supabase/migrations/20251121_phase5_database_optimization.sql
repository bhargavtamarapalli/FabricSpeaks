-- Phase 5.4: Database Optimization - Composite Indexes and Performance Improvements
-- This migration adds indexes to improve query performance for large datasets

-- =====================================================
-- COMPOSITE INDEXES FOR OPTIMIZED QUERIES
-- =====================================================

-- Products table indexes
-- Index for category + status filtering (used in product listings)
CREATE INDEX IF NOT EXISTS idx_products_category_status 
ON products(category_id, status) 
WHERE status = 'active';

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE status = 'active';

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_products_created_status 
ON products(created_at DESC, status) 
WHERE status = 'active';

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '')));

-- Index for slug lookups (frequently used for product detail pages)
CREATE INDEX IF NOT EXISTS idx_products_slug 
ON products(slug) 
WHERE status = 'active';

-- =====================================================
-- ORDERS TABLE INDEXES
-- =====================================================

-- Index for user order history with status filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status, created_at DESC);

-- Index for order status queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Index for payment tracking
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id 
ON orders(razorpay_payment_id) 
WHERE razorpay_payment_id IS NOT NULL;

-- =====================================================
-- ORDER ITEMS TABLE INDEXES
-- =====================================================

-- Index for order items lookup
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Index for product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Index for variant sales tracking
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id 
ON order_items(variant_id) 
WHERE variant_id IS NOT NULL;

-- =====================================================
-- PRODUCT VARIANTS TABLE INDEXES
-- =====================================================

-- Index for variant lookup by product
CREATE INDEX IF NOT EXISTS idx_variants_product_id 
ON product_variants(product_id);

-- Index for SKU lookup
CREATE INDEX IF NOT EXISTS idx_variants_sku 
ON product_variants(sku) 
WHERE sku IS NOT NULL;

-- Index for stock queries
CREATE INDEX IF NOT EXISTS idx_variants_stock 
ON product_variants(product_id, stock_quantity);

-- =====================================================
-- WISHLIST TABLE INDEXES
-- =====================================================

-- Index for user wishlists
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id 
ON wishlists(user_id);

-- Index for default wishlist lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user_default 
ON wishlists(user_id, is_default) 
WHERE is_default = true;

-- Index for wishlist items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id 
ON wishlist_items(wishlist_id);

-- Index for wishlist creation date sorting
CREATE INDEX IF NOT EXISTS idx_wishlist_items_added_at 
ON wishlist_items(wishlist_id, added_at DESC);

-- =====================================================
-- REVIEWS TABLE INDEXES (conditional on table existence)
-- =====================================================

-- Only create review indexes if product_reviews table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
    -- Index for product reviews sorted by date
    CREATE INDEX IF NOT EXISTS idx_reviews_product_created 
    ON product_reviews(product_id, created_at DESC);
    
    -- Index for user reviews
    CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
    ON product_reviews(user_id, created_at DESC);
    
    -- Index for rating queries
    CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
    ON product_reviews(product_id, rating);
  END IF;
END $$;

-- =====================================================
-- CATEGORIES TABLE INDEXES
-- =====================================================

-- Index for parent category lookup
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON categories(parent_id) 
WHERE parent_id IS NOT NULL;

-- =====================================================
-- ADDRESSES TABLE INDEXES
-- =====================================================

-- Index for user addresses with default flag
CREATE INDEX IF NOT EXISTS idx_addresses_user_default 
ON addresses(user_id, is_default);

-- =====================================================
-- PERFORMANCE STATISTICS
-- =====================================================

-- Analyze tables to update statistics for query planner
DO $$
BEGIN
  ANALYZE products;
  ANALYZE orders;
  ANALYZE order_items;
  ANALYZE product_variants;
  ANALYZE wishlists;
  ANALYZE wishlist_items;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
    ANALYZE product_reviews;
  END IF;
  
  ANALYZE categories;
  ANALYZE addresses;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON INDEX idx_products_category_status IS 'Optimizes product listing by category and status';
COMMENT ON INDEX idx_products_search IS 'Full-text search index for products';
COMMENT ON INDEX idx_orders_user_status IS 'Optimizes user order history queries';
