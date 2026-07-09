-- ENG-014: Voice capture recording model.

DO $$ BEGIN
  CREATE TYPE voice_recording_status_enum AS ENUM (
    'draft',
    'recording',
    'paused',
    'uploading',
    'uploaded',
    'processing',
    'ready_for_review',
    'approved',
    'failed',
    'canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  voice_note_id UUID REFERENCES voice_notes(id) ON DELETE SET NULL,
  status voice_recording_status_enum NOT NULL DEFAULT 'draft',
  original_storage_bucket TEXT NOT NULL DEFAULT 'voice-notes',
  original_storage_path TEXT,
  mime_type TEXT NOT NULL DEFAULT 'audio/aac',
  sample_rate_hz INTEGER NOT NULL DEFAULT 48000,
  channel_count INTEGER NOT NULL DEFAULT 1,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  byte_size BIGINT NOT NULL DEFAULT 0,
  autosave_state JSONB NOT NULL DEFAULT '{}',
  quality_report JSONB NOT NULL DEFAULT '{}',
  upload_progress INTEGER NOT NULL DEFAULT 0 CHECK (upload_progress BETWEEN 0 AND 100),
  processing_progress INTEGER NOT NULL DEFAULT 0 CHECK (processing_progress BETWEEN 0 AND 100),
  transcript TEXT,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_organization_id ON voice_recordings (organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_property_id ON voice_recordings (property_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_asset_id ON voice_recordings (asset_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_status ON voice_recordings (status);

CREATE TABLE IF NOT EXISTS voice_recording_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'voice-notes',
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  byte_size BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (recording_id, segment_index)
);

CREATE INDEX IF NOT EXISTS idx_voice_recording_segments_recording_id ON voice_recording_segments (recording_id);

ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recording_segments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS voice_recordings_updated_at_version ON voice_recordings;
CREATE TRIGGER voice_recordings_updated_at_version
  BEFORE UPDATE ON voice_recordings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();

DROP TRIGGER IF EXISTS voice_recording_segments_updated_at_version ON voice_recording_segments;
CREATE TRIGGER voice_recording_segments_updated_at_version
  BEFORE UPDATE ON voice_recording_segments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();
