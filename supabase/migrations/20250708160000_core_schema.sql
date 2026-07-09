-- PropertyPilot PRD-002: Core Digital Property Twin schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE property_status AS ENUM ('draft', 'active', 'archived', 'pending', 'sold');
CREATE TYPE property_type AS ENUM (
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'commercial',
  'land',
  'other'
);
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE document_type AS ENUM (
  'inspection_report',
  'property_disclosure',
  'floor_plan',
  'survey',
  'brochure',
  'hoa_document',
  'receipt',
  'warranty',
  'manual',
  'other'
);
CREATE TYPE analytics_event_type AS ENUM (
  'qr_scan',
  'poi_viewed',
  'time_spent',
  'question_asked',
  'feature_requested',
  'pdf_download',
  'showing_request',
  'conversation_length',
  'exit_point',
  'lead_captured'
);
CREATE TYPE conversation_intent AS ENUM (
  'property_question',
  'room_question',
  'mechanical_system',
  'neighborhood',
  'schools',
  'taxes',
  'offer',
  'showing',
  'brochure',
  'agent',
  'directions',
  'price',
  'feature_comparison',
  'maintenance',
  'utilities',
  'general_conversation',
  'escalation',
  'unknown'
);
CREATE TYPE crm_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE knowledge_category AS ENUM (
  'roof',
  'hvac',
  'kitchen',
  'bathroom',
  'pool',
  'electrical',
  'foundation',
  'garage',
  'flex_space',
  'windows',
  'driveway',
  'landscaping',
  'deck',
  'fireplace',
  'solar',
  'appliance',
  'well',
  'septic',
  'security',
  'neighborhood',
  'schools',
  'utilities',
  'other'
);

-- ---------------------------------------------------------------------------
-- Profiles (paying customers, linked to auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  brokerage TEXT,
  logo_url TEXT,
  photo_url TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  ghl_location_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Properties (Digital Property Twin root)
-- ---------------------------------------------------------------------------

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  mls_number TEXT,
  status property_status NOT NULL DEFAULT 'draft',
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  province_state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  property_type property_type NOT NULL DEFAULT 'single_family',
  bedrooms INTEGER,
  bathrooms NUMERIC(3, 1),
  finished_sq_ft INTEGER,
  lot_size_sq_ft INTEGER,
  year_built INTEGER,
  annual_taxes NUMERIC(12, 2),
  hoa_fee NUMERIC(12, 2),
  school_district TEXT,
  public_remarks TEXT,
  private_notes TEXT,
  listing_price NUMERIC(14, 2),
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT properties_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_properties_owner_id ON properties (owner_id);
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_slug ON properties (slug);

-- ---------------------------------------------------------------------------
-- Knowledge Objects (heart of the Digital Property Twin)
-- ---------------------------------------------------------------------------

CREATE TABLE knowledge_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  category knowledge_category NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  summary TEXT,
  verified_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  unknown_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  confidence_level confidence_level NOT NULL DEFAULT 'medium',
  verification_source TEXT,
  revision_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_objects_property_id ON knowledge_objects (property_id);
CREATE INDEX idx_knowledge_objects_category ON knowledge_objects (category);

-- ---------------------------------------------------------------------------
-- Features (reusable amenity catalog)
-- ---------------------------------------------------------------------------

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT features_name_unique UNIQUE (name)
);

CREATE TABLE knowledge_object_features (
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects (id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features (id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_object_id, feature_id)
);

-- ---------------------------------------------------------------------------
-- Systems
-- ---------------------------------------------------------------------------

CREATE TABLE systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  knowledge_object_id UUID REFERENCES knowledge_objects (id) ON DELETE SET NULL,
  system_type TEXT NOT NULL,
  manufacturer TEXT,
  age_years INTEGER,
  warranty_expires_at DATE,
  maintenance_notes TEXT,
  service_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_systems_property_id ON systems (property_id);

-- ---------------------------------------------------------------------------
-- Appliances
-- ---------------------------------------------------------------------------

CREATE TABLE appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  knowledge_object_id UUID REFERENCES knowledge_objects (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expires_at DATE,
  included_in_sale BOOLEAN NOT NULL DEFAULT true,
  condition_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appliances_property_id ON appliances (property_id);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  knowledge_object_id UUID REFERENCES knowledge_objects (id) ON DELETE SET NULL,
  document_type document_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  storage_path TEXT NOT NULL,
  searchable_content TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_property_id ON documents (property_id);

-- ---------------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------------

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  caption TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  ai_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  storage_bucket TEXT NOT NULL DEFAULT 'property-photos',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_property_id ON photos (property_id);

CREATE TABLE photo_knowledge_objects (
  photo_id UUID NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects (id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, knowledge_object_id)
);

-- ---------------------------------------------------------------------------
-- Points of Interest
-- ---------------------------------------------------------------------------

CREATE TABLE points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  subtitle TEXT,
  map_position JSONB,
  welcome_prompt TEXT,
  thumbnail_url TEXT,
  estimated_viewing_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pois_property_id ON points_of_interest (property_id);

CREATE TABLE poi_knowledge_objects (
  poi_id UUID NOT NULL REFERENCES points_of_interest (id) ON DELETE CASCADE,
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects (id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (poi_id, knowledge_object_id)
);

CREATE TABLE photo_pois (
  photo_id UUID NOT NULL REFERENCES photos (id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES points_of_interest (id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, poi_id)
);

-- ---------------------------------------------------------------------------
-- Voice Personality (one per property)
-- ---------------------------------------------------------------------------

CREATE TABLE voice_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL DEFAULT 'alloy',
  speaking_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  greeting TEXT,
  conversation_style TEXT,
  tone TEXT NOT NULL DEFAULT 'professional',
  humor_level INTEGER NOT NULL DEFAULT 0 CHECK (humor_level BETWEEN 0 AND 10),
  formality INTEGER NOT NULL DEFAULT 5 CHECK (formality BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT voice_personalities_property_unique UNIQUE (property_id)
);

-- ---------------------------------------------------------------------------
-- AI Policy (one per property)
-- ---------------------------------------------------------------------------

CREATE TABLE ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_policies_property_unique UNIQUE (property_id)
);

-- ---------------------------------------------------------------------------
-- Visitor Sessions
-- ---------------------------------------------------------------------------

CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  current_poi_id UUID REFERENCES points_of_interest (id) ON DELETE SET NULL,
  device_type TEXT,
  browser TEXT,
  operating_system TEXT,
  language TEXT DEFAULT 'en',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  conversation_summary TEXT,
  preferred_language TEXT DEFAULT 'en',
  CONSTRAINT visitor_sessions_token_unique UNIQUE (session_token)
);

CREATE INDEX idx_visitor_sessions_property_id ON visitor_sessions (property_id);
CREATE INDEX idx_visitor_sessions_token ON visitor_sessions (session_token);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  visitor_session_id UUID REFERENCES visitor_sessions (id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  requested_showing BOOLEAN NOT NULL DEFAULT false,
  requested_pdf BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  crm_status crm_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_property_id ON leads (property_id);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  visitor_session_id UUID NOT NULL REFERENCES visitor_sessions (id) ON DELETE CASCADE,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_intent conversation_intent,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalations JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_usage INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_property_id ON conversations (property_id);
CREATE INDEX idx_conversations_session_id ON conversations (visitor_session_id);

-- ---------------------------------------------------------------------------
-- Conversation Turns (PRD-003 analytics & reproducibility)
-- ---------------------------------------------------------------------------

CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  visitor_session_id UUID NOT NULL REFERENCES visitor_sessions (id) ON DELETE CASCADE,
  poi_id UUID REFERENCES points_of_interest (id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent conversation_intent NOT NULL DEFAULT 'unknown',
  confidence confidence_level NOT NULL DEFAULT 'medium',
  knowledge_object_ids UUID[] NOT NULL DEFAULT '{}',
  sentiment TEXT,
  buyer_interests TEXT[] NOT NULL DEFAULT '{}',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  prompt_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  token_usage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_turns_conversation_id ON conversation_turns (conversation_id);
CREATE INDEX idx_conversation_turns_property_id ON conversation_turns (property_id);

-- ---------------------------------------------------------------------------
-- Buyer Interests & Objections (PRD-003)
-- ---------------------------------------------------------------------------

CREATE TABLE buyer_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_session_id UUID NOT NULL REFERENCES visitor_sessions (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  interest_topic TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 1 CHECK (score > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT buyer_interests_session_topic_unique UNIQUE (visitor_session_id, interest_topic)
);

CREATE TABLE buyer_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_session_id UUID NOT NULL REFERENCES visitor_sessions (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  objection_topic TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE unanswered_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  visitor_session_id UUID REFERENCES visitor_sessions (id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  suggested_knowledge_addition TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_unanswered_questions_property_id ON unanswered_questions (property_id);

-- ---------------------------------------------------------------------------
-- Analytics Events
-- ---------------------------------------------------------------------------

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  visitor_session_id UUID REFERENCES visitor_sessions (id) ON DELETE SET NULL,
  poi_id UUID REFERENCES points_of_interest (id) ON DELETE SET NULL,
  event_type analytics_event_type NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_property_id ON analytics_events (property_id);
CREATE INDEX idx_analytics_events_type ON analytics_events (event_type);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER knowledge_objects_updated_at
  BEFORE UPDATE ON knowledge_objects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER systems_updated_at
  BEFORE UPDATE ON systems
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER appliances_updated_at
  BEFORE UPDATE ON appliances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER points_of_interest_updated_at
  BEFORE UPDATE ON points_of_interest
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER voice_personalities_updated_at
  BEFORE UPDATE ON voice_personalities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ai_policies_updated_at
  BEFORE UPDATE ON ai_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER buyer_interests_updated_at
  BEFORE UPDATE ON buyer_interests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
