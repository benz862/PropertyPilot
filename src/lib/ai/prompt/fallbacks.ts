export const FALLBACK_RESPONSES = {
  unknown: "I don't have verified information about that.",
  conflict:
    "I have conflicting information and don't want to give you an inaccurate answer.",
  unavailable: "The listing agent should be able to confirm that.",
  showing:
    "If you'd like to see the property again with the listing agent, I can help arrange that.",
  brochure:
    "If you'd like, I can send you the complete property guide along with the floor plan and feature list.",
} as const;

export type FallbackType = keyof typeof FALLBACK_RESPONSES;

export function getFallbackResponse(type: FallbackType): string {
  return FALLBACK_RESPONSES[type];
}

export function appendFollowUpOffer(answer: string, topic?: string): string {
  if (answer.includes("?")) return answer;
  const offer = topic
    ? `If you'd like, I can also tell you more about ${topic}.`
    : "If you'd like, I can share more details.";
  return `${answer} ${offer}`;
}
