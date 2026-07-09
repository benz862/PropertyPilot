-- PRD-004: Digital Property Twin incremental schema (extends PRD-002 core_schema)

-- Property profile extensions
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_status TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS brokerage TEXT,
  ADD COLUMN IF NOT EXISTS utilities JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tax_information JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS property_description TEXT,
  ADD COLUMN IF NOT EXISTS voice_personality_id UUID REFERENCES voice_personalities(id),
  ADD COLUMN IF NOT EXISTS ai_policy_id UUID REFERENCES ai_policies(id),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Extend property status for publishing
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'published';

-- PRD-004 verification enums
DO $$ BEGIN
  CREATE TYPE verification_level AS ENUM (
    'verified', 'likely', 'unknown', 'conflicting', 'retired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_source AS ENUM (
    'mls', 'agent', 'homeowner', 'builder', 'inspection_report', 'photo',
    'voice_note', 'pdf_document', 'warranty_document', 'floor_plan',
    'manual_entry', 'integration'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE timeline_event_type AS ENUM (
    'built', 'roof_replacement', 'kitchen_remodel', 'hvac_installation',
    'deck_added', 'pool_installed', 'water_heater_replaced', 'painting',
    'flooring_replacement', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE twin_audit_action AS ENUM (
    'create', 'update', 'soft_delete', 'verify', 'retire', 'publish',
    'suggestion_accept', 'suggestion_dismiss'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE photo_analysis_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Versioned facts (never overwrite)
CREATE TABLE IF NOT EXISTS knowledge_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  verification_level verification_level NOT NULL DEFAULT 'unknown',
  source knowledge_source NOT NULL DEFAULT 'manual_entry',
  source_reference TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  retired_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (knowledge_object_id, fact_key, version_number)
);

CREATE INDEX IF NOT EXISTS knowledge_facts_current_idx
  ON knowledge_facts (knowledge_object_id, fact_key)
  WHERE is_current = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS knowledge_facts_property_id_idx
  ON knowledge_facts (property_id);

-- Knowledge graph edges
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  target_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'related_to',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (source_object_id <> target_object_id)
);

CREATE INDEX IF NOT EXISTS knowledge_relationships_property_id_idx
  ON knowledge_relationships (property_id);

-- Photo intelligence columns
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS detected_features JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS detected_room TEXT,
  ADD COLUMN IF NOT EXISTS detected_objects JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS suggested_knowledge_objects JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analysis_status photo_analysis_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Document intelligence columns
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extracted_data JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requires_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Systems/appliances soft delete + PRD-004 fields
ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS warranty JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS maintenance JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE systems SET name = system_type WHERE name IS NULL;

ALTER TABLE appliances
  ADD COLUMN IF NOT EXISTS warranty JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE appliances SET condition = condition_notes WHERE condition IS NULL;

-- Voice notes
CREATE TABLE IF NOT EXISTS voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT,
  transcript TEXT NOT NULL,
  structured_knowledge JSONB NOT NULL DEFAULT '{}',
  suggested_faqs JSONB NOT NULL DEFAULT '[]',
  suggested_buyer_questions JSONB NOT NULL DEFAULT '[]',
  missing_information JSONB NOT NULL DEFAULT '[]',
  requires_verification JSONB NOT NULL DEFAULT '[]',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property timeline
CREATE TABLE IF NOT EXISTS property_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  knowledge_object_id UUID REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  event_type timeline_event_type NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  verification_level verification_level NOT NULL DEFAULT 'unknown',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status suggestion_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS twin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action twin_audit_action NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Neighborhood intelligence
CREATE TABLE IF NOT EXISTS neighborhood_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge objects soft delete
ALTER TABLE knowledge_objects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- POI soft delete
ALTER TABLE points_of_interest
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Triggers
CREATE TRIGGER knowledge_facts_updated_at
  BEFORE UPDATE ON knowledge_facts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER knowledge_relationships_updated_at
  BEFORE UPDATE ON knowledge_relationships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER voice_notes_updated_at
  BEFORE UPDATE ON voice_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER property_timeline_events_updated_at
  BEFORE UPDATE ON property_timeline_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ai_suggestions_updated_at
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER neighborhood_intelligence_updated_at
  BEFORE UPDATE ON neighborhood_intelligence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE knowledge_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhood_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_facts_owner ON knowledge_facts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY knowledge_relationships_owner ON knowledge_relationships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY voice_notes_owner ON voice_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY property_timeline_events_owner ON property_timeline_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY ai_suggestions_owner ON ai_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY twin_audit_log_owner ON twin_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY neighborhood_intelligence_owner ON neighborhood_intelligence
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );
