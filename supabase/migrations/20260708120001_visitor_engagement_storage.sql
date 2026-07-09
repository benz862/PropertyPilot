-- PRD-002: Marketing assets not covered in core_schema

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id)
);

CREATE TABLE generated_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Property Brochure',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_codes_property_id ON qr_codes (property_id);
CREATE INDEX idx_generated_pdfs_property_id ON generated_pdfs (property_id);

CREATE TRIGGER qr_codes_updated_at BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER generated_pdfs_updated_at BEFORE UPDATE ON generated_pdfs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage qr codes"
  ON qr_codes FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Owners manage generated pdfs"
  ON generated_pdfs FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read qr codes for active properties"
  ON qr_codes FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Public read generated pdfs for active properties"
  ON generated_pdfs FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));
