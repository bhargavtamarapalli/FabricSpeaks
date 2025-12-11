-- Migration: Add coupon system
-- Date: 2025-11-23
-- Description: Create coupons and coupon_usage tables for discount system

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  user_specific BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

-- Add coupon fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id) WHERE coupon_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE coupons IS 'Stores discount coupons/promo codes';
COMMENT ON TABLE coupon_usage IS 'Tracks coupon usage by users';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN coupons.discount_value IS 'Discount value (percentage or fixed amount in currency)';
COMMENT ON COLUMN coupons.min_order_value IS 'Minimum order value required to use coupon';
COMMENT ON COLUMN coupons.max_discount_amount IS 'Maximum discount amount for percentage coupons';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of times coupon can be used (NULL = unlimited)';
COMMENT ON COLUMN coupons.user_specific IS 'If true, coupon can only be used by specific user';
