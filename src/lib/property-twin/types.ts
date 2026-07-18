export type VerificationLevel =
  | "verified"
  | "likely"
  | "unknown"
  | "conflicting"
  | "retired";

export type KnowledgeCategory =
  | "structural"
  | "mechanical"
  | "electrical"
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
  | "neighborhood"
  | "community"
  | "schools"
  | "utilities"
  | "legal_documents"
  | "hoa"
  | "insurance"
  | "miscellaneous"
  | "other";

export type PropertyListingStatus =
  | "draft"
  | "active"
  | "published"
  | "archived"
  | "pending"
  | "sold";

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

export type TimelineEventType =
  | "built"
  | "roof_replacement"
  | "kitchen_remodel"
  | "hvac_installation"
  | "deck_added"
  | "pool_installed"
  | "water_heater_replaced"
  | "painting"
  | "flooring_replacement"
  | "custom";

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

export type DocumentType =
  | "inspection_report"
  | "warranty"
  | "disclosure"
  | "floor_plan"
  | "manual"
  | "survey"
  | "hoa"
  | "receipt"
  | "other";

export type PhotoAnalysisStatus = "pending" | "completed" | "failed";

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export type CrmStatus = "new" | "synced" | "failed" | "pending";

export type AnalyticsEventType =
  | "qr_scan"
  | "poi_viewed"
  | "time_spent"
  | "question_asked"
  | "feature_requested"
  | "pdf_download"
  | "showing_request"
  | "conversation_length"
  | "exit_point";

export interface Profile {
  id: string;
  name: string | null;
  company: string | null;
  brokerage: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  subscription: SubscriptionTier;
  stripeCustomerId: string | null;
  ghlLocationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyProfile {
  id: string;
  ownerId: string;
  mlsNumber: string | null;
  status: PropertyListingStatus;
  street: string;
  city: string;
  provinceState: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  finishedSquareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  annualTaxes: number | null;
  hoa: Record<string, unknown>;
  schoolDistrict: string | null;
  publicRemarks: string | null;
  privateNotes: string | null;
  listingPrice: number | null;
  listingStatus: string | null;
  agentName: string | null;
  brokerage: string | null;
  utilities: Record<string, unknown>;
  taxInformation: Record<string, unknown>;
  propertyDescription: string | null;
  voicePersonalityId: string | null;
  aiPolicyId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeObject {
  id: string;
  propertyId: string;
  category: KnowledgeCategory;
  name: string;
  summary: string | null;
  videoUrl: string | null;
  confidenceLevel: VerificationLevel;
  verificationSource: KnowledgeSource | null;
  revisionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PointOfInterest {
  id: string;
  propertyId: string;
  displayOrder: number;
  title: string;
  subtitle: string | null;
  mapPosition: Record<string, unknown> | null;
  welcomePrompt: string | null;
  thumbnailPath: string | null;
  estimatedViewingMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoicePersonality {
  id: string;
  propertyId: string | null;
  voice: string;
  speakingSpeed: number;
  greeting: string | null;
  conversationStyle: string | null;
  tone: string | null;
  humorLevel: string;
  formality: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiPolicy {
  id: string;
  propertyId: string | null;
  neverGuess: boolean;
  neverDiscussPolitics: boolean;
  neverEstimateValues: boolean;
  neverSpeculate: boolean;
  neverAnswerLegal: boolean;
  discloseUncertainty: boolean;
  encourageAgentContact: boolean;
  customInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorSession {
  id: string;
  propertyId: string;
  sessionToken: string;
  device: string | null;
  browser: string | null;
  operatingSystem: string | null;
  language: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  propertyId: string;
  visitorSessionId: string | null;
  name: string;
  email: string;
  phone: string | null;
  consent: boolean;
  requestedShowing: boolean;
  requestedPdf: boolean;
  notes: string | null;
  crmStatus: CrmStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  visitorSessionId: string;
  transcript: Array<Record<string, unknown>>;
  intent: string | null;
  questions: Array<Record<string, unknown>>;
  answers: Array<Record<string, unknown>>;
  escalations: Array<Record<string, unknown>>;
  tokenUsage: number;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface QrCode {
  id: string;
  propertyId: string;
  storagePath: string;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeFact {
  id: string;
  propertyId: string;
  knowledgeObjectId: string;
  factKey: string;
  factValue: string;
  versionNumber: number;
  verificationLevel: VerificationLevel;
  source: KnowledgeSource;
  sourceReference: string | null;
  isCurrent: boolean;
  retiredAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRelationship {
  id: string;
  propertyId: string;
  sourceObjectId: string;
  targetObjectId: string;
  relationshipType: string;
  createdAt: string;
}

export interface KnowledgeGraphNode {
  object: KnowledgeObject;
  facts: KnowledgeFact[];
  relatedObjects: KnowledgeGraphNode[];
}

export interface PropertyTimelineEvent {
  id: string;
  propertyId: string;
  knowledgeObjectId: string | null;
  eventType: TimelineEventType;
  title: string;
  description: string | null;
  eventDate: string | null;
  verificationLevel: VerificationLevel;
  createdAt: string;
}

export interface AiSuggestion {
  id: string;
  propertyId: string;
  suggestionType: string;
  message: string;
  priority: number;
  status: SuggestionStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CompletenessBreakdown {
  corePropertyData: number;
  systems: number;
  appliances: number;
  photos: number;
  documents: number;
  pois: number;
  neighborhood: number;
  maintenance: number;
  verificationCoverage: number;
}

export interface PropertyCompletenessScore {
  overall: number;
  breakdown: CompletenessBreakdown;
  missingItems: string[];
}

export interface PublishingValidation {
  canPublish: boolean;
  errors: string[];
  warnings: string[];
}

export interface PhotoIntelligenceResult {
  caption: string | null;
  detectedFeatures: string[];
  detectedRoom: string | null;
  detectedObjects: string[];
  suggestedKnowledgeObjects: Array<{
    name: string;
    category: KnowledgeCategory;
    confidence: VerificationLevel;
  }>;
  qualityScore: number | null;
  isDuplicate: boolean;
}

export interface DocumentIntelligenceResult {
  extractedDates: string[];
  manufacturers: string[];
  modelNumbers: string[];
  serialNumbers: string[];
  measurements: Record<string, string>;
  maintenanceNotes: string[];
  recommendations: string[];
  requiresReview: boolean;
  rawExtracted: Record<string, unknown>;
}

export interface VoiceNoteIntelligenceResult {
  knowledgeObjects: Array<{
    name: string;
    category: KnowledgeCategory;
    summary: string;
    facts: Array<{
      key: string;
      value: string;
      verificationLevel: VerificationLevel;
    }>;
  }>;
  suggestedFaqs: Array<{ question: string; answer: string }>;
  suggestedBuyerQuestions: string[];
  missingInformation: string[];
  requiresVerification: string[];
}

export interface PropertyTwinSnapshot {
  profile: PropertyProfile;
  knowledgeObjects: KnowledgeObject[];
  facts: KnowledgeFact[];
  relationships: KnowledgeRelationship[];
  systems: Array<{
    id: string;
    name: string;
    manufacturer: string | null;
    ageYears: number | null;
  }>;
  appliances: Array<{
    id: string;
    name: string;
    manufacturer: string | null;
    model: string | null;
  }>;
  photos: Array<{
    id: string;
    caption: string | null;
    isPrimary: boolean;
    detectedRoom: string | null;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentType: DocumentType;
  }>;
  pois: Array<{
    id: string;
    title: string;
    displayOrder: number;
  }>;
  timeline: PropertyTimelineEvent[];
  completeness: PropertyCompletenessScore;
  suggestions: AiSuggestion[];
}

export interface CreatePropertyInput {
  ownerId: string;
  street: string;
  city: string;
  provinceState: string;
  postalCode: string;
  country?: string;
}

export interface UpdatePropertyProfileInput {
  mlsNumber?: string | null;
  street?: string;
  city?: string;
  provinceState?: string;
  postalCode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  finishedSquareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  annualTaxes?: number | null;
  hoa?: Record<string, unknown>;
  schoolDistrict?: string | null;
  publicRemarks?: string | null;
  privateNotes?: string | null;
  listingPrice?: number | null;
  listingStatus?: string | null;
  agentName?: string | null;
  brokerage?: string | null;
  utilities?: Record<string, unknown>;
  taxInformation?: Record<string, unknown>;
  propertyDescription?: string | null;
}

export interface CreateKnowledgeObjectInput {
  propertyId: string;
  category: KnowledgeCategory;
  name: string;
  summary?: string | null;
  confidenceLevel?: VerificationLevel;
  verificationSource?: KnowledgeSource | null;
}

export interface CreateKnowledgeFactInput {
  propertyId: string;
  knowledgeObjectId: string;
  factKey: string;
  factValue: string;
  verificationLevel?: VerificationLevel;
  source?: KnowledgeSource;
  sourceReference?: string | null;
  createdBy?: string | null;
}

export interface CreateRelationshipInput {
  propertyId: string;
  sourceObjectId: string;
  targetObjectId: string;
  relationshipType?: string;
}
