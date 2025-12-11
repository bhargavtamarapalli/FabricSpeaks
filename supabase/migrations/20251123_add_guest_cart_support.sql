-- Migration: Add guest cart support
-- Date: 2025-11-23
-- Description: Add session_id column to carts table to support guest carts

-- Add session_id column to carts table (nullable for backward compatibility)
ALTER TABLE carts 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create index on session_id for faster guest cart lookups
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- Add comment to explain the column
COMMENT ON COLUMN carts.session_id IS 'Session ID for guest carts. NULL for authenticated user carts.';

-- Note: user_id can now be NULL for guest carts
ALTER TABLE carts 
ALTER COLUMN user_id DROP NOT NULL;
