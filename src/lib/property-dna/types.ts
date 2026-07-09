/**
 * Property DNA — the single normalized source of truth for a listing.
 *
 * Every engine (Q&A, asset generation, publishing, recommendations, GHL sync)
 * reads from or writes to this object. No feature should re-parse MLS,
 * documents, photos, or voice notes independently — they feed Property DNA and
 * everything else reads from it.
 */

export type SourceType =
  | "manual"
  | "mls"
  | "document"
  | "photo"
  | "voice_note"
  | "buyer_question"
  | "knowledge"
  | "system";

export interface SourceRef {
  sourceType: SourceType;
  sourceId?: string;
  label?: string;
}

export type Confidence = "high" | "medium" | "low";

export interface Fact {
  label: string;
  value: string;
  confidence: Confidence;
  sourceRefs: SourceRef[];
}

export interface PropertyDNABasic {
  address?: string;
  slug?: string;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  propertyType?: string | null;
  schoolDistrict?: string | null;
  mlsDescription?: string | null;
  summary?: string;
}

export interface PropertyDNARoom {
  id: string | null;
  name: string;
  description?: string | null;
  features: string[];
  upgrades: string[];
  includedItems: string[];
  cautions: string[];
  buyerTalkingPoints: string[];
  sourceRefs: SourceRef[];
}

export interface PropertyDNASystems {
  roof?: Fact;
  hvac?: Fact;
  electrical?: Fact;
  plumbing?: Fact;
  waterHeater?: Fact;
  sewer?: Fact;
  water?: Fact;
  internet?: Fact;
  naturalGas?: Fact;
}

export interface PropertyDNAExterior {
  features: Fact[];
  lotFeatures: Fact[];
  garage?: Fact;
  pool?: Fact;
  patioDeck?: Fact;
  landscaping?: Fact;
}

export interface PropertyDNANeighborhood {
  schools: Fact[];
  shopping: Fact[];
  restaurants: Fact[];
  parks: Fact[];
  commute: Fact[];
  notes: Fact[];
}

export interface PropertyDNADocument {
  id: string;
  filename: string;
  storagePath?: string | null;
  documentType?: string | null;
  extractedText?: string | null;
  summary?: string | null;
  sourceRefs: SourceRef[];
}

export interface PropertyDNAVoiceNote {
  id: string;
  transcript: string;
  extractedFacts: Fact[];
  sourceRefs: SourceRef[];
}

export interface PropertyDNAPhoto {
  id: string;
  filename: string;
  storagePath?: string | null;
  roomName?: string | null;
  caption?: string | null;
  isPrimary: boolean;
  visibleFeatures: string[];
  sourceRefs: SourceRef[];
}

export interface PropertyDNABuyerQuestion {
  id: string;
  selectedRoom?: string | null;
  question: string;
  normalizedQuestion?: string | null;
  answer?: string | null;
  confidence?: Confidence | null;
  needsAgentFollowup: boolean;
  createdAt: string;
}

export interface PropertyDNAHealth {
  knowledgeScore: number;
  marketingScore: number;
  buyerReadinessScore: number;
  missingInformation: string[];
  recommendations: string[];
}

export type GeneratedAssetType =
  | "feature_sheet"
  | "buyer_brochure"
  | "luxury_brochure"
  | "open_house_flyer"
  | "property_description"
  | "luxury_description"
  | "mls_description"
  | "qr_sign"
  | "voice_intro"
  | "voice_agent_knowledge_base"
  | "buyer_faq"
  | "showing_notes"
  | "neighborhood_guide"
  | "moving_guide"
  | "utility_guide";

export interface GeneratedAssetRecord {
  id: string;
  type: GeneratedAssetType;
  title: string;
  content?: string | null;
  fileUrl?: string | null;
  lastGeneratedAt?: string | null;
}

export interface PropertyDNAMeta {
  publishStatus: string;
  publishedAt: string | null;
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  heroImageUrl: string | null;
  intelligenceUpdatedAt: string | null;
  dnaVersion: number;
}

export interface PropertyDNA {
  propertyId: string;
  basic: PropertyDNABasic;
  rooms: PropertyDNARoom[];
  systems: PropertyDNASystems;
  exterior: PropertyDNAExterior;
  neighborhood: PropertyDNANeighborhood;
  documents: PropertyDNADocument[];
  voiceNotes: PropertyDNAVoiceNote[];
  photos: PropertyDNAPhoto[];
  buyerQuestions: PropertyDNABuyerQuestion[];
  health: PropertyDNAHealth;
  generatedAssets: GeneratedAssetRecord[];
  meta: PropertyDNAMeta;
}
