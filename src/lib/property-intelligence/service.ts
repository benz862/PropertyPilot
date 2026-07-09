import type { MlsExtractionResult } from "@/lib/property-builder/types";
import type {
  DocumentIntelligenceResult,
  PhotoIntelligenceResult,
  PropertyProfile,
  VoiceNoteIntelligenceResult,
} from "@/lib/property-twin/types";

import {
  extractDisclosureSensitivePhrases,
  extractExteriorPhrases,
  extractFeaturePhrases,
  extractLotPhrases,
  extractNeighborhoodPhrases,
  extractRoomFacts,
  extractUpgradePhrases,
  normalizeText,
} from "./text-extraction";
import type { AttributedFact, IntelligenceRoom, PropertyIntelligence, SourceMapEntry } from "./types";

export interface PhotoIntelligenceSource {
  id: string;
  storagePath: string;
  result: PhotoIntelligenceResult;
}

export interface DocumentIntelligenceSource {
  id: string;
  title: string;
  storagePath: string;
  result: DocumentIntelligenceResult;
}

export interface VoiceIntelligenceSource {
  id?: string;
  transcript: string;
  result: VoiceNoteIntelligenceResult;
}

export interface BuildPropertyIntelligenceInput {
  profile: PropertyProfile;
  mls?: MlsExtractionResult;
  photos?: PhotoIntelligenceSource[];
  documents?: DocumentIntelligenceSource[];
  voiceNotes?: VoiceIntelligenceSource[];
  issues?: string[];
}

export function buildPropertyIntelligence(
  input: BuildPropertyIntelligenceInput,
): PropertyIntelligence {
  const facts: AttributedFact[] = [];
  const roomMap = new Map<string, IntelligenceRoom & { sources: Set<string> }>();
  const missingInformation = new Set(input.issues ?? []);

  addManualPropertyFacts(input.profile, facts, roomMap);
  addMlsFacts(input.mls, facts, roomMap);
  addPhotoFacts(input.photos ?? [], facts, roomMap, missingInformation);
  addDocumentFacts(input.documents ?? [], facts, roomMap, missingInformation);
  addVoiceFacts(input.voiceNotes ?? [], facts, roomMap, missingInformation);

  if ((input.photos ?? []).length === 0) missingInformation.add("No property photos uploaded.");
  if ((input.documents ?? []).length === 0) missingInformation.add("No supporting documents uploaded.");
  if ((input.voiceNotes ?? []).length === 0) missingInformation.add("No agent voice-note transcript captured.");

  const keyFeatures = uniqueValues(facts.filter((fact) => fact.field === "keyFeatures").map((fact) => fact.value));
  const upgrades = uniqueValues(facts.filter((fact) => fact.field === "upgrades").map((fact) => fact.value));
  const exteriorFeatures = uniqueValues(
    facts.filter((fact) => fact.field === "exteriorFeatures").map((fact) => fact.value),
  );
  const lotFeatures = uniqueValues(facts.filter((fact) => fact.field === "lotFeatures").map((fact) => fact.value));
  const neighborhoodNotes = uniqueValues(
    facts.filter((fact) => fact.field === "neighborhoodNotes").map((fact) => fact.value),
  );

  const propertySummary = buildSummary(input.profile, input.mls, keyFeatures);
  addFact(facts, "propertySummary", propertySummary, ["manual property field", input.mls ? "MLS upload" : null]);

  const possibleBuyerQuestions = buildBuyerQuestions({
    keyFeatures,
    upgrades,
    rooms: Array.from(roomMap.values()),
    documents: input.documents ?? [],
  });

  const agentTalkingPoints = uniqueValues([
    ...keyFeatures.slice(0, 5),
    ...upgrades.slice(0, 5),
    ...exteriorFeatures.slice(0, 3),
  ]);

  const disclosureNotes = input.voiceNotes?.flatMap((voice) =>
    extractDisclosureSensitivePhrases(voice.transcript),
  ) ?? [];
  for (const note of disclosureNotes) {
    missingInformation.add(`Review disclosure-sensitive voice note: ${note}`);
  }

  return {
    propertySummary,
    keyFeatures,
    upgrades,
    rooms: Array.from(roomMap.values()).map((room) => ({
      name: room.name,
      features: room.features,
      condition: room.condition,
    })),
    exteriorFeatures,
    lotFeatures,
    neighborhoodNotes,
    possibleBuyerQuestions,
    agentTalkingPoints,
    missingInformation: Array.from(missingInformation),
    sourceMap: buildSourceMap(facts, roomMap),
  };
}

function addManualPropertyFacts(
  profile: PropertyProfile,
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
) {
  const source = "manual property field";
  if (profile.bedrooms != null) addFact(facts, "keyFeatures", `${profile.bedrooms} bedrooms`, [source]);
  if (profile.bathrooms != null) addFact(facts, "keyFeatures", `${profile.bathrooms} bathrooms`, [source]);
  if (profile.finishedSquareFeet != null) {
    addFact(facts, "keyFeatures", `${profile.finishedSquareFeet.toLocaleString()} finished square feet`, [source]);
  }
  if (profile.yearBuilt != null) addFact(facts, "keyFeatures", `Built in ${profile.yearBuilt}`, [source]);
  if (profile.publicRemarks) addTextDerivedFacts(profile.publicRemarks, source, facts, roomMap);
}

function addMlsFacts(
  mls: MlsExtractionResult | undefined,
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
) {
  if (!mls) return;
  const source = "MLS upload";
  for (const feature of mls.fields.features ?? []) addFact(facts, "keyFeatures", feature, [source]);
  for (const room of mls.fields.rooms ?? []) addRoomFeature(room, "Listed in MLS room data", source, roomMap);
  if (mls.fields.schoolDistrict) {
    addFact(facts, "neighborhoodNotes", `School district: ${mls.fields.schoolDistrict}`, [source]);
  }
  if (mls.fields.publicRemarks) addTextDerivedFacts(mls.fields.publicRemarks, source, facts, roomMap);
  if (mls.rawText) addTextDerivedFacts(mls.rawText, source, facts, roomMap);
}

function addPhotoFacts(
  photos: PhotoIntelligenceSource[],
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
  missingInformation: Set<string>,
) {
  for (const photo of photos) {
    const source = `photo:${photo.storagePath}`;
    const result = photo.result;

    if (result.detectedRoom) {
      addRoomFeature(result.detectedRoom, result.caption ?? "Visible in uploaded photo", source, roomMap);
    }
    for (const feature of result.detectedFeatures) addFact(facts, "keyFeatures", feature, [source]);
    for (const object of result.detectedObjects) addFact(facts, "keyFeatures", object, [source]);
    for (const suggested of result.suggestedKnowledgeObjects) {
      addFact(facts, "keyFeatures", suggested.name, [source]);
    }
    if (!result.detectedRoom && result.detectedFeatures.length === 0 && result.detectedObjects.length === 0) {
      missingInformation.add(`Photo could not be interpreted: ${photo.storagePath}`);
    }
  }
}

function addDocumentFacts(
  documents: DocumentIntelligenceSource[],
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
  missingInformation: Set<string>,
) {
  for (const document of documents) {
    const source = `document:${document.storagePath}`;
    const text = typeof document.result.rawExtracted.extractedText === "string"
      ? document.result.rawExtracted.extractedText
      : "";

    for (const note of document.result.maintenanceNotes) addFact(facts, "upgrades", note, [source]);
    for (const recommendation of document.result.recommendations) {
      addFact(facts, "agentTalkingPoints", recommendation, [source]);
    }
    if (text) {
      addTextDerivedFacts(text, source, facts, roomMap);
    } else {
      missingInformation.add(`No extractable text found in document: ${document.title}`);
    }
    if (document.result.requiresReview) {
      missingInformation.add(`Review extracted document facts: ${document.title}`);
    }
  }
}

function addVoiceFacts(
  voices: VoiceIntelligenceSource[],
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
  missingInformation: Set<string>,
) {
  for (const voice of voices) {
    const source = voice.id ? `voice note:${voice.id}` : "voice note transcript";
    addTextDerivedFacts(voice.transcript, source, facts, roomMap);
    for (const object of voice.result.knowledgeObjects) {
      addFact(facts, "agentTalkingPoints", object.summary, [source]);
      addFact(facts, "keyFeatures", object.name, [source]);
    }
    for (const item of voice.result.missingInformation) missingInformation.add(item);
  }
}

function addTextDerivedFacts(
  text: string,
  source: string,
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
) {
  for (const feature of extractFeaturePhrases(text)) addFact(facts, "keyFeatures", feature, [source]);
  for (const upgrade of extractUpgradePhrases(text)) addFact(facts, "upgrades", upgrade, [source]);
  for (const exterior of extractExteriorPhrases(text)) addFact(facts, "exteriorFeatures", exterior, [source]);
  for (const lot of extractLotPhrases(text)) addFact(facts, "lotFeatures", lot, [source]);
  for (const note of extractNeighborhoodPhrases(text)) addFact(facts, "neighborhoodNotes", note, [source]);
  for (const room of extractRoomFacts(text)) {
    for (const feature of room.features) addRoomFeature(room.name, feature, source, roomMap);
  }
}

function addRoomFeature(
  roomName: string,
  feature: string,
  source: string,
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
) {
  const name = titleCase(roomName);
  const key = name.toLowerCase();
  const existing = roomMap.get(key) ?? { name, features: [], sources: new Set<string>() };
  if (!existing.features.some((item) => item.toLowerCase() === feature.toLowerCase())) {
    existing.features.push(feature);
  }
  existing.sources.add(source);
  roomMap.set(key, existing);
}

function addFact(
  facts: AttributedFact[],
  field: AttributedFact["field"],
  value: string,
  sources: Array<string | null>,
) {
  const cleaned = normalizeText(value);
  if (!cleaned) return;
  facts.push({ field, value: cleaned, sources: sources.filter((source): source is string => Boolean(source)) });
}

function buildSummary(
  profile: PropertyProfile,
  mls: MlsExtractionResult | undefined,
  keyFeatures: string[],
): string {
  const basics = [
    `${profile.street}, ${profile.city}`,
    profile.bedrooms != null && profile.bathrooms != null ? `${profile.bedrooms} bed / ${profile.bathrooms} bath` : null,
    profile.finishedSquareFeet != null ? `${profile.finishedSquareFeet.toLocaleString()} finished sq ft` : null,
    profile.yearBuilt != null ? `built ${profile.yearBuilt}` : null,
  ].filter(Boolean);

  const remarks = mls?.fields.publicRemarks ?? profile.publicRemarks;
  if (remarks) return normalizeText(remarks).slice(0, 500);

  const featureText = keyFeatures.length ? ` Noted features include ${keyFeatures.slice(0, 4).join(", ")}.` : "";
  return `${basics.join(" · ")}.${featureText}`.trim();
}

function buildBuyerQuestions(input: {
  keyFeatures: string[];
  upgrades: string[];
  rooms: IntelligenceRoom[];
  documents: DocumentIntelligenceSource[];
}): string[] {
  const questions = new Set<string>();
  if (input.upgrades.length) questions.add("Which updates were completed, and when?");
  if (input.documents.length) questions.add("Which documents are available for buyer review?");
  for (const room of input.rooms.slice(0, 4)) questions.add(`What should buyers know about the ${room.name.toLowerCase()}?`);
  for (const feature of input.keyFeatures.slice(0, 4)) questions.add(`Can you tell me more about ${feature}?`);
  return Array.from(questions).slice(0, 10);
}

function buildSourceMap(
  facts: AttributedFact[],
  roomMap: Map<string, IntelligenceRoom & { sources: Set<string> }>,
): SourceMapEntry[] {
  const sourcesByField = new Map<string, Set<string>>();

  for (const fact of facts) {
    const key = `${fact.field}:${fact.value}`;
    const existing = sourcesByField.get(key) ?? new Set<string>();
    fact.sources.forEach((source) => existing.add(source));
    sourcesByField.set(key, existing);
  }

  for (const room of roomMap.values()) {
    const key = `rooms:${room.name}`;
    const existing = sourcesByField.get(key) ?? new Set<string>();
    room.sources.forEach((source) => existing.add(source));
    sourcesByField.set(key, existing);
  }

  return Array.from(sourcesByField.entries()).map(([field, sources]) => ({
    field,
    sources: Array.from(sources),
  }));
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }

  return unique.slice(0, 20);
}

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
