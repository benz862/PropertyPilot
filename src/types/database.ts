/**
 * PropertyPilot database types — mirrors supabase/migrations schema.
 * Use with Supabase client generics: createClient<Database>()
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";
export type PropertyStatus = "draft" | "active" | "archived" | "pending" | "sold" | "published";
export type PropertyType =
  | "single_family"
  | "condo"
  | "townhouse"
  | "multi_family"
  | "commercial"
  | "land"
  | "other";
export type ConfidenceLevel = "high" | "medium" | "low";
export type DocumentType =
  | "inspection_report"
  | "property_disclosure"
  | "floor_plan"
  | "survey"
  | "brochure"
  | "hoa_document"
  | "receipt"
  | "warranty"
  | "manual"
  | "other";
export type AnalyticsEventType =
  | "qr_scan"
  | "poi_viewed"
  | "time_spent"
  | "question_asked"
  | "feature_requested"
  | "pdf_download"
  | "showing_request"
  | "conversation_length"
  | "exit_point"
  | "lead_captured";
export type ConversationIntent =
  | "property_question"
  | "room_question"
  | "mechanical_system"
  | "neighborhood"
  | "schools"
  | "taxes"
  | "offer"
  | "showing"
  | "brochure"
  | "agent"
  | "directions"
  | "price"
  | "feature_comparison"
  | "maintenance"
  | "utilities"
  | "general_conversation"
  | "escalation"
  | "unknown";
export type CrmStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type KnowledgeCategory =
  | "roof"
  | "hvac"
  | "kitchen"
  | "bathroom"
  | "pool"
  | "electrical"
  | "foundation"
  | "garage"
  | "flex_space"
  | "windows"
  | "driveway"
  | "landscaping"
  | "deck"
  | "fireplace"
  | "solar"
  | "appliance"
  | "well"
  | "septic"
  | "security"
  | "neighborhood"
  | "schools"
  | "utilities"
  | "other"
  | "structural"
  | "mechanical"
  | "plumbing"
  | "interior"
  | "exterior"
  | "landscape"
  | "appliances"
  | "safety"
  | "accessibility"
  | "luxury_features"
  | "energy_efficiency"
  | "technology"
  | "maintenance"
  | "renovations"
  | "community"
  | "legal_documents"
  | "hoa"
  | "insurance"
  | "miscellaneous";

export type VerificationLevel =
  | "verified"
  | "likely"
  | "unknown"
  | "conflicting"
  | "retired";

export type KnowledgeSource =
  | "mls"
  | "agent"
  | "homeowner"
  | "builder"
  | "inspection_report"
  | "photo"
  | "voice_note"
  | "pdf_document"
  | "warranty_document"
  | "floor_plan"
  | "manual_entry"
  | "integration";

export type SuggestionStatus = "pending" | "accepted" | "dismissed";

export type TwinAuditAction =
  | "create"
  | "update"
  | "soft_delete"
  | "verify"
  | "retire"
  | "publish"
  | "suggestion_accept"
  | "suggestion_dismiss";

export interface VerifiedFact {
  key: string;
  value: string;
  source?: string;
}

export interface Profile {
  id: string;
  name: string;
  company: string | null;
  brokerage: string | null;
  logo_url: string | null;
  photo_url: string | null;
  email: string;
  phone: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  ghl_location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  mls_number: string | null;
  status: PropertyStatus;
  street: string;
  city: string;
  province_state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  finished_sq_ft: number | null;
  lot_size_sq_ft: number | null;
  year_built: number | null;
  annual_taxes: number | null;
  hoa_fee: number | null;
  school_district: string | null;
  public_remarks: string | null;
  private_notes: string | null;
  listing_price: number | null;
  slug: string;
  listing_status?: string | null;
  agent_name?: string | null;
  brokerage?: string | null;
  utilities?: Record<string, unknown>;
  tax_information?: Record<string, unknown>;
  property_description?: string | null;
  voice_personality_id?: string | null;
  ai_policy_id?: string | null;
  published_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeObject {
  id: string;
  property_id: string;
  category: KnowledgeCategory;
  name: string;
  summary: string | null;
  verified_facts: VerifiedFact[];
  unknown_facts: string[];
  video_url: string | null;
  confidence_level: ConfidenceLevel;
  verification_source: string | null;
  revision_number: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeObjectFeature {
  knowledge_object_id: string;
  feature_id: string;
}

export interface PhotoKnowledgeObject {
  photo_id: string;
  knowledge_object_id: string;
}

export interface PoiKnowledgeObject {
  poi_id: string;
  knowledge_object_id: string;
  is_primary: boolean;
}

export interface PhotoPoi {
  photo_id: string;
  poi_id: string;
}

export interface KnowledgeObjectFeature {
  knowledge_object_id: string;
  feature_id: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface System {
  id: string;
  property_id: string;
  knowledge_object_id: string | null;
  system_type: string;
  manufacturer: string | null;
  age_years: number | null;
  warranty_expires_at: string | null;
  maintenance_notes: string | null;
  service_history: Record<string, unknown>[];
  documentation_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appliance {
  id: string;
  property_id: string;
  knowledge_object_id: string | null;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expires_at: string | null;
  included_in_sale: boolean;
  condition_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  property_id: string;
  knowledge_object_id: string | null;
  document_type: DocumentType;
  title: string;
  storage_bucket: string;
  storage_path: string;
  searchable_content: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  extracted_data?: Record<string, unknown>;
  requires_review?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFactRow {
  id: string;
  property_id: string;
  knowledge_object_id: string;
  fact_key: string;
  fact_value: string;
  version_number: number;
  verification_level: VerificationLevel;
  source: KnowledgeSource;
  source_reference: string | null;
  is_current: boolean;
  retired_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRelationshipRow {
  id: string;
  property_id: string;
  source_object_id: string;
  target_object_id: string;
  relationship_type: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyTimelineEventRow {
  id: string;
  property_id: string;
  knowledge_object_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string | null;
  verification_level: VerificationLevel;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestionRow {
  id: string;
  property_id: string;
  suggestion_type: string;
  message: string;
  priority: number;
  status: SuggestionStatus;
  metadata: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TwinAuditLogRow {
  id: string;
  property_id: string;
  entity_type: string;
  entity_id: string;
  action: TwinAuditAction;
  actor_id: string | null;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface VoiceNoteRow {
  id: string;
  property_id: string;
  storage_path: string | null;
  transcript: string;
  structured_knowledge: Record<string, unknown>;
  suggested_faqs: unknown[];
  suggested_buyer_questions: string[];
  missing_information: string[];
  requires_verification: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyIntelligenceRow {
  id: string;
  property_id: string;
  intelligence: Record<string, unknown>;
  source_map: unknown[];
  missing_information: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertyRoom {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  features: unknown[];
  updates: unknown[];
  included_items: unknown[];
  talking_points: unknown[];
  cautions: unknown[];
  created_at: string;
  updated_at: string;
}

export interface BuyerQuestionRow {
  id: string;
  organization_id: string | null;
  property_id: string;
  visitor_session_id: string | null;
  lead_id: string | null;
  room_id: string | null;
  selected_room: string | null;
  question: string;
  normalized_question: string | null;
  answer: string | null;
  confidence: string | null;
  answered_from_sources: unknown[];
  needs_agent_followup: boolean;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  input_type: string | null;
  user_agent: string | null;
  status: string;
  intent: ConversationIntent;
  knowledge_object_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  version: number;
}

export interface NeighborhoodIntelligenceRow {
  id: string;
  property_id: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  property_id: string;
  caption: string | null;
  tags: string[];
  ai_description: string | null;
  display_order: number;
  storage_bucket: string;
  storage_path: string;
  detected_room?: string | null;
  is_primary?: boolean;
  is_duplicate?: boolean;
  quality_score?: number | null;
  detected_features?: unknown[];
  detected_objects?: unknown[];
  suggested_knowledge_objects?: unknown[];
  analysis_status?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointOfInterest {
  id: string;
  property_id: string;
  display_order: number;
  title: string;
  subtitle: string | null;
  map_position: Record<string, unknown> | null;
  welcome_prompt: string | null;
  thumbnail_url: string | null;
  estimated_viewing_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface VoicePersonality {
  id: string;
  property_id: string;
  voice_id: string;
  speaking_speed: number;
  greeting: string | null;
  conversation_style: string | null;
  tone: string;
  humor_level: number;
  formality: number;
  created_at: string;
  updated_at: string;
}

export interface AiPolicy {
  id: string;
  property_id: string;
  rules: string[];
  created_at: string;
  updated_at: string;
}

export interface VisitorSession {
  id: string;
  property_id: string;
  session_token: string;
  current_poi_id: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  language: string | null;
  started_at: string;
  ended_at: string | null;
  conversation_summary: string | null;
  preferred_language: string | null;
}

export interface Lead {
  id: string;
  property_id: string;
  visitor_session_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  consent_given: boolean;
  requested_showing: boolean;
  requested_pdf: boolean;
  notes: string | null;
  crm_status: CrmStatus;
  buyer_intent_score?: number | null;
  buyer_interests?: Json;
  buyer_concerns?: Json;
  ai_conversation_summary?: string | null;
  crm_provider?: string | null;
  crm_external_contact_id?: string | null;
  crm_external_opportunity_id?: string | null;
  crm_last_sync_at?: string | null;
  crm_last_sync_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmConnectionRow {
  id: string;
  provider: "gohighlevel";
  auth_type: "private_token";
  profile_id: string | null;
  organization_id: string | null;
  location_id: string;
  status: "active" | "disabled" | "error";
  last_sync_status: "pending" | "success" | "failed" | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  version: number;
}

export interface CrmSyncEventRow {
  id: string;
  connection_id: string | null;
  lead_id: string | null;
  provider: "gohighlevel";
  event_type: string;
  status: "pending" | "success" | "failed";
  external_contact_id: string | null;
  external_opportunity_id: string | null;
  request_payload: Json;
  response_payload: Json;
  error: string | null;
  attempts: number;
  correlation_id: string;
  created_at: string;
  processed_at: string | null;
}

export interface Conversation {
  id: string;
  property_id: string;
  visitor_session_id: string;
  transcript: ConversationMessage[];
  primary_intent: ConversationIntent | null;
  questions: string[];
  answers: string[];
  escalations: EscalationRecord[];
  token_usage: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface EscalationRecord {
  reason: string;
  timestamp: string;
  resolved: boolean;
}

export interface ConversationTurn {
  id: string;
  conversation_id: string;
  property_id: string;
  visitor_session_id: string;
  poi_id: string | null;
  question: string;
  answer: string;
  intent: ConversationIntent;
  confidence: ConfidenceLevel;
  knowledge_object_ids: string[];
  sentiment: string | null;
  buyer_interests: string[];
  duration_ms: number;
  prompt_snapshot: Record<string, unknown>;
  model: string | null;
  token_usage: number;
  created_at: string;
}

export interface BuyerInterest {
  id: string;
  visitor_session_id: string;
  property_id: string;
  interest_topic: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface BuyerObjection {
  id: string;
  visitor_session_id: string;
  property_id: string;
  objection_topic: string;
  notes: string | null;
  created_at: string;
}

export interface UnansweredQuestion {
  id: string;
  property_id: string;
  visitor_session_id: string | null;
  question: string;
  suggested_knowledge_addition: string | null;
  resolved: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  property_id: string;
  visitor_session_id: string | null;
  poi_id: string | null;
  event_type: AnalyticsEventType;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface QrCode {
  id: string;
  property_id: string;
  storage_path: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedPdf {
  id: string;
  property_id: string;
  storage_path: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/** Full property twin context for AI reasoning */
export interface PropertyTwinContext {
  property: Property;
  knowledgeObjects: KnowledgeObject[];
  systems: System[];
  appliances: Appliance[];
  features: Feature[];
  documents: Document[];
  photos: Photo[];
  pointsOfInterest: PointOfInterest[];
  voicePersonality: VoicePersonality | null;
  aiPolicy: AiPolicy | null;
  currentPoi: PointOfInterest | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      properties: TableDef<Property>;
      knowledge_objects: TableDef<KnowledgeObject>;
      features: TableDef<Feature>;
      knowledge_object_features: TableDef<KnowledgeObjectFeature>;
      systems: TableDef<System>;
      appliances: TableDef<Appliance>;
      documents: TableDef<Document>;
      photos: TableDef<Photo>;
      points_of_interest: TableDef<PointOfInterest>;
      voice_personalities: TableDef<VoicePersonality>;
      ai_policies: TableDef<AiPolicy>;
      visitor_sessions: TableDef<VisitorSession>;
      leads: TableDef<Lead>;
      crm_connections: TableDef<CrmConnectionRow>;
      crm_sync_events: TableDef<CrmSyncEventRow>;
      conversations: TableDef<Conversation>;
      conversation_turns: TableDef<ConversationTurn>;
      buyer_interests: TableDef<BuyerInterest>;
      buyer_objections: TableDef<BuyerObjection>;
      unanswered_questions: TableDef<UnansweredQuestion>;
      analytics_events: TableDef<AnalyticsEvent>;
      qr_codes: TableDef<QrCode>;
      generated_pdfs: TableDef<GeneratedPdf>;
      knowledge_facts: TableDef<KnowledgeFactRow>;
      knowledge_relationships: TableDef<KnowledgeRelationshipRow>;
      property_timeline_events: TableDef<PropertyTimelineEventRow>;
      ai_suggestions: TableDef<AiSuggestionRow>;
      twin_audit_log: TableDef<TwinAuditLogRow>;
      voice_notes: TableDef<VoiceNoteRow>;
      neighborhood_intelligence: TableDef<NeighborhoodIntelligenceRow>;
      property_intelligence: TableDef<PropertyIntelligenceRow>;
      property_rooms: TableDef<PropertyRoom>;
      buyer_questions: TableDef<BuyerQuestionRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      property_status: PropertyStatus;
      property_type: PropertyType;
      confidence_level: ConfidenceLevel;
      document_type: DocumentType;
      analytics_event_type: AnalyticsEventType;
      conversation_intent: ConversationIntent;
      crm_status: CrmStatus;
      knowledge_category: KnowledgeCategory;
      verification_level: VerificationLevel;
      knowledge_source: KnowledgeSource;
      suggestion_status: SuggestionStatus;
      twin_audit_action: TwinAuditAction;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
