-- Admin support: admins table, is_hidden column, RLS policies

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins can read admins" ON admins FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admins)
);

-- Helper function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- Add is_hidden to shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Update shops RLS: hide hidden shops from non-admins
DROP POLICY IF EXISTS "shops are public" ON shops;
CREATE POLICY "shops are public" ON shops FOR SELECT
  USING (is_hidden IS NOT TRUE OR is_admin());

-- Admin can update/delete any shop
CREATE POLICY "admins can update shops" ON shops FOR UPDATE USING (is_admin());
CREATE POLICY "admins can delete shops" ON shops FOR DELETE USING (is_admin());

-- Admin can read/delete all reviews
CREATE POLICY "admins can read all reviews" ON reviews FOR SELECT USING (is_admin());
CREATE POLICY "admins can delete reviews" ON reviews FOR DELETE USING (is_admin());
CREATE POLICY "admins can update reviews" ON reviews FOR UPDATE USING (is_admin());

-- Admin can read all bookmarks (for stats)
CREATE POLICY "admins can read all bookmarks" ON bookmarks FOR SELECT USING (is_admin());

-- Admin can read all shop_owners
CREATE POLICY "admins can read all shop_owners" ON shop_owners FOR SELECT USING (is_admin());
