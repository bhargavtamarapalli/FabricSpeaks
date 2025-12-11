-- Migration: Add order tracking fields
-- Date: 2025-11-23
-- Description: Add courier, shipped_at, and estimated_delivery columns to orders table

-- Add tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier) WHERE courier IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orders.courier IS 'Shipping courier/carrier name (e.g., FedEx, DHL, Blue Dart, DTDC)';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was shipped';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date/time';
