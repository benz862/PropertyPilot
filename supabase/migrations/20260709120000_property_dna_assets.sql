-- PropertyPilot: Property Studio generated assets (source of truth: Property DNA)

CREATE TABLE IF NOT EXISTS property_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'marketing',
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'generated',
  source_dna_version INTEGER,
  last_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_assets_property_id ON property_assets(property_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_assets_property_type
  ON property_assets(property_id, asset_type);

DROP TRIGGER IF EXISTS property_assets_updated_at ON property_assets;
CREATE TRIGGER property_assets_updated_at
  BEFORE UPDATE ON property_assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE property_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_assets_owner ON property_assets;
CREATE POLICY property_assets_owner
  ON property_assets FOR ALL
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));
