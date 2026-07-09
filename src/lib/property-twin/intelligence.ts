import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

import { env } from "@/lib/env";
import {
  extractDisclosureSensitivePhrases,
  extractFeaturePhrases,
  extractKeywordPhrases,
  extractRoomFacts,
  extractUpgradePhrases,
  normalizeText,
} from "@/lib/property-intelligence/text-extraction";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type {
  DocumentIntelligenceResult,
  KnowledgeCategory,
  PhotoIntelligenceResult,
  VerificationLevel,
  VoiceNoteIntelligenceResult,
} from "@/lib/property-twin/types";
import { createClient } from "@/lib/supabase/server";

interface PhotoAnalysisInput {
  photoId: string;
  storagePath: string;
  storageBucket?: string;
  existingCaptions?: string[];
}

interface DocumentAnalysisInput {
  documentId: string;
  title: string;
  documentType: string;
  storagePath: string;
  storageBucket?: string;
  mimeType?: string | null;
}

interface VoiceNoteAnalysisInput {
  propertyId: string;
  transcript: string;
  storagePath?: string | null;
}

type AiPhotoResponse = {
  caption?: string | null;
  detectedFeatures?: string[];
  detectedRoom?: string | null;
  detectedObjects?: string[];
  conditionNotes?: string[];
  upgrades?: string[];
  materials?: string[];
  exteriorDetails?: string[];
  tentativeObservations?: string[];
  suggestedKnowledgeObjects?: Array<{
    name?: string;
    category?: KnowledgeCategory;
    confidence?: VerificationLevel;
  }>;
  qualityScore?: number | null;
};

export class IntelligenceService {
  constructor(private readonly repository: PropertyTwinRepository) {}

  async analyzePhoto(input: PhotoAnalysisInput): Promise<PhotoIntelligenceResult> {
    const result = await analyzePhoto(input);

    await this.repository.storePhotoAnalysis(input.photoId, {
      caption: result.caption,
      detectedFeatures: result.detectedFeatures,
      detectedRoom: result.detectedRoom,
      detectedObjects: result.detectedObjects,
      suggestedKnowledgeObjects: result.suggestedKnowledgeObjects,
      qualityScore: result.qualityScore,
      isDuplicate: result.isDuplicate,
    });

    return result;
  }

  async analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentIntelligenceResult> {
    const result = await analyzeDocument(input);

    await this.repository.storeDocumentExtraction(
      input.documentId,
      result.rawExtracted,
      result.requiresReview,
      typeof result.rawExtracted.extractedText === "string"
        ? result.rawExtracted.extractedText
        : null,
    );

    return result;
  }

  async analyzeVoiceNote(input: VoiceNoteAnalysisInput): Promise<VoiceNoteIntelligenceResult> {
    const result = analyzeVoiceNote(input);

    await this.repository.storeVoiceNoteIntelligence(
      input.propertyId,
      input.transcript,
      {
        structuredKnowledge: result.knowledgeObjects,
        suggestedFaqs: result.suggestedFaqs,
        suggestedBuyerQuestions: result.suggestedBuyerQuestions,
        missingInformation: result.missingInformation,
        requiresVerification: result.requiresVerification,
      },
      input.storagePath,
    );

    return result;
  }
}

export async function analyzePhoto(input: PhotoAnalysisInput): Promise<PhotoIntelligenceResult> {
  const imageUrl = buildStoragePublicUrl(input.storageBucket ?? "property-photos", input.storagePath);
  const roomGuess = inferRoomFromPath(input.storagePath);

  if (!env.openai.apiKey) {
    return buildPhotoAnalysisFromMetadata(input, [
      "OpenAI API key is not configured; photo analysis used filename and storage metadata only.",
    ]);
  }

  if (!imageUrl) {
    return buildPhotoAnalysisFromMetadata(input, [
      `Could not build public URL for photo ${input.storagePath}.`,
    ]);
  }

  try {
    const client = new OpenAI({ apiKey: env.openai.apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze real estate photos. Return only JSON. Do not invent details that are not visible. Mark uncertain visual observations as tentative.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Extract visible property intelligence from this image.",
                "JSON keys: caption, detectedRoom, detectedFeatures, detectedObjects, conditionNotes, upgrades, materials, exteriorDetails, tentativeObservations, suggestedKnowledgeObjects, qualityScore.",
                "suggestedKnowledgeObjects items require name, category, confidence.",
                roomGuess ? `Filename room hint: ${roomGuess}` : "No room hint from filename.",
              ].join("\n"),
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const parsed = parseJsonObject<AiPhotoResponse>(completion.choices[0]?.message?.content);
    return normalizeAiPhotoResponse(input, parsed);
  } catch (error) {
    return buildPhotoAnalysisFromMetadata(input, [
      `AI photo extraction failed for ${input.storagePath}: ${error instanceof Error ? error.message : "unknown error"}`,
    ]);
  }
}

export async function analyzeDocument(
  input: DocumentAnalysisInput,
): Promise<DocumentIntelligenceResult> {
  const readResult = await readDocumentText(input);
  if (!readResult.text) {
    return {
      extractedDates: [],
      manufacturers: [],
      modelNumbers: [],
      serialNumbers: [],
      measurements: {},
      maintenanceNotes: [],
      recommendations: [],
      requiresReview: true,
      rawExtracted: {
        title: input.title,
        documentType: input.documentType,
        storagePath: input.storagePath,
        error: readResult.error ?? "No extractable text found.",
      },
    };
  }

  const text = readResult.text;
  const extractedDates = extractMatches(text, /\b(?:20\d{2}|19\d{2}|\d{1,2}\/\d{1,2}\/(?:20|19)?\d{2})\b/g);
  const manufacturers = extractMatches(
    text,
    /\b(?:Carrier|Trane|Lennox|Rheem|Goodman|Bosch|GE|Whirlpool|Samsung|LG|KitchenAid|JennAir|Sub-Zero|Wolf)\b/gi,
  );
  const modelNumbers = extractMatches(text, /\bmodel(?:\s+number|\s+#|)?[:\s]+([A-Z0-9._-]{4,})\b/gi);
  const serialNumbers = extractMatches(text, /\bserial(?:\s+number|\s+#|)?[:\s]+([A-Z0-9._-]{4,})\b/gi);
  const maintenanceNotes = [
    ...extractUpgradePhrases(text),
    ...extractKeywordPhrases(text, ["service", "maintenance", "repair", "warranty", "replace"]),
  ].slice(0, 12);
  const recommendations = extractKeywordPhrases(text, [
    "recommend",
    "monitor",
    "repair",
    "replace",
    "evaluate",
    "further review",
  ]);

  return {
    extractedDates,
    manufacturers,
    modelNumbers,
    serialNumbers,
    measurements: extractMeasurements(text),
    maintenanceNotes,
    recommendations,
    requiresReview: recommendations.length > 0,
    rawExtracted: {
      title: input.title,
      documentType: input.documentType,
      storagePath: input.storagePath,
      mimeType: input.mimeType ?? readResult.mimeType,
      extractedText: text,
      extractionMethod: readResult.method,
    },
  };
}

export function analyzeVoiceNote(input: VoiceNoteAnalysisInput): VoiceNoteIntelligenceResult {
  const sentences = input.transcript
    .split(/[.!?]/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);

  const features = extractFeaturePhrases(input.transcript);
  const upgrades = extractUpgradePhrases(input.transcript);
  const disclosureSensitive = extractDisclosureSensitivePhrases(input.transcript);
  const roomFacts = extractRoomFacts(input.transcript);

  const knowledgeObjects = [
    ...features.map((feature) => ({
      name: summarizeName(feature),
      category: inferCategoryFromText(feature),
      summary: feature,
      facts: [{ key: "feature", value: feature, verificationLevel: "likely" as VerificationLevel }],
    })),
    ...upgrades.map((upgrade) => ({
      name: summarizeName(upgrade),
      category: "renovations" as KnowledgeCategory,
      summary: upgrade,
      facts: [{ key: "upgrade", value: upgrade, verificationLevel: "likely" as VerificationLevel }],
    })),
    ...roomFacts.flatMap((room) =>
      room.features.map((feature) => ({
        name: `${room.name} note`,
        category: inferCategoryFromText(room.name),
        summary: feature,
        facts: [{ key: "room_note", value: feature, verificationLevel: "likely" as VerificationLevel }],
      })),
    ),
  ].slice(0, 12);

  return {
    knowledgeObjects,
    suggestedFaqs: [
      ...upgrades.slice(0, 3).map((upgrade) => ({
        question: "What upgrades have been completed?",
        answer: upgrade,
      })),
      ...features.slice(0, 3).map((feature) => ({
        question: `Can you tell me more about ${summarizeName(feature).toLowerCase()}?`,
        answer: feature,
      })),
    ].slice(0, 6),
    suggestedBuyerQuestions: buildVoiceBuyerQuestions(input.transcript),
    missingInformation:
      sentences.length === 0
        ? ["Transcript did not contain extractable property facts."]
        : disclosureSensitive.map((item) => `Review disclosure-sensitive note before publishing: ${item}`),
    requiresVerification: [...upgrades, ...disclosureSensitive].slice(0, 12),
  };
}

async function readDocumentText(input: DocumentAnalysisInput): Promise<{
  text: string | null;
  method?: string;
  mimeType?: string | null;
  error?: string;
}> {
  const mimeType = input.mimeType ?? inferMimeType(input.storagePath);

  if (!isSupportedDocumentMimeType(mimeType)) {
    return {
      text: null,
      mimeType,
      error: `Unsupported document type: ${mimeType ?? "unknown"}. Supported types are PDF and plain text.`,
    };
  }

  try {
    const client = await createClient();
    const { data, error } = await client.storage
      .from(input.storageBucket ?? "documents")
      .download(input.storagePath);

    if (error || !data) {
      return { text: null, mimeType, error: error?.message ?? "Failed to download document from storage." };
    }

    if (mimeType === "text/plain") {
      return { text: normalizeText(await data.text()), method: "plain_text", mimeType };
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return { text: normalizeText(parsed.text ?? ""), method: "pdf_parse", mimeType };
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    return {
      text: null,
      mimeType,
      error: error instanceof Error ? error.message : "Document extraction failed.",
    };
  }
}

function normalizeAiPhotoResponse(
  input: PhotoAnalysisInput,
  parsed: AiPhotoResponse | null,
): PhotoIntelligenceResult {
  if (!parsed) {
    return buildPhotoAnalysisFromMetadata(input, ["AI photo extraction returned invalid JSON."]);
  }

  const detectedRoom = stringOrNull(parsed.detectedRoom) ?? inferRoomFromPath(input.storagePath);
  const detectedFeatures = uniqueStrings([
    ...arrayOfStrings(parsed.detectedFeatures),
    ...arrayOfStrings(parsed.conditionNotes),
    ...arrayOfStrings(parsed.upgrades),
    ...arrayOfStrings(parsed.materials),
    ...arrayOfStrings(parsed.exteriorDetails),
    ...arrayOfStrings(parsed.tentativeObservations).map((item) => `Tentative: ${item}`),
  ]);
  const suggestedKnowledgeObjects = (parsed.suggestedKnowledgeObjects ?? [])
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : null,
      category: item.category ?? (detectedRoom ? inferCategoryFromRoom(detectedRoom) : "miscellaneous"),
      confidence: item.confidence ?? "likely",
    }))
    .filter((item): item is { name: string; category: KnowledgeCategory; confidence: VerificationLevel } =>
      Boolean(item.name),
    );

  if (detectedRoom && !suggestedKnowledgeObjects.some((item) => item.name.toLowerCase() === detectedRoom.toLowerCase())) {
    suggestedKnowledgeObjects.push({
      name: detectedRoom,
      category: inferCategoryFromRoom(detectedRoom),
      confidence: "likely",
    });
  }

  return {
    caption: stringOrNull(parsed.caption) ?? (detectedRoom ? `${detectedRoom} photo` : null),
    detectedFeatures,
    detectedRoom,
    detectedObjects: uniqueStrings(arrayOfStrings(parsed.detectedObjects)),
    suggestedKnowledgeObjects,
    qualityScore: typeof parsed.qualityScore === "number" ? parsed.qualityScore : null,
    isDuplicate: isDuplicateRoom(detectedRoom, input.existingCaptions),
  };
}

function buildPhotoAnalysisFromMetadata(
  input: PhotoAnalysisInput,
  issues: string[],
): PhotoIntelligenceResult {
  const roomGuess = inferRoomFromPath(input.storagePath);
  return {
    caption: roomGuess ? `${roomGuess} photo` : issues[0] ?? null,
    detectedFeatures: issues,
    detectedRoom: roomGuess,
    detectedObjects: [],
    suggestedKnowledgeObjects: roomGuess
      ? [
          {
            name: roomGuess,
            category: inferCategoryFromRoom(roomGuess),
            confidence: "unknown",
          },
        ]
      : [],
    qualityScore: null,
    isDuplicate: isDuplicateRoom(roomGuess, input.existingCaptions),
  };
}

function buildStoragePublicUrl(bucket: string, storagePath: string): string | null {
  if (!env.supabase.url) return null;
  return `${env.supabase.url}/storage/v1/object/public/${bucket}/${encodeStoragePath(storagePath)}`;
}

function encodeStoragePath(storagePath: string): string {
  return storagePath.split("/").map(encodeURIComponent).join("/");
}

function inferRoomFromPath(storagePath: string): string | null {
  const normalized = storagePath.toLowerCase().replace(/[_-]+/g, " ");
  const rooms = [
    "kitchen",
    "primary bedroom",
    "bedroom",
    "bathroom",
    "garage",
    "backyard",
    "living room",
    "dining room",
    "basement",
    "office",
    "laundry",
  ];

  return rooms.find((room) => normalized.includes(room)) ?? null;
}

function inferCategoryFromRoom(room: string): KnowledgeCategory {
  const normalized = room.toLowerCase();
  if (normalized.includes("kitchen")) return "interior";
  if (normalized.includes("garage")) return "exterior";
  if (normalized.includes("backyard")) return "landscape";
  if (normalized.includes("bathroom") || normalized.includes("bedroom")) return "interior";
  if (normalized.includes("basement") || normalized.includes("living") || normalized.includes("dining")) return "interior";
  return "miscellaneous";
}

function inferCategoryFromText(text: string): KnowledgeCategory {
  const normalized = text.toLowerCase();
  if (/(roof|siding|garage|driveway|window)/.test(normalized)) return "exterior";
  if (/(yard|landscap|pool|deck|patio|fence)/.test(normalized)) return "landscape";
  if (/(hvac|furnace|water heater|electrical|plumbing)/.test(normalized)) return "mechanical";
  if (/(kitchen|bath|bedroom|floor|counter|cabinet)/.test(normalized)) return "interior";
  if (/(school|park|trail|neighborhood)/.test(normalized)) return "neighborhood";
  return "miscellaneous";
}

function isDuplicateRoom(room: string | null, existingCaptions?: string[]): boolean {
  return Boolean(
    room &&
      (existingCaptions ?? []).some((caption) =>
        caption.toLowerCase().includes(room.toLowerCase()),
      ),
  );
}

function isSupportedDocumentMimeType(mimeType?: string | null): boolean {
  return mimeType === "application/pdf" || mimeType === "text/plain";
}

function inferMimeType(storagePath: string): string | null {
  if (/\.pdf$/i.test(storagePath)) return "application/pdf";
  if (/\.txt$/i.test(storagePath)) return "text/plain";
  return null;
}

function extractMeasurements(text: string): Record<string, string> {
  const measurements: Record<string, string> = {};
  const matches = text.matchAll(/\b(\d+(?:\.\d+)?)\s?(sq\.?\s?ft|square feet|acres?|ft|feet|inches|in\.)\b/gi);
  let index = 1;
  for (const match of matches) {
    measurements[`measurement_${index}`] = match[0];
    index += 1;
    if (index > 12) break;
  }
  return measurements;
}

function extractMatches(text: string, pattern: RegExp): string[] {
  const values = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    values.add(normalizeText(match[1] ?? match[0]));
  }
  return Array.from(values).slice(0, 12);
}

function buildVoiceBuyerQuestions(transcript: string): string[] {
  const questions = new Set<string>();
  if (/upgrade|renovat|remodel|replace/i.test(transcript)) questions.add("Which updates were completed, and when?");
  if (/warranty|service|maintenance/i.test(transcript)) questions.add("Are warranties or maintenance records available?");
  if (/school|park|trail|downtown|neighborhood/i.test(transcript)) questions.add("What neighborhood details should buyers know?");
  if (/roof|hvac|furnace|water heater/i.test(transcript)) questions.add("How old are the major systems?");
  return Array.from(questions);
}

function summarizeName(text: string): string {
  return normalizeText(text).slice(0, 60);
}

function parseJsonObject<T>(content: string | null | undefined): T | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const cleaned = normalizeText(value);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    unique.push(cleaned);
  }
  return unique.slice(0, 20);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? normalizeText(value) : null;
}
