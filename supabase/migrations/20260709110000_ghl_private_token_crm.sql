-- Phase 1 GoHighLevel CRM integration.
-- PropertyPilot remains the source of truth; GHL receives outbound copies only.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS buyer_intent_score INTEGER CHECK (buyer_intent_score IS NULL OR (buyer_intent_score >= 0 AND buyer_intent_score <= 100)),
  ADD COLUMN IF NOT EXISTS buyer_interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS buyer_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_conversation_summary TEXT,
  ADD COLUMN IF NOT EXISTS crm_provider TEXT,
  ADD COLUMN IF NOT EXISTS crm_external_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS crm_external_opportunity_id TEXT,
  ADD COLUMN IF NOT EXISTS crm_last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crm_last_sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_crm_provider ON leads (crm_provider);
CREATE INDEX IF NOT EXISTS idx_leads_crm_last_sync_at ON leads (crm_last_sync_at);

CREATE TABLE IF NOT EXISTS crm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'gohighlevel' CHECK (provider = 'gohighlevel'),
  auth_type TEXT NOT NULL DEFAULT 'private_token' CHECK (auth_type = 'private_token'),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  location_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'error')),
  last_sync_status TEXT CHECK (last_sync_status IS NULL OR last_sync_status IN ('pending', 'success', 'failed')),
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (provider, location_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_connections_profile_id ON crm_connections (profile_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_organization_id ON crm_connections (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_status ON crm_connections (status);

CREATE TABLE IF NOT EXISTS crm_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES crm_connections(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gohighlevel',
  event_type TEXT NOT NULL DEFAULT 'lead_sync',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  external_contact_id TEXT,
  external_opportunity_id TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_events_connection_id ON crm_sync_events (connection_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_events_lead_id ON crm_sync_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_events_status ON crm_sync_events (status);
CREATE INDEX IF NOT EXISTS idx_crm_sync_events_created_at ON crm_sync_events (created_at);

DROP TRIGGER IF EXISTS crm_connections_updated_at_version ON crm_connections;
CREATE TRIGGER crm_connections_updated_at_version
  BEFORE UPDATE ON crm_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();

ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_connections'
      AND policyname = 'CRM connections are owner readable'
  ) THEN
    CREATE POLICY "CRM connections are owner readable"
      ON crm_connections FOR SELECT
      USING (profile_id = auth.uid() OR created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_connections'
      AND policyname = 'CRM connections are owner writable'
  ) THEN
    CREATE POLICY "CRM connections are owner writable"
      ON crm_connections FOR ALL
      USING (profile_id = auth.uid() OR created_by = auth.uid())
      WITH CHECK (profile_id = auth.uid() OR created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_sync_events'
      AND policyname = 'CRM sync events are owner readable'
  ) THEN
    CREATE POLICY "CRM sync events are owner readable"
      ON crm_sync_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM leads
          JOIN properties ON properties.id = leads.property_id
          WHERE leads.id = crm_sync_events.lead_id
            AND properties.owner_id = auth.uid()
        )
      );
  END IF;
END $$;
