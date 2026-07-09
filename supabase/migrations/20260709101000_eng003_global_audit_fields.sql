-- ENG-003: apply global audit/version columns to existing schema tables.
--
-- The original schema predates ENG-003 and some tables intentionally used
-- composite keys or lightweight event rows. This migration adds the required
-- audit columns additively and installs update/version triggers where possible.

CREATE OR REPLACE FUNCTION ensure_eng003_audit_columns(target_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_regclass(target_table) IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id)', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id)', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1', target_table);
END;
$$;

CREATE OR REPLACE FUNCTION install_eng003_update_trigger(target_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  relation_name TEXT;
  trigger_name TEXT;
BEGIN
  IF to_regclass(target_table) IS NULL THEN
    RETURN;
  END IF;

  relation_name := split_part(target_table, '.', 2);
  IF relation_name = '' THEN
    relation_name := target_table;
  END IF;

  trigger_name := relation_name || '_eng003_updated_at_version';

  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, target_table);
  EXECUTE format(
    'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version()',
    trigger_name,
    target_table
  );
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'properties',
    'knowledge_objects',
    'features',
    'knowledge_object_features',
    'systems',
    'appliances',
    'documents',
    'photos',
    'photo_knowledge_objects',
    'points_of_interest',
    'poi_knowledge_objects',
    'photo_pois',
    'voice_personalities',
    'ai_policies',
    'visitor_sessions',
    'leads',
    'conversations',
    'conversation_turns',
    'buyer_interests',
    'buyer_objections',
    'unanswered_questions',
    'analytics_events',
    'qr_codes',
    'generated_pdfs',
    'knowledge_facts',
    'knowledge_relationships',
    'voice_notes',
    'property_timeline_events',
    'ai_suggestions',
    'twin_audit_log',
    'neighborhood_intelligence',
    'organizations',
    'organization_members',
    'roles',
    'permissions',
    'role_permissions',
    'api_keys',
    'assets',
    'knowledge_sources',
    'knowledge_versions',
    'buyer_questions',
    'recommendations',
    'conversation_memory',
    'ai_requests',
    'prompt_library',
    'jobs',
    'workflows',
    'notifications',
    'subscriptions',
    'organization_entitlements'
  ]
  LOOP
    PERFORM ensure_eng003_audit_columns(table_name);
    PERFORM install_eng003_update_trigger(table_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS ensure_eng003_audit_columns(TEXT);
DROP FUNCTION IF EXISTS install_eng003_update_trigger(TEXT);
