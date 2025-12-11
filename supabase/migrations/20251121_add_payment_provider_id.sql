ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_id ON orders(payment_provider_id);
