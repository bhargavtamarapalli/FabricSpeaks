-- Migration: Add admin invitations table
-- Created: 2025-11-21
-- Description: Adds table for managing admin invitations

-- ============================================
-- Admin Invitations Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('moderator', 'admin', 'super_admin')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email 
ON admin_invitations(email);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_token 
ON admin_invitations(token);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_invited_by 
ON admin_invitations(invited_by);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_used 
ON admin_invitations(used, expires_at) 
WHERE used = FALSE;

-- Comments
COMMENT ON TABLE admin_invitations IS 'Stores admin invitation tokens for secure admin onboarding';
COMMENT ON COLUMN admin_invitations.token IS 'Secure random token for invitation link';
COMMENT ON COLUMN admin_invitations.expires_at IS 'Invitation expiry date (typically 7 days)';
COMMENT ON COLUMN admin_invitations.used IS 'Whether invitation has been accepted';
