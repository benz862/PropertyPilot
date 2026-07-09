import type { ConversationMessage } from "@/types/database";

import type { ConversationMemoryState } from "../types";

export function createConversationMemory(
  preferredLanguage = "en",
  currentPoiId: string | null = null,
  currentPoiTitle: string | null = null,
): ConversationMemoryState {
  return {
    currentPoiId,
    currentPoiTitle,
    buyerInterests: [],
    questionsAsked: [],
    conversationSummary: "",
    preferredLanguage,
    messageHistory: [],
  };
}

export function updateMemoryWithExchange(
  memory: ConversationMemoryState,
  question: string,
  answer: string,
  interests: string[],
): ConversationMemoryState {
  const timestamp = new Date().toISOString();
  const newHistory: ConversationMessage[] = [
    ...memory.messageHistory,
    { role: "user", content: question, timestamp },
    { role: "assistant", content: answer, timestamp },
  ];

  const mergedInterests = Array.from(
    new Set([...memory.buyerInterests, ...interests]),
  );

  const summaryParts = [
    memory.conversationSummary,
    `Q: ${question}`,
    `A: ${answer.slice(0, 120)}`,
  ].filter(Boolean);

  return {
    ...memory,
    questionsAsked: [...memory.questionsAsked, question],
    buyerInterests: mergedInterests,
    messageHistory: newHistory.slice(-20),
    conversationSummary: summaryParts.slice(-6).join(" | "),
  };
}

export function setCurrentPoi(
  memory: ConversationMemoryState,
  poiId: string | null,
  poiTitle: string | null,
): ConversationMemoryState {
  return {
    ...memory,
    currentPoiId: poiId,
    currentPoiTitle: poiTitle,
  };
}
