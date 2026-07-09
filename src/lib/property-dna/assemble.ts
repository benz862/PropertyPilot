import type { PropertyIntelligence } from "@/lib/property-intelligence";

import { computeDnaHealth } from "./health";
import type {
  Confidence,
  Fact,
  GeneratedAssetRecord,
  PropertyDNA,
  PropertyDNABuyerQuestion,
  PropertyDNADocument,
  PropertyDNAExterior,
  PropertyDNANeighborhood,
  PropertyDNAPhoto,
  PropertyDNARoom,
  PropertyDNASystems,
  PropertyDNAVoiceNote,
  SourceRef,
} from "./types";

export interface DNAPropertyInput {
  id: string;
  slug?: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  provinceState?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  propertyType?: string | null;
  schoolDistrict?: string | null;
  mlsDescription?: string | null;
  description?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  heroImageUrl?: string | null;
}

export interface DNARoomInput {
  id: string | null;
  name: string;
  description?: string | null;
  features?: unknown[];
  updates?: unknown[];
  includedItems?: unknown[];
  talkingPoints?: unknown[];
  cautions?: unknown[];
}

export interface DNAKnowledgeInput {
  id: string;
  name: string;
  category?: string | null;
  summary?: string | null;
  verifiedFacts?: unknown[];
}

export interface DNADocumentInput {
  id: string;
  title: string;
  storagePath?: string | null;
  documentType?: string | null;
  extractedText?: string | null;
  summary?: string | null;
}

export interface DNAVoiceNoteInput {
  id: string;
  transcript: string;
}

export interface DNAPhotoInput {
  id: string;
  storagePath?: string | null;
  caption?: string | null;
  detectedRoom?: string | null;
  isPrimary?: boolean;
  detectedFeatures?: unknown[];
}

export interface DNABuyerQuestionInput {
  id: string;
  selectedRoom?: string | null;
  question: string;
  normalizedQuestion?: string | null;
  answer?: string | null;
  confidence?: string | null;
  needsAgentFollowup?: boolean;
  createdAt: string;
}

export interface AssemblePropertyDNAInput {
  property: DNAPropertyInput;
  intelligence?: PropertyIntelligence | null;
  intelligenceUpdatedAt?: string | null;
  rooms?: DNARoomInput[];
  knowledgeObjects?: DNAKnowledgeInput[];
  documents?: DNADocumentInput[];
  voiceNotes?: DNAVoiceNoteInput[];
  photos?: DNAPhotoInput[];
  buyerQuestions?: DNABuyerQuestionInput[];
  generatedAssets?: GeneratedAssetRecord[];
  dnaVersion?: number;
}

interface Corpus {
  text: string;
  lower: string;
  sourceRef: SourceRef;
}

const SYSTEM_KEYWORDS: Record<keyof PropertyDNASystems, string[]> = {
  roof: ["roof", "shingle", "re-roof", "reroof"],
  hvac: ["hvac", "furnace", "air conditioning", "air conditioner", "a/c ", "heat pump", "central air"],
  electrical: ["electrical", "electric panel", "breaker", "wiring", "amp service", "panel"],
  plumbing: ["plumbing", "pipes", "repipe", "re-pipe"],
  waterHeater: ["water heater", "tankless", "hot water tank"],
  sewer: ["sewer", "septic", "septic tank"],
  water: ["well water", "city water", "municipal water", "water supply"],
  internet: ["internet", "fiber", "fibre", "broadband", "gigabit"],
  naturalGas: ["natural gas", "gas line", "gas furnace", "gas range"],
};

const EXTERIOR_KEYWORDS = {
  garage: ["garage", "carport"],
  pool: ["pool", "hot tub", "spa"],
  patioDeck: ["patio", "deck", "porch", "veranda"],
  landscaping: ["landscap", "garden", "yard", "lawn", "irrigation", "sprinkler"],
} as const;

const NEIGHBORHOOD_KEYWORDS = {
  shopping: ["shopping", "mall", "grocery", "store", "retail"],
  restaurants: ["restaurant", "dining", "cafe", "coffee"],
  parks: ["park", "trail", "greenspace", "playground"],
  commute: ["commute", "highway", "transit", "freeway", "subway", "downtown", "minutes to"],
} as const;

export function assemblePropertyDNA(input: AssemblePropertyDNAInput): PropertyDNA {
  const { property } = input;
  const intelligence = input.intelligence ?? null;
  const corpus = buildCorpus(input);

  const rooms = mergeRooms(input.rooms ?? [], intelligence);
  const systems = deriveSystems(corpus);
  const exterior = deriveExterior(intelligence, corpus);
  const neighborhood = deriveNeighborhood(property, intelligence, corpus);
  const documents = mapDocuments(input.documents ?? []);
  const voiceNotes = mapVoiceNotes(input.voiceNotes ?? []);
  const photos = mapPhotos(input.photos ?? []);
  const buyerQuestions = mapBuyerQuestions(input.buyerQuestions ?? []);

  const basic = {
    address: property.address ?? formatAddress(property),
    slug: property.slug ?? undefined,
    price: property.price ?? null,
    beds: property.beds ?? null,
    baths: property.baths ?? null,
    squareFeet: property.squareFeet ?? null,
    lotSize: property.lotSize ?? null,
    yearBuilt: property.yearBuilt ?? null,
    propertyType: property.propertyType ?? null,
    schoolDistrict: property.schoolDistrict ?? null,
    mlsDescription: property.mlsDescription ?? property.description ?? null,
    summary: intelligence?.propertySummary ?? property.description ?? property.mlsDescription ?? formatAddress(property),
  };

  const dna: PropertyDNA = {
    propertyId: property.id,
    basic,
    rooms,
    systems,
    exterior,
    neighborhood,
    documents,
    voiceNotes,
    photos,
    buyerQuestions,
    health: {
      knowledgeScore: 0,
      marketingScore: 0,
      buyerReadinessScore: 0,
      missingInformation: intelligence?.missingInformation ?? [],
      recommendations: [],
    },
    generatedAssets: input.generatedAssets ?? [],
    meta: {
      publishStatus: property.status ?? "draft",
      publishedAt: property.publishedAt ?? null,
      agentName: property.agentName ?? null,
      agentEmail: property.agentEmail ?? null,
      agentPhone: property.agentPhone ?? null,
      heroImageUrl: property.heroImageUrl ?? null,
      intelligenceUpdatedAt: input.intelligenceUpdatedAt ?? null,
      dnaVersion: input.dnaVersion ?? 1,
    },
  };

  dna.health = computeDnaHealth(dna);
  return dna;
}

function buildCorpus(input: AssemblePropertyDNAInput): Corpus[] {
  const corpus: Corpus[] = [];
  const add = (text: string | null | undefined, sourceRef: SourceRef) => {
    const cleaned = (text ?? "").trim();
    if (cleaned) corpus.push({ text: cleaned, lower: cleaned.toLowerCase(), sourceRef });
  };

  const intel = input.intelligence;
  if (intel) {
    for (const feature of intel.keyFeatures) add(feature, { sourceType: "system", label: "Property intelligence" });
    for (const upgrade of intel.upgrades) add(upgrade, { sourceType: "system", label: "Property intelligence" });
    for (const exterior of intel.exteriorFeatures) add(exterior, { sourceType: "system", label: "Property intelligence" });
    for (const lot of intel.lotFeatures) add(lot, { sourceType: "system", label: "Property intelligence" });
    for (const note of intel.neighborhoodNotes) add(note, { sourceType: "system", label: "Property intelligence" });
    add(intel.propertySummary, { sourceType: "system", label: "Property intelligence" });
  }

  for (const doc of input.documents ?? []) {
    add(doc.extractedText ?? doc.summary, { sourceType: "document", sourceId: doc.id, label: doc.title });
  }
  for (const voice of input.voiceNotes ?? []) {
    add(voice.transcript, { sourceType: "voice_note", sourceId: voice.id, label: "Voice note" });
  }
  for (const ko of input.knowledgeObjects ?? []) {
    add(ko.summary, { sourceType: "knowledge", sourceId: ko.id, label: ko.name });
    for (const fact of extractFactStrings(ko.verifiedFacts)) {
      add(fact, { sourceType: "knowledge", sourceId: ko.id, label: ko.name });
    }
  }
  for (const room of input.rooms ?? []) {
    const roomText = [room.description, ...stringArray(room.features), ...stringArray(room.updates)].filter(Boolean).join(". ");
    add(roomText, { sourceType: "manual", sourceId: room.id ?? undefined, label: `Room: ${room.name}` });
  }
  add(input.property.mlsDescription, { sourceType: "mls", label: "MLS" });
  add(input.property.description, { sourceType: "manual", label: "Listing details" });

  return corpus;
}

function deriveSystems(corpus: Corpus[]): PropertyDNASystems {
  const systems: PropertyDNASystems = {};
  (Object.keys(SYSTEM_KEYWORDS) as Array<keyof PropertyDNASystems>).forEach((key) => {
    const fact = firstMatchFact(corpus, SYSTEM_KEYWORDS[key], humanizeKey(key));
    if (fact) systems[key] = fact;
  });
  return systems;
}

function deriveExterior(intelligence: PropertyIntelligence | null, corpus: Corpus[]): PropertyDNAExterior {
  const exterior: PropertyDNAExterior = {
    features: (intelligence?.exteriorFeatures ?? []).map((value) =>
      toFact("Exterior feature", value, { sourceType: "system", label: "Property intelligence" }),
    ),
    lotFeatures: (intelligence?.lotFeatures ?? []).map((value) =>
      toFact("Lot feature", value, { sourceType: "system", label: "Property intelligence" }),
    ),
  };

  const garage = firstMatchFact(corpus, [...EXTERIOR_KEYWORDS.garage], "Garage");
  if (garage) exterior.garage = garage;
  const pool = firstMatchFact(corpus, [...EXTERIOR_KEYWORDS.pool], "Pool / spa");
  if (pool) exterior.pool = pool;
  const patioDeck = firstMatchFact(corpus, [...EXTERIOR_KEYWORDS.patioDeck], "Patio / deck");
  if (patioDeck) exterior.patioDeck = patioDeck;
  const landscaping = firstMatchFact(corpus, [...EXTERIOR_KEYWORDS.landscaping], "Landscaping");
  if (landscaping) exterior.landscaping = landscaping;

  return exterior;
}

function deriveNeighborhood(
  property: DNAPropertyInput,
  intelligence: PropertyIntelligence | null,
  corpus: Corpus[],
): PropertyDNANeighborhood {
  const schools: Fact[] = [];
  if (property.schoolDistrict) {
    schools.push(
      toFact("School district", property.schoolDistrict, { sourceType: "manual", label: "Property field" }),
    );
  }

  const notes = (intelligence?.neighborhoodNotes ?? []).map((value) =>
    toFact("Neighborhood", value, { sourceType: "system", label: "Property intelligence" }),
  );

  return {
    schools,
    shopping: matchFacts(corpus, [...NEIGHBORHOOD_KEYWORDS.shopping], "Shopping"),
    restaurants: matchFacts(corpus, [...NEIGHBORHOOD_KEYWORDS.restaurants], "Dining"),
    parks: matchFacts(corpus, [...NEIGHBORHOOD_KEYWORDS.parks], "Parks & recreation"),
    commute: matchFacts(corpus, [...NEIGHBORHOOD_KEYWORDS.commute], "Commute"),
    notes,
  };
}

function mergeRooms(rooms: DNARoomInput[], intelligence: PropertyIntelligence | null): PropertyDNARoom[] {
  const map = new Map<string, PropertyDNARoom>();

  for (const room of rooms) {
    const key = room.name.trim().toLowerCase();
    map.set(key, {
      id: room.id,
      name: room.name.trim(),
      description: room.description ?? null,
      features: stringArray(room.features),
      upgrades: stringArray(room.updates),
      includedItems: stringArray(room.includedItems),
      cautions: stringArray(room.cautions),
      buyerTalkingPoints: stringArray(room.talkingPoints),
      sourceRefs: [{ sourceType: "manual", sourceId: room.id ?? undefined, label: `Room: ${room.name.trim()}` }],
    });
  }

  for (const intelRoom of intelligence?.rooms ?? []) {
    const key = intelRoom.name.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.features = uniqueStrings([...existing.features, ...intelRoom.features]);
      existing.sourceRefs = dedupeSourceRefs([
        ...existing.sourceRefs,
        { sourceType: "system", label: "Property intelligence" },
      ]);
    } else {
      map.set(key, {
        id: null,
        name: intelRoom.name.trim(),
        description: intelRoom.condition ?? null,
        features: uniqueStrings(intelRoom.features),
        upgrades: [],
        includedItems: [],
        cautions: [],
        buyerTalkingPoints: [],
        sourceRefs: [{ sourceType: "system", label: "Property intelligence" }],
      });
    }
  }

  return Array.from(map.values());
}

function mapDocuments(documents: DNADocumentInput[]): PropertyDNADocument[] {
  return documents.map((doc) => ({
    id: doc.id,
    filename: doc.title,
    storagePath: doc.storagePath ?? null,
    documentType: doc.documentType ?? null,
    extractedText: doc.extractedText ?? null,
    summary: doc.summary ?? null,
    sourceRefs: [{ sourceType: "document", sourceId: doc.id, label: doc.title }],
  }));
}

function mapVoiceNotes(voiceNotes: DNAVoiceNoteInput[]): PropertyDNAVoiceNote[] {
  return voiceNotes.map((voice) => ({
    id: voice.id,
    transcript: voice.transcript,
    extractedFacts: [],
    sourceRefs: [{ sourceType: "voice_note", sourceId: voice.id, label: "Voice note" }],
  }));
}

function mapPhotos(photos: DNAPhotoInput[]): PropertyDNAPhoto[] {
  return photos.map((photo) => ({
    id: photo.id,
    filename: photo.storagePath ? photo.storagePath.split("/").pop() ?? photo.id : photo.id,
    storagePath: photo.storagePath ?? null,
    roomName: photo.detectedRoom ?? null,
    caption: photo.caption ?? null,
    isPrimary: Boolean(photo.isPrimary),
    visibleFeatures: stringArray(photo.detectedFeatures),
    sourceRefs: [{ sourceType: "photo", sourceId: photo.id, label: photo.caption ?? "Photo" }],
  }));
}

function mapBuyerQuestions(questions: DNABuyerQuestionInput[]): PropertyDNABuyerQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    selectedRoom: question.selectedRoom ?? null,
    question: question.question,
    normalizedQuestion: question.normalizedQuestion ?? question.question.trim().toLowerCase(),
    answer: question.answer ?? null,
    confidence: normalizeConfidence(question.confidence),
    needsAgentFollowup: Boolean(question.needsAgentFollowup),
    createdAt: question.createdAt,
  }));
}

function firstMatchFact(corpus: Corpus[], keywords: string[], label: string): Fact | undefined {
  for (const entry of corpus) {
    if (keywords.some((keyword) => entry.lower.includes(keyword))) {
      return {
        label,
        value: entry.text.slice(0, 240),
        confidence: confidenceForSource(entry.sourceRef.sourceType),
        sourceRefs: [entry.sourceRef],
      };
    }
  }
  return undefined;
}

function matchFacts(corpus: Corpus[], keywords: string[], label: string): Fact[] {
  const facts: Fact[] = [];
  const seen = new Set<string>();
  for (const entry of corpus) {
    if (!keywords.some((keyword) => entry.lower.includes(keyword))) continue;
    const key = entry.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({
      label,
      value: entry.text.slice(0, 240),
      confidence: confidenceForSource(entry.sourceRef.sourceType),
      sourceRefs: [entry.sourceRef],
    });
    if (facts.length >= 5) break;
  }
  return facts;
}

function toFact(label: string, value: string, sourceRef: SourceRef): Fact {
  return {
    label,
    value,
    confidence: confidenceForSource(sourceRef.sourceType),
    sourceRefs: [sourceRef],
  };
}

function confidenceForSource(sourceType: SourceType): Confidence {
  switch (sourceType) {
    case "manual":
    case "document":
      return "high";
    case "mls":
    case "knowledge":
    case "voice_note":
      return "medium";
    default:
      return "low";
  }
}

type SourceType = SourceRef["sourceType"];

function normalizeConfidence(value: string | null | undefined): Confidence | null {
  if (value === "high" || value === "medium" || value === "low") return value;
  return null;
}

function extractFactStrings(facts: unknown[] | undefined): string[] {
  if (!Array.isArray(facts)) return [];
  const result: string[] = [];
  for (const fact of facts) {
    if (typeof fact === "string") {
      result.push(fact);
    } else if (fact && typeof fact === "object") {
      const record = fact as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : null;
      const value = typeof record.value === "string" ? record.value : null;
      if (key && value) result.push(`${key}: ${value}`);
      else if (value) result.push(value);
    }
  }
  return result;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
}

function dedupeSourceRefs(refs: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const result: SourceRef[] = [];
  for (const ref of refs) {
    const key = `${ref.sourceType}:${ref.sourceId ?? ""}:${ref.label ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ref);
  }
  return result;
}

function humanizeKey(key: string): string {
  const map: Record<string, string> = {
    roof: "Roof",
    hvac: "HVAC",
    electrical: "Electrical",
    plumbing: "Plumbing",
    waterHeater: "Water heater",
    sewer: "Sewer / septic",
    water: "Water supply",
    internet: "Internet",
    naturalGas: "Natural gas",
  };
  return map[key] ?? key;
}

function formatAddress(property: DNAPropertyInput): string {
  if (property.address) return property.address;
  return [property.street, property.city, property.provinceState].filter(Boolean).join(", ");
}
