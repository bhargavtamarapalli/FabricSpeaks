-- Migration: Add search optimization indexes
-- Date: 2025-11-23
-- Description: Add full-text search indexes and filter indexes for products

-- Create full-text search index on products
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING GIN (to_tsvector('english', description));

-- Create indexes for common filter columns
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(sale_price) WHERE sale_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale) WHERE on_sale = true;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_available ON products(stock_quantity) WHERE stock_quantity > 0;

-- Add comments
COMMENT ON INDEX idx_products_name_search IS 'Full-text search index on product names';
COMMENT ON INDEX idx_products_description_search IS 'Full-text search index on product descriptions';
