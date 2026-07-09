-- ENG-013: Database specification alignment.
--
-- This migration is intentionally additive. The existing product schema already
-- backs implemented application workflows, so this brings the missing ENG-013
-- identity, RBAC, operations, AI, commerce, and entitlement tables online
-- without destructive table rewrites.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE profile_status_enum AS ENUM ('active', 'inactive', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_type_enum AS ENUM ('brokerage', 'agent', 'property_manager', 'enterprise', 'commercial', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_status_enum AS ENUM ('active', 'trial', 'suspended', 'archived', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_role_enum AS ENUM ('owner', 'administrator', 'office_manager', 'team_leader', 'listing_agent', 'assistant', 'marketing', 'read_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_status_enum AS ENUM ('active', 'invited', 'pending', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE role_status_enum AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE permission_status_enum AS ENUM ('active', 'deprecated', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE api_key_status_enum AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_type_enum AS ENUM ('property', 'area', 'room', 'system', 'feature', 'document', 'photo', 'video', 'voice_note', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type_enum AS ENUM ('mls', 'agent', 'homeowner', 'builder', 'inspection_report', 'photo', 'voice_note', 'pdf_document', 'warranty_document', 'floor_plan', 'manual_entry', 'integration');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE buyer_question_status_enum AS ENUM ('new', 'answered', 'needs_review', 'converted_to_fact', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_status_enum AS ENUM ('open', 'accepted', 'dismissed', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_request_status_enum AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status_enum AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_status_enum AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status_enum AS ENUM ('unread', 'read', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at_and_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS status profile_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE profiles
SET
  first_name = COALESCE(first_name, split_part(name, ' ', 1), split_part(email, '@', 1)),
  last_name = COALESCE(last_name, NULLIF(trim(substr(name, length(split_part(name, ' ', 1)) + 1)), '')),
  display_name = COALESCE(display_name, name, email)
WHERE first_name IS NULL OR display_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON profiles (last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) <= 200),
  slug TEXT NOT NULL UNIQUE CHECK (slug = lower(slug)),
  legal_name TEXT CHECK (legal_name IS NULL OR length(legal_name) <= 250),
  organization_type organization_type_enum NOT NULL DEFAULT 'brokerage',
  website TEXT,
  support_email TEXT,
  support_phone TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  default_language TEXT NOT NULL DEFAULT 'en-US',
  default_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  default_voice TEXT,
  branding_theme TEXT NOT NULL DEFAULT 'propertypilot-default',
  status organization_status_enum NOT NULL DEFAULT 'active',
  subscription_plan TEXT,
  max_users INTEGER NOT NULL DEFAULT 1 CHECK (max_users >= 1),
  max_properties INTEGER NOT NULL DEFAULT 25 CHECK (max_properties >= 0),
  max_storage_gb INTEGER NOT NULL DEFAULT 5 CHECK (max_storage_gb >= 1),
  property_credits INTEGER NOT NULL DEFAULT 0 CHECK (property_credits >= 0),
  ai_credits INTEGER NOT NULL DEFAULT 0 CHECK (ai_credits >= 0),
  billing_customer_id TEXT,
  crm_provider TEXT,
  crm_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations (name);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations (status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations (organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_billing_customer_id ON organizations (billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations (created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_crm_provider ON organizations (crm_provider);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  office_id UUID,
  team_id UUID,
  role organization_role_enum NOT NULL DEFAULT 'owner',
  status membership_status_enum NOT NULL DEFAULT 'active',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, profile_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_one_owner
  ON organization_members (organization_id)
  WHERE is_owner = true AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_one_primary
  ON organization_members (profile_id)
  WHERE is_primary = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_profile_id ON organization_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_office_id ON organization_members (office_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_team_id ON organization_members (team_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members (role);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members (status);
CREATE INDEX IF NOT EXISTS idx_organization_members_last_active_at ON organization_members (last_active_at);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) <= 100),
  slug TEXT NOT NULL,
  description TEXT,
  system_role BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 100,
  status role_status_enum NOT NULL DEFAULT 'active',
  is_assignable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles (organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles (slug);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles (status);
CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles (priority);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  permission_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  system_permission BOOLEAN NOT NULL DEFAULT true,
  status permission_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (permission_key = resource || '.' || action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions (resource);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions (category);
CREATE INDEX IF NOT EXISTS idx_permissions_status ON permissions (status);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_permission ON role_permissions (role_id, permission_id);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  status api_key_status_enum NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys (organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_profile_id ON api_keys (profile_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys (status);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_properties_organization_id ON properties (organization_id);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_type asset_type_enum NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_property_id ON assets (property_id);
CREATE INDEX IF NOT EXISTS idx_assets_parent_asset_id ON assets (parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets (asset_type);

ALTER TABLE knowledge_objects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_knowledge_objects_organization_id ON knowledge_objects (organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_objects_asset_id ON knowledge_objects (asset_id);

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  source_type source_type_enum NOT NULL DEFAULT 'manual_entry',
  title TEXT NOT NULL,
  uri TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_organization_id ON knowledge_sources (organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_property_id ON knowledge_sources (property_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_asset_id ON knowledge_sources (asset_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_source_type ON knowledge_sources (source_type);

ALTER TABLE knowledge_facts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id),
  ADD COLUMN IF NOT EXISTS knowledge_source_id UUID REFERENCES knowledge_sources(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_knowledge_facts_organization_id ON knowledge_facts (organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_asset_id ON knowledge_facts (asset_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_source_id ON knowledge_facts (knowledge_source_id);

CREATE TABLE IF NOT EXISTS knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  knowledge_object_id UUID REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  knowledge_fact_id UUID REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_versions_organization_id ON knowledge_versions (organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_property_id ON knowledge_versions (property_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_object_id ON knowledge_versions (knowledge_object_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_fact_id ON knowledge_versions (knowledge_fact_id);

CREATE TABLE IF NOT EXISTS buyer_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  visitor_session_id UUID REFERENCES visitor_sessions(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  normalized_question TEXT,
  answer TEXT,
  status buyer_question_status_enum NOT NULL DEFAULT 'new',
  intent conversation_intent DEFAULT 'unknown',
  knowledge_object_ids UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_buyer_questions_organization_id ON buyer_questions (organization_id);
CREATE INDEX IF NOT EXISTS idx_buyer_questions_property_id ON buyer_questions (property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_questions_visitor_session_id ON buyer_questions (visitor_session_id);
CREATE INDEX IF NOT EXISTS idx_buyer_questions_status ON buyer_questions (status);

ALTER TABLE visitor_sessions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_organization_id ON visitor_sessions (organization_id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads (organization_id);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  action TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status recommendation_status_enum NOT NULL DEFAULT 'open',
  evidence JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_recommendations_organization_id ON recommendations (organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_property_id ON recommendations (property_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations (status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations (priority);

CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  visitor_session_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (visitor_session_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_organization_id ON conversation_memory (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_property_id ON conversation_memory (property_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_session_id ON conversation_memory (visitor_session_id);

CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT,
  request_type TEXT NOT NULL,
  prompt_version TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  status ai_request_status_enum NOT NULL DEFAULT 'queued',
  token_usage INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_organization_id ON ai_requests (organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_property_id ON ai_requests (property_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON ai_requests (status);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests (created_at);

CREATE TABLE IF NOT EXISTS prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  version_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_template TEXT,
  model TEXT,
  temperature NUMERIC(3, 2),
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (prompt_key, version_label)
);

CREATE INDEX IF NOT EXISTS idx_prompt_library_prompt_key ON prompt_library (prompt_key);
CREATE INDEX IF NOT EXISTS idx_prompt_library_active ON prompt_library (active);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  status job_status_enum NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs (organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_property_id ON jobs (property_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON jobs (scheduled_at);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  status workflow_status_enum NOT NULL DEFAULT 'draft',
  definition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_workflows_organization_id ON workflows (organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows (status);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  notification_type TEXT NOT NULL,
  status notification_status_enum NOT NULL DEFAULT 'unread',
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications (organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications (profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (status);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status subscription_status_enum NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions (stripe_customer_id);

ALTER TABLE features
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS feature_key TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_features_organization_id ON features (organization_id);
CREATE INDEX IF NOT EXISTS idx_features_feature_key ON features (feature_key);
CREATE INDEX IF NOT EXISTS idx_features_category ON features (category);

CREATE TABLE IF NOT EXISTS organization_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
  entitlement_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  limit_value INTEGER,
  used_value INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, entitlement_key)
);

CREATE INDEX IF NOT EXISTS idx_organization_entitlements_organization_id ON organization_entitlements (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_entitlements_feature_id ON organization_entitlements (feature_id);
CREATE INDEX IF NOT EXISTS idx_organization_entitlements_key ON organization_entitlements (entitlement_key);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
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
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'organizations',
    'organization_members',
    'roles',
    'api_keys',
    'assets',
    'knowledge_sources',
    'buyer_questions',
    'recommendations',
    'conversation_memory',
    'ai_requests',
    'jobs',
    'workflows',
    'notifications',
    'subscriptions',
    'organization_entitlements'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', table_name || '_updated_at_version', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version()',
      table_name || '_updated_at_version',
      table_name
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS prompt_library_updated_at_version ON prompt_library;
CREATE TRIGGER prompt_library_updated_at_version
  BEFORE UPDATE ON prompt_library
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();

DROP TRIGGER IF EXISTS permissions_updated_at_version ON permissions;
CREATE TRIGGER permissions_updated_at_version
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();
