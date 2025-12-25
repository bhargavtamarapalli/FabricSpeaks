-- Migration: Add colour column to cart_items table
-- This allows storing the selected colour when adding items to cart

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS colour TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN cart_items.colour IS 'The selected colour for this cart item';
