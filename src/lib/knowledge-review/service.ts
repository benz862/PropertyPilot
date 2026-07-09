import type { KnowledgeFact } from "@/lib/property-twin/types";

import type { ConfidenceBand, KnowledgeReviewItemType, ProposedFact } from "./types";

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 100) return "verified";
  if (confidence >= 95) return "high";
  if (confidence >= 80) return "medium";
  if (confidence >= 40) return "manual_review";
  return "never_auto_approve";
}

export function shouldRequireManualReview(confidence: number): boolean {
  return confidence < 70;
}

export function classifyReviewItem(
  proposed: ProposedFact,
  existingFacts: KnowledgeFact[],
): KnowledgeReviewItemType {
  const sameKeyFacts = existingFacts.filter((fact) => fact.factKey === proposed.factKey);
  if (sameKeyFacts.length === 0) return "new_fact";

  const normalized = normalizeFactValue(proposed.proposedValue);
  if (sameKeyFacts.some((fact) => normalizeFactValue(fact.factValue) === normalized)) {
    return "duplicate";
  }

  if (sameKeyFacts.some((fact) => fact.verificationLevel === "verified")) {
    return "conflict";
  }

  return "updated_fact";
}

export function groupReviewItems<T extends { assetId: string | null; itemType: string; confidence: number }>(
  items: T[],
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const band = getConfidenceBand(item.confidence);
    const key = `${item.assetId ?? "unassigned"}:${item.itemType}:${band}`;
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function normalizeFactValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
