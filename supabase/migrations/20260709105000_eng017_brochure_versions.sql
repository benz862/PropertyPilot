-- ENG-017: dynamic brochure version archive.

DO $$ BEGIN
  CREATE TYPE brochure_format_enum AS ENUM (
    'pdf',
    'html',
    'mobile',
    'email',
    'mls_insert',
    'open_house_handout',
    'luxury_magazine',
    'one_page_flyer',
    'qr_companion_sheet'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS brochure_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  marketing_asset_id UUID,
  format brochure_format_enum NOT NULL DEFAULT 'pdf',
  title TEXT NOT NULL,
  template_key TEXT NOT NULL,
  template_version TEXT NOT NULL,
  prompt_key TEXT,
  prompt_version TEXT,
  knowledge_version INTEGER NOT NULL DEFAULT 1,
  generator_version TEXT NOT NULL,
  asset_selection JSONB NOT NULL DEFAULT '[]',
  photo_selection JSONB NOT NULL DEFAULT '[]',
  sections JSONB NOT NULL DEFAULT '[]',
  storage_bucket TEXT,
  storage_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_brochure_versions_property_id ON brochure_versions (property_id);
CREATE INDEX IF NOT EXISTS idx_brochure_versions_format ON brochure_versions (format);
CREATE INDEX IF NOT EXISTS idx_brochure_versions_generated_at ON brochure_versions (generated_at);

ALTER TABLE brochure_versions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS brochure_versions_updated_at_version ON brochure_versions;
CREATE TRIGGER brochure_versions_updated_at_version
  BEFORE UPDATE ON brochure_versions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();
