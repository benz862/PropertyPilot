import type {
  PropertyCompletenessScore,
  PropertyProfile,
} from "@/lib/property-twin/types";

import type { PhotoCoverageMap, PropertyQualityScore, QualityRating } from "./types";

interface QualityInput {
  completeness: PropertyCompletenessScore;
  photoCoverage: PhotoCoverageMap;
  knowledgeObjectCount: number;
  voiceNoteCount: number;
  hasVoicePersonality: boolean;
  hasAiPolicy: boolean;
  poiCount: number;
  verifiedFactRatio: number;
}

export function calculatePropertyQuality(input: QualityInput): PropertyQualityScore {
  const knowledgeHealth = scoreKnowledge(input.knowledgeObjectCount);
  const photoCoverage = input.photoCoverage.overallCoverage;
  const verificationHealth = Math.round(input.verifiedFactRatio * 100);
  const voiceReadiness = input.hasVoicePersonality ? 80 : 20;
  const aiReadiness = Math.round(
    (input.hasVoicePersonality ? 40 : 0) +
      (input.hasAiPolicy ? 30 : 0) +
      (input.poiCount > 0 ? 30 : 0),
  );
  const buyerExperienceScore = Math.round(
    (photoCoverage * 0.3 + aiReadiness * 0.4 + input.completeness.overall * 0.3),
  );
  const publishingReadiness = input.completeness.overall;

  const overall = Math.round(
    input.completeness.overall * 0.5 +
      knowledgeHealth * 0.15 +
      photoCoverage * 0.15 +
      verificationHealth * 0.1 +
      aiReadiness * 0.1,
  );

  const rating = getQualityRating(overall);
  const missingCount = input.completeness.missingItems.length + input.photoCoverage.missingRooms.length;

  return {
    overall,
    rating,
    label: formatRatingLabel(rating),
    explanation: buildExplanation(rating, input.completeness.missingItems),
    estimatedMinutesToComplete: Math.max(5, missingCount * 3),
    health: {
      propertyHealth: input.completeness.breakdown.corePropertyData,
      knowledgeHealth,
      photoCoverage,
      verificationHealth,
      aiReadiness,
      buyerExperienceScore,
      voiceReadiness,
      publishingReadiness,
    },
  };
}

function scoreKnowledge(count: number): number {
  return Math.min(100, Math.round((count / 5) * 100));
}

function getQualityRating(score: number): QualityRating {
  if (score >= 90) return "excellent";
  if (score >= 80) return "very_good";
  if (score >= 65) return "good";
  if (score >= 45) return "needs_improvement";
  return "incomplete";
}

function formatRatingLabel(rating: QualityRating): string {
  return rating
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildExplanation(rating: QualityRating, missingItems: string[]): string {
  if (rating === "excellent") {
    return "This property twin is ready for publishing with strong coverage across knowledge, photos, and verification.";
  }
  if (missingItems.length === 0) {
    return "Add more photos and voice notes to strengthen the buyer experience.";
  }
  const top = missingItems.slice(0, 3).join("; ");
  return `To improve: ${top}.`;
}

export function mapSuggestionPriority(priority: number): "critical" | "important" | "optional" {
  if (priority >= 85) return "critical";
  if (priority >= 65) return "important";
  return "optional";
}

export function generatePropertySummary(profile: PropertyProfile): string {
  const parts = [
    profile.street,
    profile.city,
    profile.bedrooms != null ? `${profile.bedrooms} bed` : null,
    profile.bathrooms != null ? `${profile.bathrooms} bath` : null,
    profile.finishedSquareFeet != null ? `${profile.finishedSquareFeet} sq ft` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
