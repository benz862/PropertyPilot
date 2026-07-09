-- ENG-015: Knowledge review queue.

DO $$ BEGIN
  CREATE TYPE knowledge_review_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'edited',
    'merged',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_review_item_type_enum AS ENUM (
    'new_fact',
    'updated_fact',
    'conflict',
    'duplicate',
    'suggested_asset',
    'timeline_change',
    'maintenance_item',
    'marketing_suggestion',
    'buyer_faq',
    'warning'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  knowledge_object_id UUID REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  voice_recording_id UUID REFERENCES voice_recordings(id) ON DELETE SET NULL,
  source_id UUID REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  item_type knowledge_review_item_type_enum NOT NULL,
  status knowledge_review_status_enum NOT NULL DEFAULT 'pending',
  fact_key TEXT,
  proposed_value TEXT,
  existing_value TEXT,
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  explanation TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  transcript_excerpt TEXT,
  audio_timestamp_seconds INTEGER,
  suggested_action TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_knowledge_review_items_property_id ON knowledge_review_items (property_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_items_asset_id ON knowledge_review_items (asset_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_items_status ON knowledge_review_items (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_items_item_type ON knowledge_review_items (item_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_review_items_confidence ON knowledge_review_items (confidence);

ALTER TABLE knowledge_review_items ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS knowledge_review_items_updated_at_version ON knowledge_review_items;
CREATE TRIGGER knowledge_review_items_updated_at_version
  BEFORE UPDATE ON knowledge_review_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();
