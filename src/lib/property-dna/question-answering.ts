import type { Confidence, Fact, PropertyDNA, SourceRef } from "./types";

export const UNKNOWN_ANSWER =
  "I don't have that detail yet. I can send this question to the listing agent.";

const DISCLOSURE_TOPICS = [
  "legal",
  "lawsuit",
  "tax",
  "taxes",
  "school",
  "hoa",
  "disclosure",
  "inspection",
  "permit",
  "zoning",
  "flood",
  "crime",
  "title",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "this",
  "that",
  "about",
  "what",
  "how",
  "can",
  "you",
  "tell",
  "does",
  "are",
  "was",
  "with",
  "have",
]);

export interface AnswerQuestionInput {
  selectedRoom: string;
  question: string;
}

export interface AnswerQuestionResult {
  answer: string;
  confidence: Confidence;
  needsAgentFollowup: boolean;
  sourceRefs: SourceRef[];
  answeredFromSources: Array<{ source: string; excerpt: string }>;
}

interface Chunk {
  text: string;
  sourceRef: SourceRef;
  roomName?: string | null;
}

/**
 * Answer a buyer question using only the property's DNA. Never invents
 * information: if the DNA has no relevant content the answer flags follow-up.
 */
export function answerQuestionFromDNA(dna: PropertyDNA, input: AnswerQuestionInput): AnswerQuestionResult {
  const chunks = buildChunks(dna);
  const ranked = rankChunks(chunks, input.question, input.selectedRoom);

  if (ranked.length === 0) {
    return {
      answer: UNKNOWN_ANSWER,
      confidence: "low",
      needsAgentFollowup: true,
      sourceRefs: [],
      answeredFromSources: [],
    };
  }

  const top = ranked.slice(0, 4);
  const answer = composeAnswer(top.map((item) => item.chunk.text));
  const needsVerification = isDisclosureSensitive(input.question);
  const confidence: Confidence = needsVerification
    ? "low"
    : ranked[0].score >= 4
      ? "high"
      : "medium";

  return {
    answer: needsVerification ? `${answer}\n\nPlease verify this with the listing agent and official records.` : answer,
    confidence,
    needsAgentFollowup: needsVerification,
    sourceRefs: dedupeSourceRefs(top.map((item) => item.chunk.sourceRef)),
    answeredFromSources: top.map((item) => ({
      source: sourceLabel(item.chunk.sourceRef),
      excerpt: item.chunk.text.slice(0, 240),
    })),
  };
}

export function buildChunks(dna: PropertyDNA): Chunk[] {
  const chunks: Chunk[] = [];

  const manual: Array<[string | number | null | undefined, string]> = [
    [dna.basic.price != null ? `Asking price: $${dna.basic.price.toLocaleString()}` : null, "Property field"],
    [dna.basic.beds != null ? `Bedrooms: ${dna.basic.beds}` : null, "Property field"],
    [dna.basic.baths != null ? `Bathrooms: ${dna.basic.baths}` : null, "Property field"],
    [dna.basic.squareFeet != null ? `Finished square feet: ${dna.basic.squareFeet}` : null, "Property field"],
    [dna.basic.lotSize != null ? `Lot size: ${dna.basic.lotSize} sq ft` : null, "Property field"],
    [dna.basic.yearBuilt != null ? `Year built: ${dna.basic.yearBuilt}` : null, "Property field"],
    [dna.basic.schoolDistrict ? `School district: ${dna.basic.schoolDistrict}` : null, "Property field"],
    [dna.basic.summary, "Summary"],
    [dna.basic.mlsDescription, "Listing description"],
  ];
  for (const [text, label] of manual) {
    if (text) chunks.push({ text: String(text), sourceRef: { sourceType: "manual", label } });
  }

  for (const room of dna.rooms) {
    const parts = [
      room.description,
      ...room.features.map((item) => `Feature: ${item}`),
      ...room.upgrades.map((item) => `Update: ${item}`),
      ...room.includedItems.map((item) => `Included: ${item}`),
      ...room.buyerTalkingPoints.map((item) => `Talking point: ${item}`),
      ...room.cautions.map((item) => `Note: ${item}`),
    ].filter(Boolean);
    if (parts.length > 0) {
      chunks.push({
        text: parts.join("\n"),
        sourceRef: room.sourceRefs[0] ?? { sourceType: "manual", label: `Room: ${room.name}` },
        roomName: room.name,
      });
    }
  }

  addFactChunks(chunks, Object.values(dna.systems).filter((fact): fact is Fact => Boolean(fact)));
  addFactChunks(chunks, dna.exterior.features);
  addFactChunks(chunks, dna.exterior.lotFeatures);
  addFactChunks(chunks, [dna.exterior.garage, dna.exterior.pool, dna.exterior.patioDeck, dna.exterior.landscaping].filter((fact): fact is Fact => Boolean(fact)));
  addFactChunks(chunks, dna.neighborhood.schools);
  addFactChunks(chunks, dna.neighborhood.notes);
  addFactChunks(chunks, dna.neighborhood.shopping);
  addFactChunks(chunks, dna.neighborhood.restaurants);
  addFactChunks(chunks, dna.neighborhood.parks);
  addFactChunks(chunks, dna.neighborhood.commute);

  for (const doc of dna.documents) {
    const text = doc.summary ?? doc.extractedText;
    if (text) chunks.push({ text: `${doc.filename}: ${text}`.slice(0, 600), sourceRef: doc.sourceRefs[0] });
  }

  return chunks;
}

function addFactChunks(chunks: Chunk[], facts: Fact[]) {
  for (const fact of facts) {
    chunks.push({
      text: `${fact.label}: ${fact.value}`,
      sourceRef: fact.sourceRefs[0] ?? { sourceType: "system", label: fact.label },
    });
  }
}

function rankChunks(chunks: Chunk[], question: string, selectedRoom: string) {
  const isWholeProperty = selectedRoom.trim().toLowerCase() === "whole property";
  const terms = tokenize(`${question} ${isWholeProperty ? "" : selectedRoom}`);

  return chunks
    .map((chunk) => {
      const text = chunk.text.toLowerCase();
      const roomBoost =
        chunk.roomName && !isWholeProperty && chunk.roomName.toLowerCase() === selectedRoom.toLowerCase() ? 3 : 0;
      const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0) + roomBoost;
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function composeAnswer(texts: string[]): string {
  const combined = texts.join(" ").replace(/\s+/g, " ").trim();
  return combined.slice(0, 600);
}

function isDisclosureSensitive(question: string): boolean {
  const lower = question.toLowerCase();
  return DISCLOSURE_TOPICS.some((topic) => lower.includes(topic));
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
    ),
  );
}

function sourceLabel(ref: SourceRef): string {
  if (ref.label) return ref.label;
  return ref.sourceType;
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
