import type {
  DocumentIntelligenceResult,
  PhotoIntelligenceResult,
  PropertyCompletenessScore,
  VoiceNoteIntelligenceResult,
} from "@/lib/property-twin/types";
import type { PropertyIntelligence } from "@/lib/property-intelligence";

export type ExtractionSource =
  | "mls"
  | "photo"
  | "document"
  | "voice_note"
  | "manual";

export type SuggestionPriority = "critical" | "important" | "optional";

export interface MlsExtractionResult {
  source: "mls";
  version: string;
  extractedAt: string;
  fields: {
    street?: string;
    city?: string;
    provinceState?: string;
    postalCode?: string;
    listingPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    finishedSquareFeet?: number;
    lotSize?: number;
    yearBuilt?: number;
    propertyType?: string;
    publicRemarks?: string;
    schoolDistrict?: string;
    annualTaxes?: number;
    hoaFee?: number;
    features?: string[];
    rooms?: string[];
    utilities?: Record<string, unknown>;
    taxInformation?: Record<string, unknown>;
  };
  rawText?: string;
}

export interface PhotoCoverageEntry {
  room: string;
  coveragePercent: number;
  photoCount: number;
}

export interface PhotoCoverageMap {
  entries: PhotoCoverageEntry[];
  missingRooms: string[];
  overallCoverage: number;
}

export type QualityRating =
  | "excellent"
  | "very_good"
  | "good"
  | "needs_improvement"
  | "incomplete";

export interface PropertyQualityScore {
  overall: number;
  rating: QualityRating;
  label: string;
  explanation: string;
  estimatedMinutesToComplete: number;
  health: {
    propertyHealth: number;
    knowledgeHealth: number;
    photoCoverage: number;
    verificationHealth: number;
    aiReadiness: number;
    buyerExperienceScore: number;
    voiceReadiness: number;
    publishingReadiness: number;
  };
}

export interface GeneratedAssets {
  propertySummary: string;
  marketingDescription: string;
  luxuryDescription: string;
  socialMediaSummary: string;
  featureSheet: string[];
  suggestedFaqs: Array<{ question: string; answer: string }>;
  roomIntroductions: Array<{ room: string; introduction: string }>;
  showingNotes: string[];
}

export interface BuildPropertyTwinResult {
  propertyId: string;
  completeness: PropertyCompletenessScore;
  quality: PropertyQualityScore;
  photoCoverage: PhotoCoverageMap;
  suggestionsRefreshed: number;
  assets: GeneratedAssets;
  extractions: {
    mls?: MlsExtractionResult;
    photos: PhotoIntelligenceResult[];
    documents: DocumentIntelligenceResult[];
    voiceNotes: VoiceNoteIntelligenceResult[];
    propertyIntelligence?: PropertyIntelligence;
  };
  builtAt: string;
}

export interface VoiceNotePrompt {
  id: string;
  question: string;
  context?: string;
}

export const VOICE_NOTE_ASSISTANT_PROMPTS: VoiceNotePrompt[] = [
  { id: "special", question: "What makes this room special?" },
  { id: "updates", question: "Have there been any updates?" },
  { id: "buyer-questions", question: "What questions do buyers usually ask?" },
  { id: "unique", question: "Is there anything unique about this space?" },
];

export const EXPECTED_ROOM_COVERAGE = [
  "kitchen",
  "living room",
  "primary bedroom",
  "bathroom",
  "garage",
  "backyard",
  "dining room",
  "mechanical",
  "utility room",
] as const;
