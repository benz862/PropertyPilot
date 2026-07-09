import {
  DEFAULT_INTENT_CONFIG,
  INTENT_THRESHOLDS,
  type IntentScoringConfig,
} from "./config";
import type { BuyerIntentLevel, EngagementMetrics } from "./types";

export interface IntentInput {
  engagement: EngagementMetrics;
  showingRequested: boolean;
  brochureRequested: boolean;
  config?: IntentScoringConfig;
}

export function calculateIntentScore(input: IntentInput): number {
  const config = input.config ?? DEFAULT_INTENT_CONFIG;
  let score = 0;

  if (input.engagement.tourStarted) score += 5;
  if (input.engagement.tourCompleted) score += config.tourCompletion;
  if (input.showingRequested || input.engagement.showingRequests > 0) {
    score += config.showingRequest;
  }
  if (input.brochureRequested || input.engagement.brochureRequests > 0) {
    score += config.brochureDownload;
  }
  if (input.engagement.questionsAsked > 3) {
    score += config.repeatQuestions * Math.min(input.engagement.questionsAsked - 3, 5);
  }
  if (input.engagement.durationMinutes) {
    score += Math.min(
      input.engagement.durationMinutes * config.timeSpentPerMinute,
      20,
    );
  }
  score += input.engagement.voiceInteractions * config.voiceInteractions;
  score += Math.min(input.engagement.questionsAsked * config.conversationDepth, 15);

  return Math.min(100, Math.round(score));
}

export function getIntentLevel(score: number): BuyerIntentLevel {
  if (score >= INTENT_THRESHOLDS.ready_to_act) return "ready_to_act";
  if (score >= INTENT_THRESHOLDS.very_interested) return "very_interested";
  if (score >= INTENT_THRESHOLDS.interested) return "interested";
  return "exploring";
}

export function formatIntentLabel(level: BuyerIntentLevel): string {
  const labels: Record<BuyerIntentLevel, string> = {
    exploring: "Exploring",
    interested: "Interested",
    very_interested: "Very Interested",
    ready_to_act: "Ready to Act",
  };
  return labels[level];
}
