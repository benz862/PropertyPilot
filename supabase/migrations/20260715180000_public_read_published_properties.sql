-- Align public RLS with PublishingService status='published'
-- (legacy 'active' remains supported)

CREATE OR REPLACE FUNCTION is_active_property(property_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties
    WHERE id = property_uuid
      AND status IN ('active', 'published')
      AND deleted_at IS NULL
  );
$$;

DROP POLICY IF EXISTS "Public can view active properties" ON properties;
CREATE POLICY "Public can view active properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status IN ('active', 'published') AND deleted_at IS NULL);
