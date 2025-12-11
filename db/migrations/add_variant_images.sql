-- Migration: Add images field to product_variants table
-- Created: 2024-12-01
-- Description: Adds support for variant-specific images to enable color-based image switching

-- Add images column to product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN product_variants.images IS 'Array of image URLs specific to this variant (e.g., different colors)';
