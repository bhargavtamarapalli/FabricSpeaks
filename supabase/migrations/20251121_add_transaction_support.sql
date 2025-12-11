-- Migration: Add transaction support and payment idempotency (SAFE VERSION)
-- Created: 2025-11-21
-- Description: Adds database functions for transactions, stock management, and payment idempotency
-- This version checks if columns/constraints exist before adding them

-- ============================================
-- 1. Add razorpay_payment_id column if not exists
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT;
  END IF;
END $$;

-- ============================================
-- 2. Payment Idempotency
-- ============================================

-- Add unique constraint on razorpay_payment_id to prevent duplicate payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_razorpay_payment_id'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT unique_razorpay_payment_id 
    UNIQUE (razorpay_payment_id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id 
ON orders(razorpay_payment_id) 
WHERE razorpay_payment_id IS NOT NULL;

-- ============================================
-- 3. Stock Management Functions
-- ============================================

-- Function to check and lock stock (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION check_and_lock_stock(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Lock the row and get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  -- Check if sufficient stock available
  IF v_current_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_current_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct stock (atomic operation)
CREATE OR REPLACE FUNCTION deduct_stock(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  -- Update stock and return new value
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id
    AND stock_quantity >= p_quantity
  RETURNING stock_quantity INTO v_new_stock;

  -- If no rows updated, stock was insufficient
  IF v_new_stock IS NULL THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- Function to restore stock (for cancellations/refunds)
CREATE OR REPLACE FUNCTION restore_stock(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  -- Update stock and return new value
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id
  RETURNING stock_quantity INTO v_new_stock;

  IF v_new_stock IS NULL THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Indexes for Performance
-- ============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product 
ON cart_items(cart_id, product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_stock 
ON product_variants(product_id, stock_quantity);

-- ============================================
-- 5. Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- ============================================
-- 6. Admin Roles
-- ============================================

-- Add role column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Add check constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_role'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_role 
    CHECK (role IN ('user', 'admin', 'super_admin', 'moderator'));
  END IF;
END $$;

-- ============================================
-- 7. Helper Functions
-- ============================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_changes JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_ip_address,
    p_user_agent,
    NOW()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION check_and_lock_stock IS 'Checks if sufficient stock is available and locks the row';
COMMENT ON FUNCTION deduct_stock IS 'Atomically deducts stock from a variant';
COMMENT ON FUNCTION restore_stock IS 'Restores stock to a variant (for cancellations)';
COMMENT ON FUNCTION log_audit_event IS 'Logs an audit event for admin actions';
COMMENT ON TABLE audit_logs IS 'Stores audit trail for all admin actions';
