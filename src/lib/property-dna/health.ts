import type { PropertyDNA, PropertyDNAHealth } from "./types";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Rule-based Property DNA scoring. Reads only from the assembled DNA object so
 * every engine and UI surface shares one definition of "how complete is this
 * property".
 */
export function computeDnaHealth(dna: PropertyDNA): PropertyDNAHealth {
  const missingInformation = collectMissingInformation(dna);

  const knowledgeScore = clamp(computeKnowledgeScore(dna));
  const marketingScore = clamp(computeMarketingScore(dna));
  const buyerReadinessScore = clamp(computeBuyerReadinessScore(dna));

  return {
    knowledgeScore,
    marketingScore,
    buyerReadinessScore,
    missingInformation,
    recommendations: [],
  };
}

function computeKnowledgeScore(dna: PropertyDNA): number {
  const basicFields = [
    dna.basic.address,
    dna.basic.price,
    dna.basic.beds,
    dna.basic.baths,
    dna.basic.squareFeet,
    dna.basic.yearBuilt,
    dna.basic.propertyType,
  ];
  const basicFilled = basicFields.filter((value) => value !== null && value !== undefined && value !== "").length;
  const basicScore = (basicFilled / basicFields.length) * 100;

  const systemsCount = Object.values(dna.systems).filter(Boolean).length;
  const systemsScore = (Math.min(systemsCount, 5) / 5) * 100;

  const roomsWithContent = dna.rooms.filter(
    (room) => room.features.length > 0 || room.description || room.buyerTalkingPoints.length > 0,
  ).length;
  const roomsScore = (Math.min(roomsWithContent, 5) / 5) * 100;

  const evidenceScore = Math.min(dna.documents.length + dna.voiceNotes.length, 4) / 4 * 100;

  return basicScore * 0.35 + systemsScore * 0.25 + roomsScore * 0.25 + evidenceScore * 0.15;
}

function computeMarketingScore(dna: PropertyDNA): number {
  const hasSummary = Boolean(dna.basic.summary && dna.basic.summary.length > 40);
  const hasDescription = Boolean(dna.basic.mlsDescription);
  const hasPhotos = dna.photos.length > 0;
  const hasEnoughPhotos = dna.photos.length >= 6;
  const hasHero = Boolean(dna.meta.heroImageUrl) || dna.photos.some((photo) => photo.isPrimary);
  const hasAssets = dna.generatedAssets.length > 0;

  return (
    (hasSummary ? 25 : 0) +
    (hasDescription ? 15 : 0) +
    (hasPhotos ? 15 : 0) +
    (hasEnoughPhotos ? 15 : 0) +
    (hasHero ? 10 : 0) +
    (hasAssets ? 20 : 0)
  );
}

function computeBuyerReadinessScore(dna: PropertyDNA): number {
  const isPublished = dna.meta.publishStatus === "published" || Boolean(dna.meta.publishedAt);
  const hasRooms = dna.rooms.some((room) => room.id !== null);
  const hasAgent = Boolean(dna.meta.agentName || dna.meta.agentEmail || dna.meta.agentPhone);

  const answered = dna.buyerQuestions.filter((question) => !question.needsAgentFollowup).length;
  const total = dna.buyerQuestions.length;
  const answerRate = total === 0 ? 100 : (answered / total) * 100;

  return (
    (isPublished ? 30 : 0) +
    (hasRooms ? 25 : 0) +
    (hasAgent ? 15 : 0) +
    answerRate * 0.3
  );
}

function collectMissingInformation(dna: PropertyDNA): string[] {
  const missing = new Set<string>(dna.health.missingInformation ?? []);

  if (!dna.systems.roof) missing.add("Roof age or condition missing.");
  if (!dna.systems.hvac) missing.add("HVAC age or condition missing.");
  if (!dna.systems.waterHeater) missing.add("Water heater details missing.");
  if (!dna.systems.water || !dna.systems.sewer) missing.add("Water/sewer details missing.");
  if (!dna.systems.internet) missing.add("Internet provider missing.");
  if (dna.exterior.pool && !dna.exterior.pool.value.match(/\d{4}|age|year/i)) {
    missing.add("Pool age/details missing.");
  }
  if (dna.photos.length === 0) missing.add("No property photos uploaded.");
  if (!dna.rooms.some((room) => room.id !== null)) missing.add("Room-specific buyer knowledge missing.");
  if (dna.meta.publishStatus !== "published" && !dna.meta.publishedAt) missing.add("No QR tour published.");
  if (dna.basic.price == null) missing.add("Listing price missing.");
  if (dna.basic.yearBuilt == null) missing.add("Year built missing.");

  return Array.from(missing);
}
