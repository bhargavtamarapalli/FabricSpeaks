-- WhatsApp Notifications Schema Migration

-- 1. Admin Notifications Log
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order', 'inventory', 'business', 'security')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'important', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- WhatsApp delivery tracking
  whatsapp_message_id TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  failure_reason TEXT,
  
  -- Recipient info
  recipient_id UUID REFERENCES profiles(user_id),
  recipient_number TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Notification Recipients (Admin can add multiple recipients)
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  role TEXT, -- 'admin', 'partner', 'analyst', 'manager'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notification preferences for this recipient
  notification_types JSONB DEFAULT '{
    "order": true,
    "inventory": true,
    "business": true,
    "security": true
  }'::jsonb,
  
  priority_threshold TEXT DEFAULT 'info' CHECK (priority_threshold IN ('critical', 'important', 'info')),
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Batching preferences
  batch_enabled BOOLEAN DEFAULT TRUE,
  batch_interval_minutes INTEGER DEFAULT 15,
  
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Notification Preferences (Global settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES profiles(user_id) UNIQUE,
  
  -- Per-type settings
  order_enabled BOOLEAN DEFAULT TRUE,
  order_priority_threshold TEXT DEFAULT 'info',
  order_batch_interval INTEGER DEFAULT 15,
  
  inventory_enabled BOOLEAN DEFAULT TRUE,
  inventory_priority_threshold TEXT DEFAULT 'important',
  inventory_batch_interval INTEGER DEFAULT 30,
  
  business_enabled BOOLEAN DEFAULT TRUE,
  business_priority_threshold TEXT DEFAULT 'info',
  business_schedule TEXT DEFAULT 'daily_8am', -- 'realtime', 'hourly', 'daily_8am', 'weekly_monday'
  
  security_enabled BOOLEAN DEFAULT TRUE,
  security_priority_threshold TEXT DEFAULT 'critical',
  security_batch_interval INTEGER DEFAULT 0, -- 0 = never batch
  
  -- Global quiet hours
  global_quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  global_quiet_hours_start TIME,
  global_quiet_hours_end TIME,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Login Attempts (for security notifications)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  username TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  location_country TEXT,
  location_city TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Notification Batch Queue (for batching logic)
CREATE TABLE IF NOT EXISTS notification_batch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  scheduled_send_at TIMESTAMP NOT NULL,
  notifications JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON admin_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON admin_notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_status ON admin_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON admin_notifications(recipient_id);

CREATE INDEX IF NOT EXISTS idx_recipients_active ON notification_recipients(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recipients_number ON notification_recipients(whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(success) WHERE success = FALSE;

CREATE INDEX IF NOT EXISTS idx_batch_queue_scheduled ON notification_batch_queue(scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_batch_queue_status ON notification_batch_queue(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_recipients_updated_at
  BEFORE UPDATE ON notification_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
