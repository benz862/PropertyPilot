-- ENG-008: AI prompt library and execution audit trail.

DO $$ BEGIN
  CREATE TYPE ai_prompt_status_enum AS ENUM ('draft', 'review', 'approved', 'production', 'deprecated', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_prompt_category_enum AS ENUM (
    'realtime_voice',
    'conversation',
    'knowledge_retrieval',
    'property_builder',
    'photo_analysis',
    'document_extraction',
    'voice_note_extraction',
    'timeline_extraction',
    'marketing_copy',
    'brochure_writing',
    'social_media',
    'buyer_intelligence',
    'lead_summary',
    'analytics',
    'recommendations',
    'seller_report',
    'crm_summary',
    'translation',
    'moderation',
    'fallback',
    'system_health'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  version_label TEXT NOT NULL,
  status ai_prompt_status_enum NOT NULL DEFAULT 'draft',
  category ai_prompt_category_enum NOT NULL,
  purpose TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.30,
  max_tokens INTEGER NOT NULL DEFAULT 300,
  owner TEXT NOT NULL DEFAULT 'PropertyPilot Engineering',
  system_prompt TEXT NOT NULL,
  user_template TEXT,
  output_schema JSONB NOT NULL DEFAULT '{}',
  allowed_variables TEXT[] NOT NULL DEFAULT ARRAY[
    'property',
    'knowledge',
    'conversation',
    'visitor',
    'language',
    'organization',
    'date',
    'voice',
    'poi'
  ],
  policy_version TEXT NOT NULL DEFAULT '1.0.0',
  evaluation JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deprecated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (prompt_key, version_label)
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_prompt_key ON ai_prompt_templates (prompt_key);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_status ON ai_prompt_templates (status);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category ON ai_prompt_templates (category);

CREATE TABLE IF NOT EXISTS ai_prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_template_id UUID REFERENCES ai_prompt_templates(id) ON DELETE SET NULL,
  prompt_key TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  knowledge_version TEXT,
  policy_version TEXT,
  model TEXT NOT NULL,
  request_id UUID NOT NULL DEFAULT gen_random_uuid(),
  correlation_id UUID,
  conversation_id UUID,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  latency_ms INTEGER,
  token_usage INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  safety_violations JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_executions_prompt_key ON ai_prompt_executions (prompt_key);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_executions_property_id ON ai_prompt_executions (property_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_executions_request_id ON ai_prompt_executions (request_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_executions_created_at ON ai_prompt_executions (created_at);

ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_executions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS ai_prompt_templates_updated_at_version ON ai_prompt_templates;
CREATE TRIGGER ai_prompt_templates_updated_at_version
  BEFORE UPDATE ON ai_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();

DROP TRIGGER IF EXISTS ai_prompt_executions_updated_at_version ON ai_prompt_executions;
CREATE TRIGGER ai_prompt_executions_updated_at_version
  BEFORE UPDATE ON ai_prompt_executions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_and_version();

INSERT INTO ai_prompt_templates (
  prompt_key,
  version_label,
  status,
  category,
  purpose,
  model,
  temperature,
  max_tokens,
  system_prompt,
  user_template,
  output_schema,
  evaluation
)
VALUES (
  'property_concierge.response',
  '1.0.0',
  'production',
  'conversation',
  'Answer buyer questions from verified Digital Property Twin knowledge.',
  'gpt-4o-mini',
  0.30,
  300,
  'You are the PropertyPilot AI, a knowledgeable property expert for this listing. Answer only from verified knowledge. If information is unavailable, state that clearly and suggest contacting the listing agent.',
  'Buyer question: {{conversation}}',
  '{"type":"object","required":["answer","confidence"],"properties":{"answer":{"type":"string"},"confidence":{"enum":["high","medium","low"]}}}'::jsonb,
  '{"goldenConversations":[],"injectionTests":[],"latencyBenchmarkMs":1500,"costBenchmarkCents":2}'::jsonb
)
ON CONFLICT (prompt_key, version_label) DO NOTHING;
