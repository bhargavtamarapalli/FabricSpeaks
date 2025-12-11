-- Migration: Create Wishlists Tables
-- Description: Adds wishlist functionality with support for multiple wishlists per user
-- Author: Development Team
-- Date: 2025-11-20

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wishlists_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT wishlists_name_max_length CHECK (length(name) <= 100)
);

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  -- Constraints
  CONSTRAINT wishlist_items_unique_product_variant UNIQUE(wishlist_id, product_id, variant_id),
  CONSTRAINT wishlist_items_notes_max_length CHECK (notes IS NULL OR length(notes) <= 500)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_default ON wishlists(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_variant_id ON wishlist_items(variant_id) WHERE variant_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
CREATE POLICY "Users can view their own wishlists"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlists"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists"
  ON wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items
CREATE POLICY "Users can view items in their wishlists"
  ON wishlist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  ));

CREATE POLICY "Users can add items to their wishlists"
  ON wishlist_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove items from their wishlists"
  ON wishlist_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wishlists_updated_at_trigger
  BEFORE UPDATE ON wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlists_updated_at();

-- Create function to ensure only one default wishlist per user
CREATE OR REPLACE FUNCTION ensure_single_default_wishlist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other wishlists for this user to non-default
    UPDATE wishlists
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_wishlist_trigger
  AFTER INSERT OR UPDATE OF is_default ON wishlists
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_wishlist();

-- Add comments for documentation
COMMENT ON TABLE wishlists IS 'User wishlists for saving products';
COMMENT ON TABLE wishlist_items IS 'Items in user wishlists';
COMMENT ON COLUMN wishlists.is_default IS 'Indicates the default wishlist for quick adds';
COMMENT ON COLUMN wishlist_items.variant_id IS 'Optional: specific product variant (size/color)';
COMMENT ON COLUMN wishlist_items.notes IS 'User notes about the wishlist item';
