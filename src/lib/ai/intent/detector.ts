import type { ConversationIntent } from "@/types/database";

import {
  ESCALATION_TRIGGERS,
  INTEREST_TOPICS,
  OBJECTION_TOPICS,
  type IntentDetectionResult,
} from "../types";

const INTENT_PATTERNS: Array<{ intent: ConversationIntent; patterns: RegExp[] }> = [
  { intent: "showing", patterns: [/\b(showing|tour|visit|walk.?through)\b/i] },
  { intent: "brochure", patterns: [/\b(brochure|pdf|flyer|printout)\b/i] },
  { intent: "agent", patterns: [/\b(agent|realtor|listing agent|contact)\b/i] },
  { intent: "offer", patterns: [/\b(offer|bid|purchase)\b/i] },
  { intent: "price", patterns: [/\b(price|cost|how much|listing price)\b/i] },
  { intent: "taxes", patterns: [/\b(tax|taxes|property tax)\b/i] },
  { intent: "schools", patterns: [/\b(school|district|elementary|high school)\b/i] },
  { intent: "neighborhood", patterns: [/\b(neighborhood|area|community|nearby)\b/i] },
  { intent: "directions", patterns: [/\b(directions|how do i get|where is)\b/i] },
  { intent: "utilities", patterns: [/\b(utilities|electric|gas|water|sewer|internet)\b/i] },
  { intent: "maintenance", patterns: [/\b(maintenance|upkeep|service|repair)\b/i] },
  {
    intent: "mechanical_system",
    patterns: [
      /\b(furnace|hvac|heating|cooling|roof|plumbing|electrical|water heater)\b/i,
    ],
  },
  { intent: "room_question", patterns: [/\b(room|bedroom|bathroom|kitchen|garage|basement)\b/i] },
  { intent: "feature_comparison", patterns: [/\b(compare|versus|vs|difference|better)\b/i] },
  { intent: "property_question", patterns: [/\b(property|house|home|listing)\b/i] },
];

export function detectIntent(message: string): IntentDetectionResult {
  for (const trigger of ESCALATION_TRIGGERS) {
    if (trigger.pattern.test(message)) {
      return {
        intent: "escalation",
        confidence: 0.95,
        keywords: [trigger.reason],
      };
    }
  }

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const match = message.match(pattern);
        return {
          intent,
          confidence: 0.85,
          keywords: match ? [match[0].toLowerCase()] : [],
        };
      }
    }
  }

  return {
    intent: "general_conversation",
    confidence: 0.5,
    keywords: [],
  };
}

export function detectBuyerInterests(message: string): string[] {
  const interests: string[] = [];
  for (const { pattern, topic } of INTEREST_TOPICS) {
    if (pattern.test(message)) interests.push(topic);
  }
  return interests;
}

export function detectObjections(message: string): string[] {
  const objections: string[] = [];
  for (const { pattern, topic } of OBJECTION_TOPICS) {
    if (pattern.test(message)) objections.push(topic);
  }
  return objections;
}

export function checkEscalation(message: string): { required: boolean; reason?: string } {
  for (const trigger of ESCALATION_TRIGGERS) {
    if (trigger.pattern.test(message)) {
      return { required: true, reason: trigger.reason };
    }
  }
  return { required: false };
}
