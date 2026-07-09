export type VoiceResponseType = "greeting" | "question" | "technical";

const MAX_CHARS: Record<VoiceResponseType, number> = {
  greeting: 320,
  question: 240,
  technical: 480,
};

const MAX_SECONDS: Record<VoiceResponseType, number> = {
  greeting: 20,
  question: 15,
  technical: 30,
};

export function classifyResponseType(
  intent: string,
  messageCount: number,
): VoiceResponseType {
  if (messageCount <= 1) return "greeting";
  if (
    intent === "mechanical_system" ||
    intent === "utilities" ||
    intent === "maintenance"
  ) {
    return "technical";
  }
  return "question";
}

export function trimForVoice(
  answer: string,
  responseType: VoiceResponseType,
): { text: string; truncated: boolean; offerContinuation: boolean } {
  const maxChars = MAX_CHARS[responseType];

  if (answer.length <= maxChars) {
    return { text: answer, truncated: false, offerContinuation: false };
  }

  const sentences = answer.match(/[^.!?]+[.!?]+/g) ?? [answer];
  let result = "";
  for (const sentence of sentences) {
    if ((result + sentence).length > maxChars) break;
    result += sentence;
  }

  if (!result.trim()) {
    result = `${answer.slice(0, maxChars - 3).trim()}...`;
  }

  return {
    text: result.trim(),
    truncated: true,
    offerContinuation: true,
  };
}

export function getEstimatedSpeakingSeconds(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.round(words / 2.5);
}

export function getMaxSpeakingSeconds(responseType: VoiceResponseType): number {
  return MAX_SECONDS[responseType];
}
