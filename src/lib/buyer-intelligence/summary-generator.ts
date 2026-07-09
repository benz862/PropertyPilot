import { INTEREST_TOPIC_LABELS } from "./config";
import type {
  BuyerConcernSignal,
  BuyerInterestSignal,
  BuyerSentiment,
  EngagementMetrics,
  FollowUpRecommendation,
} from "./types";
import type { BuyerIntentLevel } from "./types";
import { formatIntentLabel } from "./intent-engine";

export function generateExecutiveSummary(input: {
  durationMinutes: number | null;
  topPois: string[];
  topInterests: BuyerInterestSignal[];
  concerns: BuyerConcernSignal[];
  questionsCount: number;
  intentLevel: BuyerIntentLevel;
  showingRequested: boolean;
  brochureRequested: boolean;
}): string {
  const parts: string[] = [];

  if (input.durationMinutes) {
    parts.push(
      `The visitor spent approximately ${input.durationMinutes} minutes exploring the property.`,
    );
  } else {
    parts.push("The visitor explored the property.");
  }

  if (input.topPois.length > 0) {
    parts.push(`Most attention was given to ${formatList(input.topPois)}.`);
  }

  if (input.topInterests.length > 0) {
    const interestNames = input.topInterests
      .slice(0, 3)
      .map((i) => i.name)
      .join(", ");
    parts.push(`Strong interest signals: ${interestNames}.`);
  }

  if (input.questionsCount > 0) {
    parts.push(`The visitor asked ${input.questionsCount} question${input.questionsCount === 1 ? "" : "s"}.`);
  }

  if (input.concerns.length > 0) {
    parts.push(
      `Concerns detected around ${input.concerns.map((c) => c.concern.toLowerCase()).join(", ")}.`,
    );
  } else {
    parts.push("No significant objections were detected.");
  }

  if (input.brochureRequested) {
    parts.push("The visitor requested the property brochure.");
  }
  if (input.showingRequested) {
    parts.push("The visitor expressed interest in scheduling another visit.");
  }

  parts.push(`Intent level: ${formatIntentLabel(input.intentLevel)}.`);

  return parts.join(" ");
}

export function generateFollowUpRecommendations(input: {
  interests: BuyerInterestSignal[];
  concerns: BuyerConcernSignal[];
  intentLevel: BuyerIntentLevel;
  topQuestions: string[];
}): FollowUpRecommendation[] {
  const recs: FollowUpRecommendation[] = [];

  for (const interest of input.interests.slice(0, 3)) {
    recs.push({
      action: `Discuss ${interest.name.toLowerCase()} features`,
      reason: `Visitor showed ${interest.confidenceScore}% confidence interest based on ${interest.evidence.length} signal(s).`,
      priority: interest.confidenceScore,
    });
  }

  for (const concern of input.concerns) {
    recs.push({
      action: `Provide ${concern.concern.toLowerCase()} documentation`,
      reason: `Asked about ${concern.concern.toLowerCase()} ${concern.frequency} time(s).`,
      priority: concern.confidence,
    });
  }

  if (input.intentLevel === "ready_to_act" || input.intentLevel === "very_interested") {
    recs.push({
      action: "Recommend second showing",
      reason: "High intent signals suggest the buyer is ready for a deeper conversation.",
      priority: 90,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

export function generateTalkingPoints(input: {
  interests: BuyerInterestSignal[];
  concerns: BuyerConcernSignal[];
  engagement: EngagementMetrics;
}): string[] {
  const points: string[] = [];

  if (input.engagement.poisViewed.length > 0) {
    points.push(`Spent time in: ${formatList(input.engagement.poisViewed)}`);
  }
  for (const interest of input.interests.slice(0, 2)) {
    points.push(`Interested in ${interest.name}`);
  }
  for (const concern of input.concerns.slice(0, 2)) {
    points.push(`Asked about ${concern.concern}`);
  }

  return points.length > 0 ? points : ["General property exploration — ask what stood out most."];
}

export function estimateSentiment(input: {
  concerns: BuyerConcernSignal[];
  intentLevel: BuyerIntentLevel;
  questionsCount: number;
}): BuyerSentiment {
  if (input.intentLevel === "ready_to_act") return "excited";
  if (input.concerns.length >= 3) return "concerned";
  if (input.concerns.length >= 1) return "uncertain";
  if (input.questionsCount >= 5) return "positive";
  return "neutral";
}

export function mapInterestSignals(
  interests: Array<{ interest_topic: string; score: number; created_at: string }>,
  questions: string[],
): BuyerInterestSignal[] {
  return interests.map((interest) => ({
    name: INTEREST_TOPIC_LABELS[interest.interest_topic] ?? interest.interest_topic,
    confidenceScore: Math.min(100, interest.score * 15),
    evidence: [`Score: ${interest.score}`],
    supportingQuestions: questions.filter((q) =>
      q.toLowerCase().includes(interest.interest_topic.replace(/_/g, " ")),
    ),
    timestamp: interest.created_at,
  }));
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
