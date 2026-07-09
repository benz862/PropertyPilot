import type { PropertyTwinContext } from "@/types/database";

export type HealthStatus = "ready" | "needs-review" | "incomplete";

export interface PropertyHealthBreakdown {
  knowledgeCompleteness: number;
  knowledgeVerification: number;
  assetCoverage: number;
  photography: number;
  voiceDocumentation: number;
  maintenanceHistory: number;
  timelineCompleteness: number;
  buyerQuestionsAnswered: number;
  marketingReadiness: number;
  accessibility: number;
  documentCoverage: number;
  knowledgeFreshness: number;
}

export interface PropertyHealthScore {
  total: number;
  status: HealthStatus;
  breakdown: PropertyHealthBreakdown;
  label: string;
}

const WEIGHTS = {
  knowledgeCompleteness: 20,
  knowledgeVerification: 15,
  assetCoverage: 10,
  photography: 10,
  voiceDocumentation: 10,
  maintenanceHistory: 10,
  timelineCompleteness: 5,
  buyerQuestionsAnswered: 10,
  marketingReadiness: 5,
  accessibility: 5,
  documentCoverage: 5,
  knowledgeFreshness: 5,
} as const;

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreCount(actual: number, target: number): number {
  if (target <= 0) return 100;
  return clampPercent((actual / target) * 100);
}

function getHealthStatus(total: number): HealthStatus {
  if (total >= 90) return "ready";
  if (total >= 60) return "needs-review";
  return "incomplete";
}

function getHealthLabel(status: HealthStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "needs-review":
      return "Needs Review";
    case "incomplete":
      return "Incomplete";
  }
}

export function calculatePropertyHealth(
  context: PropertyTwinContext,
  voiceNotesCount = 0,
): PropertyHealthScore {
  const { property, knowledgeObjects, systems, appliances, photos, documents, pointsOfInterest } =
    context;
  const timeline = getOptionalTimeline(context);

  const requiredFields = [
    property.street,
    property.city,
    property.province_state,
    property.postal_code,
    property.property_type,
    property.bedrooms,
    property.bathrooms,
    property.finished_sq_ft,
  ];
  const filledFields = requiredFields.filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;
  const propertyInformation = clampPercent((filledFields / requiredFields.length) * 100);
  const documentedSystems = systems.length + appliances.length;

  const verifiedCount = knowledgeObjects.filter(
    (ko) => ko.confidence_level === "high" || ko.confidence_level === "medium",
  ).length;
  const knowledgeVerification =
    knowledgeObjects.length === 0
      ? 0
      : clampPercent((verifiedCount / knowledgeObjects.length) * 100);

  const knowledgeCompleteness = clampPercent(
    (scoreCount(knowledgeObjects.length, 8) * 0.5) +
      (propertyInformation * 0.25) +
      (scoreCount(documentedSystems, 6) * 0.25),
  );
  const assetCoverage = scoreCount(pointsOfInterest.length, 6);
  const photography = scoreCount(photos.length, 10);
  const voiceDocumentation = scoreCount(voiceNotesCount, 3);
  const maintenanceHistory = scoreCount(
    knowledgeObjects.filter((ko) => ["maintenance", "renovations"].includes(ko.category ?? "")).length,
    3,
  );
  const timelineCompleteness = scoreCount(timeline.length, 3);
  const buyerQuestionsAnswered = 100;
  const hasVoice = context.voicePersonality !== null;
  const hasPolicy = context.aiPolicy !== null;
  const hasPois = pointsOfInterest.length > 0;
  const marketingReadiness = clampPercent(
    ((hasVoice ? 25 : 0) + (hasPolicy ? 25 : 0) + (hasPois ? 25 : 0) + (photos.length >= 6 ? 25 : 0)),
  );
  const accessibility = context.photos.every((photo) => photo.caption || photo.ai_description) ? 100 : 50;
  const documentCoverage = scoreCount(documents.length, 4);
  const knowledgeFreshness = voiceNotesCount > 0 || knowledgeObjects.length > 0 ? 80 : 0;

  const breakdown: PropertyHealthBreakdown = {
    knowledgeCompleteness,
    knowledgeVerification,
    assetCoverage,
    photography,
    voiceDocumentation,
    maintenanceHistory,
    timelineCompleteness,
    buyerQuestionsAnswered,
    marketingReadiness,
    accessibility,
    documentCoverage,
    knowledgeFreshness,
  };

  const weighted = Object.entries(breakdown).reduce((sum, [key, percent]) => {
    const weight = WEIGHTS[key as keyof PropertyHealthBreakdown];
    return sum + (percent / 100) * weight;
  }, 0);
  const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const total = Math.round(
    (weighted / totalWeight) * 100,
  );

  const status = getHealthStatus(total);

  return {
    total,
    status,
    breakdown,
    label: getHealthLabel(status),
  };
}

function getOptionalTimeline(context: PropertyTwinContext): unknown[] {
  if ("timeline" in context && Array.isArray(context.timeline)) {
    return context.timeline;
  }
  return [];
}

export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case "ready":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "needs-review":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "incomplete":
      return "text-red-700 bg-red-50 border-red-200";
  }
}
