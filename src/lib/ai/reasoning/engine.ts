import type { ConfidenceLevel } from "@/types/database";

import { formatKnowledgeForPrompt } from "../knowledge/retriever";
import { formatBuyerProfile } from "../conversation/buyer-profile";
import { getStateGuidance, determineConversationState } from "../conversation/state";
import { FALLBACK_RESPONSES } from "../prompt/fallbacks";
import {
  CONCIERGE_PERSONALITY_RULES,
  DEFAULT_AI_POLICY_RULES,
  LOW_CONFIDENCE_RESPONSE,
  type PromptModule,
  type ReasoningInput,
  type ReasoningOutput,
} from "../types";

export const PROPERTY_CONCIERGE_PROMPT = {
  key: "property_concierge.response",
  version: "1.0.0",
  policyVersion: "1.0.0",
  model: "gpt-4o-mini",
} as const;

export const truthPolicyModule: PromptModule = {
  name: "truth_policy",
  build: (input) => {
    const rules = input.policyRules.length ? input.policyRules : DEFAULT_AI_POLICY_RULES;
    return `## Truth Policy\n${rules.map((r) => `- ${r}`).join("\n")}`;
  },
};

export const propertyContextModule: PromptModule = {
  name: "property_context",
  build: (input) => {
    const { property } = input.context;
    const address = `${property.street}, ${property.city}, ${property.province_state} ${property.postal_code}`;
    const details = [
      property.bedrooms != null ? `${property.bedrooms} bedrooms` : null,
      property.bathrooms != null ? `${property.bathrooms} bathrooms` : null,
      property.finished_sq_ft != null ? `${property.finished_sq_ft} sq ft` : null,
      property.year_built != null ? `built ${property.year_built}` : null,
      property.listing_price != null ? `listed at $${property.listing_price.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return `## Property\nAddress: ${address}\n${details}\n${property.public_remarks ?? ""}`;
  },
};

export const roomContextModule: PromptModule = {
  name: "room_context",
  build: (input) => {
    const poi = input.context.currentPoi;
    if (!poi) return "## Current Location\nVisitor location not specified.";
    return `## Current Location\nVisitor is at: ${poi.title}${poi.subtitle ? ` — ${poi.subtitle}` : ""}`;
  },
};

export const knowledgeModule: PromptModule = {
  name: "verified_knowledge",
  build: (input) => formatKnowledgeForPrompt(input.knowledge),
};

export const conversationMemoryModule: PromptModule = {
  name: "conversation_memory",
  build: (input) => {
    const parts: string[] = ["## Conversation Memory"];
    if (input.memory.questionsAsked.length) {
      parts.push(`Previous questions: ${input.memory.questionsAsked.slice(-5).join("; ")}`);
    }
    if (input.memory.buyerInterests.length) {
      parts.push(`Buyer interests: ${input.memory.buyerInterests.join(", ")}`);
    }
    if (input.memory.conversationSummary) {
      parts.push(`Summary: ${input.memory.conversationSummary}`);
    }
    return parts.join("\n");
  },
};

export const conciergePersonalityModule: PromptModule = {
  name: "concierge_personality",
  build: () =>
    `## Concierge Personality\n${CONCIERGE_PERSONALITY_RULES.map((r) => `- ${r}`).join("\n")}`,
};

export const buyerSessionModule: PromptModule = {
  name: "buyer_session",
  build: (input) => {
    const state = determineConversationState({
      messageCount: input.memory.questionsAsked.length + 1,
      intent: input.intent,
      hasBuyerInterests: input.memory.buyerInterests.length > 0,
      escalated: input.intent === "escalation",
      leadCaptureSuggested:
        input.intent === "brochure" || input.intent === "showing",
    });
    const profile = input.memory.buyerProfile;
    const parts = [
      "## Buyer Session",
      `Conversation state: ${state}`,
      getStateGuidance(state),
    ];
    if (profile) {
      parts.push(`Buyer profile: ${formatBuyerProfile(profile)}`);
    }
    return parts.join("\n");
  },
};

export const voiceStyleModule: PromptModule = {
  name: "voice_style",
  build: (input) => {
    const voice = input.context.voicePersonality;
    if (!voice) {
      return "## Voice Style\nSpeak like an experienced, friendly realtor. Use contractions. Be concise.";
    }
    return `## Voice Style\nTone: ${voice.tone}\nStyle: ${voice.conversation_style ?? "professional realtor"}\nFormality: ${voice.formality}/10`;
  },
};

export const PROMPT_MODULES: PromptModule[] = [
  truthPolicyModule,
  conciergePersonalityModule,
  propertyContextModule,
  roomContextModule,
  knowledgeModule,
  conversationMemoryModule,
  buyerSessionModule,
  voiceStyleModule,
];

export function buildSystemPrompt(input: ReasoningInput): string {
  const modules = PROMPT_MODULES.map((m) => m.build(input));
  return [
    "You are the PropertyPilot AI — a knowledgeable property expert for this listing.",
    "Answer ONLY from verified knowledge provided below. Never guess or invent facts.",
    "If information is unavailable, say you don't have verified information and suggest contacting the listing agent.",
    "",
    ...modules,
  ].join("\n");
}

function findRelevantFactAnswer(input: ReasoningInput): ReasoningOutput | null {
  const questionLower = input.question.toLowerCase();

  for (const ko of input.knowledge.knowledgeObjects) {
    for (const fact of ko.verified_facts) {
      const factKey = fact.key.toLowerCase();
      if (
        questionLower.includes(factKey) ||
        factKey.split(/\s+/).some((word) => word.length > 3 && questionLower.includes(word))
      ) {
        return {
          answer: `${fact.value}`,
          confidence: "high",
          knowledgeObjectIds: [ko.id],
          buyerInterests: [],
          objections: [],
          unanswered: false,
          escalationRequired: false,
          followUpSuggestion: suggestFollowUp(ko.name, input),
        };
      }
    }

    if (
      questionLower.includes(ko.name.toLowerCase()) ||
      questionLower.includes(ko.category.replace("_", " "))
    ) {
      if (ko.summary) {
        return {
          answer: ko.summary,
          confidence: ko.confidence_level,
          knowledgeObjectIds: [ko.id],
          buyerInterests: [],
          objections: [],
          unanswered: false,
          escalationRequired: false,
        };
      }
    }
  }

  for (const system of input.knowledge.systems) {
    const typeLower = system.system_type.toLowerCase();
    if (questionLower.includes(typeLower)) {
      const parts: string[] = [];
      if (system.manufacturer) parts.push(`manufacturer is ${system.manufacturer}`);
      if (system.age_years != null) parts.push(`approximately ${system.age_years} years old`);
      if (system.notes) parts.push(system.notes);

      if (parts.length) {
        return {
          answer: `The ${system.system_type} ${parts.join(", ")}.`,
          confidence: system.age_years != null ? "high" : "medium",
          knowledgeObjectIds: system.knowledge_object_id ? [system.knowledge_object_id] : [],
          buyerInterests: [],
          objections: [],
          unanswered: false,
          escalationRequired: false,
        };
      }
    }
  }

  return null;
}

function suggestFollowUp(topicName: string, input: ReasoningInput): string | undefined {
  const related = input.knowledge.knowledgeObjects.find(
    (ko) => ko.name !== topicName && ko.category !== "other",
  );
  if (related) {
    return `Would you like to know more about the ${related.name}?`;
  }
  return undefined;
}

export function reasonFromKnowledge(input: ReasoningInput): ReasoningOutput {
  if (input.intent === "escalation") {
    return {
      answer:
        "I'd be happy to connect you with the listing agent who can help with that directly. Would you like me to arrange that?",
      confidence: "high",
      knowledgeObjectIds: [],
      buyerInterests: [],
      objections: [],
      unanswered: false,
      escalationRequired: true,
      escalationReason: "buyer_request",
    };
  }

  if (input.intent === "price" && input.context.property.listing_price != null) {
    return {
      answer: `This property is listed at $${input.context.property.listing_price.toLocaleString()}.`,
      confidence: "high",
      knowledgeObjectIds: [],
      buyerInterests: [],
      objections: [],
      unanswered: false,
      escalationRequired: false,
    };
  }

  if (input.intent === "taxes" && input.context.property.annual_taxes != null) {
    return {
      answer: `Annual property taxes are approximately $${input.context.property.annual_taxes.toLocaleString()}.`,
      confidence: "high",
      knowledgeObjectIds: [],
      buyerInterests: [],
      objections: [],
      unanswered: false,
      escalationRequired: false,
    };
  }

  if (input.intent === "schools" && input.context.property.school_district) {
    return {
      answer: `This property is in the ${input.context.property.school_district} school district.`,
      confidence: "high",
      knowledgeObjectIds: [],
      buyerInterests: ["schools"],
      objections: [],
      unanswered: false,
      escalationRequired: false,
    };
  }

  const factAnswer = findRelevantFactAnswer(input);
  if (factAnswer) return factAnswer;

  if (!input.knowledge.hasVerifiedData) {
    return {
      answer: LOW_CONFIDENCE_RESPONSE,
      confidence: "low",
      knowledgeObjectIds: [],
      buyerInterests: [],
      objections: [],
      unanswered: true,
      escalationRequired: false,
      followUpSuggestion: FALLBACK_RESPONSES.unavailable,
    };
  }

  const hasConflict = input.knowledge.knowledgeObjects.some(
    (ko) => ko.confidence_level === "low" && ko.unknown_facts.length > 0,
  );
  if (hasConflict) {
    return {
      answer: FALLBACK_RESPONSES.conflict,
      confidence: "low",
      knowledgeObjectIds: [],
      buyerInterests: [],
      objections: [],
      unanswered: true,
      escalationRequired: false,
    };
  }

  return {
    answer: LOW_CONFIDENCE_RESPONSE,
    confidence: "low",
    knowledgeObjectIds: [],
    buyerInterests: [],
    objections: [],
    unanswered: true,
    escalationRequired: false,
  };
}

export function buildPromptSnapshot(input: ReasoningInput): Record<string, unknown> {
  return {
    promptKey: PROPERTY_CONCIERGE_PROMPT.key,
    promptVersion: PROPERTY_CONCIERGE_PROMPT.version,
    policyVersion: PROPERTY_CONCIERGE_PROMPT.policyVersion,
    model: PROPERTY_CONCIERGE_PROMPT.model,
    modules: PROMPT_MODULES.map((m) => m.name),
    intent: input.intent,
    question: input.question,
    currentPoi: input.context.currentPoi?.title ?? null,
    knowledgeObjectCount: input.knowledge.knowledgeObjects.length,
    timestamp: new Date().toISOString(),
  };
}

export function mapConfidenceToLevel(value: string): ConfidenceLevel {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}
