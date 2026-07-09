import type { SupabaseClient } from "@supabase/supabase-js";

import { loadPropertyTwinContext } from "@/lib/repositories/property-repository";
import {
  getOrCreateConversation,
  logConversationTurn,
  recordAnalyticsEvent,
  recordBuyerObjection,
  recordUnansweredQuestion,
  upsertBuyerInterest,
} from "@/lib/repositories/session-repository";
import type { Database } from "@/types/database";

import { scoreInterests, getInterestScore } from "./interest/scoring";
import {
  createConversationMemory,
  setCurrentPoi,
  updateMemoryWithExchange,
} from "./conversation/memory";
import {
  checkEscalation,
  detectBuyerInterests,
  detectIntent,
  detectObjections,
} from "./intent/detector";
import { retrieveKnowledge } from "./knowledge/retriever";
import { buildEvidenceItems } from "./evidence";
import { buildPromptSnapshot, reasonFromKnowledge } from "./reasoning/engine";
import { generateResponse } from "./response/generator";
import { DEFAULT_AI_POLICY_RULES, type AiChatRequest, type AiChatResponse } from "./types";

type Client = SupabaseClient<Database>;

export async function processAiChat(
  client: Client,
  request: AiChatRequest,
): Promise<AiChatResponse> {
  const startTime = Date.now();

  const twinContext = await loadPropertyTwinContext(
    client,
    request.propertyId,
    request.currentPoiId,
  );

  if (!twinContext) {
    throw new Error("Property not found");
  }

  let memory =
    request.memory ??
    createConversationMemory(
      "en",
      request.currentPoiId ?? null,
      twinContext.currentPoi?.title ?? null,
    );

  if (request.currentPoiId && twinContext.currentPoi) {
    memory = setCurrentPoi(memory, request.currentPoiId, twinContext.currentPoi.title);
  }

  const intentResult = detectIntent(request.message);
  const buyerInterests = detectBuyerInterests(request.message);
  const objections = detectObjections(request.message);
  const escalation = checkEscalation(request.message);

  const knowledge = retrieveKnowledge(twinContext, request.message, intentResult.intent);

  const policyRules =
    twinContext.aiPolicy?.rules?.length
      ? twinContext.aiPolicy.rules
      : DEFAULT_AI_POLICY_RULES;

  const reasoningInput = {
    question: request.message,
    intent: escalation.required ? ("escalation" as const) : intentResult.intent,
    context: twinContext,
    memory,
    knowledge,
    policyRules,
  };

  const ruleBasedOutput = reasonFromKnowledge(reasoningInput);
  const generation = await generateResponse(reasoningInput, ruleBasedOutput);
  const output = generation.output;

  const durationMs = Date.now() - startTime;
  const promptSnapshot = buildPromptSnapshot(reasoningInput);

  const conversation = await getOrCreateConversation(
    client,
    request.propertyId,
    request.visitorSessionId,
  );

  await logConversationTurn(client, {
    conversation_id: conversation.id,
    property_id: request.propertyId,
    visitor_session_id: request.visitorSessionId,
    poi_id: request.currentPoiId ?? null,
    question: request.message,
    answer: output.answer,
    intent: intentResult.intent,
    confidence: output.confidence,
    knowledge_object_ids: output.knowledgeObjectIds,
    sentiment: null,
    buyer_interests: [...buyerInterests, ...output.buyerInterests],
    duration_ms: durationMs,
    prompt_snapshot: promptSnapshot,
    model: generation.model,
    token_usage: generation.tokenUsage,
  });

  for (const interest of [...buyerInterests, ...output.buyerInterests]) {
    await upsertBuyerInterest(client, {
      visitorSessionId: request.visitorSessionId,
      propertyId: request.propertyId,
      interestTopic: interest,
      scoreIncrement: getInterestScore(interest),
    });
  }

  for (const objection of [...objections, ...output.objections]) {
    await recordBuyerObjection(client, {
      visitorSessionId: request.visitorSessionId,
      propertyId: request.propertyId,
      objectionTopic: objection,
    });
  }

  if (output.unanswered) {
    await recordUnansweredQuestion(client, {
      propertyId: request.propertyId,
      visitorSessionId: request.visitorSessionId,
      question: request.message,
      suggestedKnowledgeAddition: `Add verified facts for: ${request.message}`,
    });
  }

  await recordAnalyticsEvent(client, {
    propertyId: request.propertyId,
    visitorSessionId: request.visitorSessionId,
    poiId: request.currentPoiId ?? undefined,
    eventType: "question_asked",
    eventData: {
      intent: intentResult.intent,
      confidence: output.confidence,
      unanswered: output.unanswered,
      interestScores: scoreInterests([...buyerInterests, ...output.buyerInterests]),
      responseTimeMs: durationMs,
      currentPoi: twinContext.currentPoi?.title ?? null,
    },
  });

  memory = updateMemoryWithExchange(memory, request.message, output.answer, buyerInterests);

  return {
    answer: output.answer,
    confidence: output.confidence,
    intent: intentResult.intent,
    escalated: output.escalationRequired || escalation.required,
    escalationReason: output.escalationReason ?? escalation.reason,
    knowledgeObjectIds: output.knowledgeObjectIds,
    buyerInterests: [...buyerInterests, ...output.buyerInterests],
    objections: [...objections, ...output.objections],
    followUpSuggestion: output.followUpSuggestion,
    unanswered: output.unanswered,
    promptSnapshot,
    evidence: buildEvidenceItems(twinContext, output.knowledgeObjectIds),
    tokenUsage: generation.tokenUsage,
    model: generation.model,
    durationMs,
  };
}
