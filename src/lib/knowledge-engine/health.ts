import type { KnowledgeFact, KnowledgeObject, KnowledgeRelationship } from "@/lib/property-twin/types";

import type { KnowledgeHealthScore } from "./types";
import { detectConflictingFacts } from "./validation";

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreRatio(actual: number, target: number): number {
  if (target <= 0) return 100;
  return clampPercent((actual / target) * 100);
}

export function calculateKnowledgeHealth(input: {
  objects: KnowledgeObject[];
  facts: KnowledgeFact[];
  relationships: KnowledgeRelationship[];
  documentCount: number;
  photoCount: number;
  timelineCount: number;
  targetObjects?: number;
}): KnowledgeHealthScore {
  const targetObjects = input.targetObjects ?? 8;
  const knowledgeCoverage = scoreRatio(input.objects.length, targetObjects);

  const verifiedFacts = input.facts.filter(
    (f) => f.verificationLevel === "verified" || f.verificationLevel === "likely",
  );
  const verificationScore =
    input.facts.length === 0
      ? 0
      : clampPercent((verifiedFacts.length / input.facts.length) * 100);

  const conflicts = detectConflictingFacts(input.facts);
  const conflictScore =
    input.facts.length === 0
      ? 100
      : clampPercent(100 - (conflicts.length / input.facts.length) * 100);

  const maxRelationships = Math.max(input.objects.length, 1);
  const relationshipScore = scoreRatio(input.relationships.length, maxRelationships);

  const documentCoverage = scoreRatio(input.documentCount, 3);
  const photoCoverage = scoreRatio(input.photoCount, 8);
  const timelineCoverage = scoreRatio(input.timelineCount, 3);

  const overall = Math.round(
    knowledgeCoverage * 0.2 +
      verificationScore * 0.2 +
      conflictScore * 0.1 +
      relationshipScore * 0.1 +
      documentCoverage * 0.1 +
      photoCoverage * 0.15 +
      timelineCoverage * 0.15,
  );

  const missingItems: string[] = [];
  if (input.objects.length < 5) missingItems.push("Add more knowledge objects");
  if (verifiedFacts.length < input.facts.length * 0.5) {
    missingItems.push("Verify pending facts");
  }
  if (input.documentCount < 2) missingItems.push("Upload inspection or warranty documents");
  if (input.photoCount < 6) missingItems.push("Add room and exterior photos");
  if (input.timelineCount < 2) missingItems.push("Record property timeline events");
  if (conflicts.length > 0) missingItems.push("Resolve conflicting facts");

  const suggestions: string[] = [];
  if (conflicts.length > 0) {
    suggestions.push(`Resolve ${conflicts.length} conflicting fact(s).`);
  }
  if (input.relationships.length < input.objects.length / 2) {
    suggestions.push("Link related knowledge objects in the graph.");
  }

  return {
    overall,
    knowledgeCoverage,
    verificationScore,
    conflictScore,
    relationshipScore,
    documentCoverage,
    photoCoverage,
    timelineCoverage,
    missingItems,
    suggestions,
  };
}
