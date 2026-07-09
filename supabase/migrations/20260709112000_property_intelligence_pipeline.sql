-- PropertyPilot: normalized property intelligence output

CREATE TABLE IF NOT EXISTS property_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  intelligence JSONB NOT NULL DEFAULT '{}',
  source_map JSONB NOT NULL DEFAULT '[]',
  missing_information TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_intelligence_property_id
  ON property_intelligence(property_id);

CREATE TRIGGER property_intelligence_updated_at
  BEFORE UPDATE ON property_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE property_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_intelligence_owner
  ON property_intelligence FOR ALL
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
WHERE id = 'documents';
