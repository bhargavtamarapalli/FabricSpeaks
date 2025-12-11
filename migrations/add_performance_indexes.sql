-- Database Performance Indexes for Fabric Speaks
-- Run this migration to improve query performance
-- Created: 2025-12-05

-- =====================================================
-- PRODUCTS TABLE INDEXES
-- =====================================================

-- Index for category filtering (heavily used in product listing)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Index for status filtering (active products only)
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Index for sorting by created_at (newest products)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Index for sale products
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale) WHERE is_on_sale = true;

-- Index for signature products
CREATE INDEX IF NOT EXISTS idx_products_is_signature ON products(is_signature) WHERE is_signature = true;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id);

-- =====================================================
-- ORDERS TABLE INDEXES
-- =====================================================

-- Index for user's orders (used in order history)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Index for order status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index for admin order listing
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- =====================================================
-- ORDER_ITEMS TABLE INDEXES
-- =====================================================

-- Index for fetching items by order (JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index for product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- CART_ITEMS TABLE INDEXES
-- =====================================================

-- Index for cart items lookup
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- =====================================================
-- PROFILES TABLE INDEXES
-- =====================================================

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index for sorting by registration date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- =====================================================
-- CATEGORIES TABLE INDEXES
-- =====================================================

-- Index for parent category lookup (hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Index for category name lookup
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- =====================================================
-- ADDRESSES TABLE INDEXES
-- =====================================================

-- Index for user's addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
