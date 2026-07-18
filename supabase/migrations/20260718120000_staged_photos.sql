-- AI virtual staging jobs linked to source listing photos.

CREATE TABLE staged_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  source_photo_id UUID NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  provider TEXT NOT NULL DEFAULT 'fal',
  provider_request_id TEXT,
  result_storage_bucket TEXT NOT NULL DEFAULT 'property-photos',
  result_storage_path TEXT,
  result_photo_id UUID REFERENCES photos (id) ON DELETE SET NULL,
  error_message TEXT,
  created_by UUID REFERENCES profiles (id),
  updated_by UUID REFERENCES profiles (id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staged_photos_property_id ON staged_photos (property_id);
CREATE INDEX idx_staged_photos_source_photo_id ON staged_photos (source_photo_id);
CREATE INDEX idx_staged_photos_status ON staged_photos (status);

CREATE TRIGGER staged_photos_eng003_updated_at_version
  BEFORE UPDATE ON staged_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_and_version();

ALTER TABLE staged_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage staged photos"
  ON staged_photos FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));
