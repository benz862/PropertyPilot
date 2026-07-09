import type { SupabaseClient } from "@supabase/supabase-js";

import { processAiChat } from "@/lib/ai/orchestrator";
import {
  createConversationMemory,
  setCurrentPoi,
  updateMemoryWithExchange,
} from "@/lib/ai/conversation/memory";
import {
  extractBuyerProfile,
  formatBuyerProfile,
  getProfileRecommendation,
  type BuyerProfileMemory,
} from "@/lib/ai/conversation/buyer-profile";
import {
  determineConversationState,
  getStateGuidance,
} from "@/lib/ai/conversation/state";
import { scoreInterests } from "@/lib/ai/interest/scoring";
import { suggestRoomTransition } from "@/lib/ai/voice/transitions";
import {
  classifyResponseType,
  getEstimatedSpeakingSeconds,
  getMaxSpeakingSeconds,
  trimForVoice,
} from "@/lib/ai/voice/response-length";
import { loadPropertyTwinContext } from "@/lib/repositories/property-repository";
import type { Database } from "@/types/database";

import { createVoiceSessionConfig } from "./session";
import type { AiEvidenceItem } from "../evidence";
import type { AiChatRequest, ConversationMemoryState } from "../types";

type Client = SupabaseClient<Database>;

export interface VoiceConciergeRequest extends AiChatRequest {
  buyerProfile?: BuyerProfileMemory;
  interrupted?: boolean;
}

export interface VoiceConciergeResponse {
  answer: string;
  spokenAnswer: string;
  confidence: "high" | "medium" | "low";
  intent: string;
  conversationState: string;
  buyerInterests: string[];
  interestSummary: string;
  objections: string[];
  roomTransition?: string;
  profileRecommendation?: string;
  escalated: boolean;
  escalationReason?: string;
  followUpSuggestion?: string;
  unanswered: boolean;
  speakingSeconds: number;
  maxSpeakingSeconds: number;
  truncated: boolean;
  offerContinuation: boolean;
  voiceConfig: ReturnType<typeof createVoiceSessionConfig>;
  memory: ConversationMemoryState;
  buyerProfile: BuyerProfileMemory;
  evidence: AiEvidenceItem[];
  durationMs: number;
  offline: boolean;
}

export async function processVoiceConcierge(
  client: Client,
  request: VoiceConciergeRequest,
): Promise<VoiceConciergeResponse> {
  const twinContext = await loadPropertyTwinContext(
    client,
    request.propertyId,
    request.currentPoiId,
  );

  if (!twinContext) {
    throw new Error("Property not found");
  }

  const voice = twinContext.voicePersonality;
  const voiceConfig = createVoiceSessionConfig(
    voice?.voice_id ?? "alloy",
    voice?.speaking_speed ?? 1.0,
    voice?.greeting ??
      "Welcome! I'm here to help you learn about this property. What would you like to know?",
  );

  let memory: ConversationMemoryState =
    request.memory ??
    createConversationMemory(
      "en",
      request.currentPoiId ?? null,
      twinContext.currentPoi?.title ?? null,
    );

  if (request.currentPoiId && twinContext.currentPoi) {
    memory = setCurrentPoi(memory, request.currentPoiId, twinContext.currentPoi.title);
  }

  const buyerProfile = extractBuyerProfile(
    request.message,
    request.buyerProfile,
  );

  const chatResponse = await processAiChat(client, {
    ...request,
    memory,
  });

  const responseType = classifyResponseType(
    chatResponse.intent,
    memory.questionsAsked.length + 1,
  );
  const trimmed = trimForVoice(chatResponse.answer, responseType);

  let spokenAnswer = trimmed.text;
  if (trimmed.offerContinuation && !spokenAnswer.includes("?")) {
    spokenAnswer = `${spokenAnswer} Would you like me to continue?`;
  }

  const profileRecommendation = getProfileRecommendation(buyerProfile);
  const roomTransition = suggestRoomTransition(twinContext, request.currentPoiId ?? null);

  const conversationState = determineConversationState({
    messageCount: memory.questionsAsked.length + 1,
    intent: chatResponse.intent,
    hasBuyerInterests: chatResponse.buyerInterests.length > 0,
    escalated: chatResponse.escalated,
    leadCaptureSuggested:
      chatResponse.intent === "brochure" || chatResponse.intent === "showing",
  });

  const scoredInterests = scoreInterests(chatResponse.buyerInterests);

  memory = updateMemoryWithExchange(
    memory,
    request.message,
    spokenAnswer,
    chatResponse.buyerInterests,
  );

  return {
    answer: chatResponse.answer,
    spokenAnswer,
    confidence: chatResponse.confidence,
    intent: chatResponse.intent,
    conversationState,
    buyerInterests: chatResponse.buyerInterests,
    interestSummary: scoredInterests
      .map((item) => `${item.topic} (+${item.score})`)
      .join(", "),
    objections: chatResponse.objections,
    roomTransition: request.interrupted ? undefined : roomTransition,
    profileRecommendation,
    escalated: chatResponse.escalated,
    escalationReason: chatResponse.escalationReason,
    followUpSuggestion: chatResponse.followUpSuggestion,
    unanswered: chatResponse.unanswered,
    speakingSeconds: getEstimatedSpeakingSeconds(spokenAnswer),
    maxSpeakingSeconds: getMaxSpeakingSeconds(responseType),
    truncated: trimmed.truncated,
    offerContinuation: trimmed.offerContinuation,
    voiceConfig,
    memory,
    buyerProfile,
    evidence: chatResponse.evidence,
    durationMs: chatResponse.durationMs,
    offline: false,
  };
}

export function createOfflineConciergeResponse(
  agentName: string,
): Pick<VoiceConciergeResponse, "spokenAnswer" | "offline" | "conversationState"> {
  return {
    spokenAnswer: `I'm having trouble connecting right now, but you can still browse property photos, documents, and contact ${agentName} directly.`,
    offline: true,
    conversationState: "exploration",
  };
}

export function buildConciergeContextSummary(
  memory: ConversationMemoryState,
  profile: BuyerProfileMemory,
  stateGuidance: string,
): string {
  return [
    `State guidance: ${stateGuidance}`,
    `Buyer profile: ${formatBuyerProfile(profile)}`,
    `Interests: ${memory.buyerInterests.join(", ") || "none"}`,
  ].join("\n");
}

export { getStateGuidance };
