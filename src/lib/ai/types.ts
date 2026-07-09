import type {
  ConfidenceLevel,
  ConversationIntent,
  ConversationMessage,
  PropertyTwinContext,
} from "@/types/database";

import type { BuyerProfileMemory } from "./conversation/buyer-profile";
import type { ConversationState } from "./conversation/state";
import type { AiEvidenceItem } from "./evidence";

export interface ConversationMemoryState {
  currentPoiId: string | null;
  currentPoiTitle: string | null;
  buyerInterests: string[];
  questionsAsked: string[];
  conversationSummary: string;
  preferredLanguage: string;
  messageHistory: ConversationMessage[];
  conversationState?: ConversationState;
  buyerProfile?: BuyerProfileMemory;
}

export interface AiChatRequest {
  propertyId: string;
  visitorSessionId: string;
  conversationId: string;
  message: string;
  currentPoiId?: string | null;
  memory?: ConversationMemoryState;
}

export interface AiChatResponse {
  answer: string;
  confidence: ConfidenceLevel;
  intent: ConversationIntent;
  escalated: boolean;
  escalationReason?: string;
  knowledgeObjectIds: string[];
  buyerInterests: string[];
  objections: string[];
  followUpSuggestion?: string;
  unanswered: boolean;
  promptSnapshot: Record<string, unknown>;
  evidence: AiEvidenceItem[];
  tokenUsage: number;
  model: string;
  durationMs: number;
}

export interface IntentDetectionResult {
  intent: ConversationIntent;
  confidence: number;
  keywords: string[];
}

export interface RetrievedKnowledge {
  knowledgeObjects: PropertyTwinContext["knowledgeObjects"];
  systems: PropertyTwinContext["systems"];
  appliances: PropertyTwinContext["appliances"];
  features: PropertyTwinContext["features"];
  documents: PropertyTwinContext["documents"];
  relevantPois: PropertyTwinContext["pointsOfInterest"];
  hasVerifiedData: boolean;
}

export interface ReasoningInput {
  question: string;
  intent: ConversationIntent;
  context: PropertyTwinContext;
  memory: ConversationMemoryState;
  knowledge: RetrievedKnowledge;
  policyRules: string[];
}

export interface ReasoningOutput {
  answer: string;
  confidence: ConfidenceLevel;
  knowledgeObjectIds: string[];
  buyerInterests: string[];
  objections: string[];
  followUpSuggestion?: string;
  unanswered: boolean;
  escalationRequired: boolean;
  escalationReason?: string;
}

export interface PromptModule {
  name: string;
  build(input: ReasoningInput): string;
}

export const DEFAULT_AI_POLICY_RULES: string[] = [
  "Never guess or speculate about property facts.",
  "Never discuss politics.",
  "Never estimate property values.",
  "Never answer legal, medical, tax, engineering, inspection, environmental, or zoning questions.",
  "Always distinguish verified facts from unknown information.",
  "Always disclose uncertainty when information is unavailable.",
  "Encourage contacting the listing agent when necessary.",
  "Use contractions and speak naturally like an experienced realtor.",
  "Keep responses short, professional, and easy to understand.",
];

export const LOW_CONFIDENCE_RESPONSE =
  "I don't have verified information about that. The listing agent may be able to provide those details.";

export const CONFLICT_RESPONSE =
  "I have conflicting information and don't want to give you an inaccurate answer.";

export const UNAVAILABLE_RESPONSE =
  "The listing agent should be able to confirm that.";

export const CONCIERGE_PERSONALITY_RULES: string[] = [
  "Be professional, warm, confident, patient, and knowledgeable.",
  "Never robotic, overly enthusiastic, cheesy, or salesy.",
  "Short answers first. Offer more only if requested.",
  "Never dominate the conversation. Answer, pause, listen.",
  "Never say 'As I was saying' after interruption.",
  "Use natural contractions and comfortable pacing.",
  "Very light humor is allowed. Never jokes, sarcasm, or politics.",
];

export const ESCALATION_TRIGGERS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  { pattern: /\b(schedule|book|arrange)\b.*\b(showing|tour|visit)\b/i, reason: "showing_request" },
  { pattern: /\b(make|submit|write)\b.*\b(offer|bid)\b/i, reason: "offer_request" },
  { pattern: /\b(legal|lawyer|attorney|lawsuit|liability)\b/i, reason: "legal_advice" },
  { pattern: /\b(financ|mortgage|loan|pre-?approv|interest rate)\b/i, reason: "financing_advice" },
  { pattern: /\b(negotiat|counter.?offer|lower the price)\b/i, reason: "negotiation_request" },
  { pattern: /\b(disclosure|seller.?disclosure)\b.*\b(unavailable|don't have|not available)\b/i, reason: "missing_disclosure" },
  { pattern: /\b(speak|talk|contact|call|email)\b.*\b(agent|realtor|listing)\b/i, reason: "agent_request" },
  { pattern: /\b(showing|tour)\b/i, reason: "showing_request" },
  { pattern: /\b(brochure|pdf|email me)\b/i, reason: "brochure_request" },
];

export const INTEREST_TOPICS: Array<{ pattern: RegExp; topic: string }> = [
  { pattern: /\b(garage|parking|carport)\b/i, topic: "garage" },
  { pattern: /\b(workshop|flex space|bonus room)\b/i, topic: "workshop" },
  { pattern: /\b(pool|spa|hot tub)\b/i, topic: "pool" },
  { pattern: /\b(school|district|education)\b/i, topic: "schools" },
  { pattern: /\b(accessib|wheelchair|ada|ramp)\b/i, topic: "accessibility" },
  { pattern: /\b(office|work from home|den)\b/i, topic: "office_space" },
  { pattern: /\b(storage|closet|pantry)\b/i, topic: "storage" },
  { pattern: /\b(invest|rental|income)\b/i, topic: "investment" },
  { pattern: /\b(luxury|premium|high.?end)\b/i, topic: "luxury_features" },
];

export const OBJECTION_TOPICS: Array<{ pattern: RegExp; topic: string }> = [
  { pattern: /\b(small|tiny|narrow)\b.*\b(yard|lot|backyard)\b/i, topic: "small_yard" },
  { pattern: /\b(high|expensive|steep)\b.*\b(tax|taxes)\b/i, topic: "taxes" },
  { pattern: /\b(old|dated|aging|ancient)\b/i, topic: "age" },
  { pattern: /\b(roof|shingle|leak)\b/i, topic: "roof" },
  { pattern: /\b(furnace|hvac|ac|air condition|heating)\b/i, topic: "hvac" },
  { pattern: /\b(commute|traffic|drive time)\b/i, topic: "commute" },
  { pattern: /\b(expensive|overpriced|too much|pricey)\b/i, topic: "price" },
  { pattern: /\b(hoa|association fee)\b/i, topic: "hoa" },
  { pattern: /\b(maintenance|upkeep|repair)\b/i, topic: "maintenance" },
];
