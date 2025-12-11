-- Migration: Add Admin Notifications Tables
-- Created: 2025-12-04
-- Description: Creates tables for admin notification system

-- ============================================================================
-- Table: notification_recipients
-- Purpose: Stores WhatsApp/SMS recipients for admin notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  notification_types JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for active recipients
CREATE INDEX idx_notification_recipients_active ON notification_recipients(is_active) WHERE is_active = true;

-- ============================================================================
-- Table: notification_preferences
-- Purpose: Stores user preferences for which notifications they want to receive
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  order_alerts BOOLEAN DEFAULT true,
  inventory_alerts BOOLEAN DEFAULT true,
  customer_alerts BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  marketing_alerts BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================================================
-- Table: admin_notifications
-- Purpose: Stores notification history for admin users
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR(50) NOT NULL,
  recipient_id UUID REFERENCES notification_recipients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_admin_notifications_user ON admin_notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_admin_notifications_recipient ON admin_notifications(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE notification_recipients IS 'Stores WhatsApp/SMS recipients for admin notifications';
COMMENT ON TABLE notification_preferences IS 'Stores user preferences for notification types and channels';
COMMENT ON TABLE admin_notifications IS 'Stores notification history for admin users';

COMMENT ON COLUMN admin_notifications.type IS 'Notification category: order, inventory, customer, system, marketing';
COMMENT ON COLUMN admin_notifications.priority IS 'Notification urgency: low, medium, high, urgent';
COMMENT ON COLUMN admin_notifications.channel IS 'Delivery channel: email, whatsapp, sms, in-app';
COMMENT ON COLUMN admin_notifications.status IS 'Notification state: pending, sent, failed, read';

-- ============================================================================
-- Seed Data (Optional)
-- ============================================================================

-- Create default notification preferences for existing admin users
INSERT INTO notification_preferences (user_id, order_alerts, inventory_alerts, customer_alerts, system_alerts)
SELECT 
  user_id,
  true,
  true,
  true,
  true
FROM profiles
WHERE role IN ('admin', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================
