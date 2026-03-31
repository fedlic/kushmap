-- Premium Listing schema additions
-- Run in Supabase SQL Editor

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS premium_contact text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shops_is_premium ON shops(is_premium);
CREATE INDEX IF NOT EXISTS idx_shops_premium_expires ON shops(premium_expires_at);

-- Function to expire premium listings
CREATE OR REPLACE FUNCTION update_premium_status()
RETURNS void AS $$
  UPDATE shops
  SET is_premium = false
  WHERE is_premium = true
    AND premium_expires_at IS NOT NULL
    AND premium_expires_at < NOW();
$$ LANGUAGE sql;
