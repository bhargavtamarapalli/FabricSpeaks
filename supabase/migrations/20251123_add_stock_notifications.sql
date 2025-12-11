-- Migration: Add stock notifications support
-- Date: 2025-11-23
-- Description: Create stock_notifications table for "Notify Me" feature

-- Create stock_notifications table
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  notified_at TIMESTAMP,
  
  -- Ensure user can only have one notification per product/variant combination
  UNIQUE(user_id, product_id, variant_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_user_id ON stock_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_notified ON stock_notifications(notified) WHERE notified = FALSE;

-- Add comment
COMMENT ON TABLE stock_notifications IS 'Stores user requests to be notified when out-of-stock products are back in stock';
