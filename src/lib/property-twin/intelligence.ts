import { env } from "@/lib/env";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type {
  DocumentIntelligenceResult,
  KnowledgeCategory,
  PhotoIntelligenceResult,
  VerificationLevel,
  VoiceNoteIntelligenceResult,
} from "@/lib/property-twin/types";

interface PhotoAnalysisInput {
  photoId: string;
  storagePath: string;
  existingCaptions?: string[];
}

interface DocumentAnalysisInput {
  documentId: string;
  title: string;
  documentType: string;
  storagePath: string;
}

interface VoiceNoteAnalysisInput {
  propertyId: string;
  transcript: string;
  storagePath?: string | null;
}

export class IntelligenceService {
  constructor(private readonly repository: PropertyTwinRepository) {}

  async analyzePhoto(input: PhotoAnalysisInput): Promise<PhotoIntelligenceResult> {
    const result = env.openai.apiKey
      ? await analyzePhotoWithAi(input)
      : buildPlaceholderPhotoAnalysis(input);

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
    const result = env.openai.apiKey
      ? await analyzeDocumentWithAi(input)
      : buildPlaceholderDocumentAnalysis(input);

    await this.repository.storeDocumentExtraction(
      input.documentId,
      result.rawExtracted,
      result.requiresReview,
    );

    return result;
  }

  async analyzeVoiceNote(input: VoiceNoteAnalysisInput): Promise<VoiceNoteIntelligenceResult> {
    const result = env.openai.apiKey
      ? await analyzeVoiceNoteWithAi(input)
      : buildPlaceholderVoiceNoteAnalysis(input);

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

async function analyzePhotoWithAi(
  input: PhotoAnalysisInput,
): Promise<PhotoIntelligenceResult> {
  // OpenAI vision integration deferred to PRD-003; placeholder keeps storage pipeline intact.
  return buildPlaceholderPhotoAnalysis(input);
}

async function analyzeDocumentWithAi(
  input: DocumentAnalysisInput,
): Promise<DocumentIntelligenceResult> {
  return buildPlaceholderDocumentAnalysis(input);
}

async function analyzeVoiceNoteWithAi(
  input: VoiceNoteAnalysisInput,
): Promise<VoiceNoteIntelligenceResult> {
  return buildPlaceholderVoiceNoteAnalysis(input);
}

function buildPlaceholderPhotoAnalysis(input: PhotoAnalysisInput): PhotoIntelligenceResult {
  const roomGuess = inferRoomFromPath(input.storagePath);
  const isDuplicate =
    roomGuess !== null &&
    (input.existingCaptions ?? []).some((caption) =>
      caption.toLowerCase().includes(roomGuess.toLowerCase()),
    );

  return {
    caption: roomGuess ? `${roomGuess} photo` : null,
    detectedFeatures: [],
    detectedRoom: roomGuess,
    detectedObjects: [],
    suggestedKnowledgeObjects: roomGuess
      ? [
          {
            name: roomGuess,
            category: inferCategoryFromRoom(roomGuess),
            confidence: "likely" as VerificationLevel,
          },
        ]
      : [],
    qualityScore: null,
    isDuplicate,
  };
}

function buildPlaceholderDocumentAnalysis(
  input: DocumentAnalysisInput,
): DocumentIntelligenceResult {
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
      status: "pending_ai_extraction",
    },
  };
}

function buildPlaceholderVoiceNoteAnalysis(
  input: VoiceNoteAnalysisInput,
): VoiceNoteIntelligenceResult {
  const sentences = input.transcript
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const knowledgeObjects = sentences.slice(0, 3).map((sentence, index) => ({
    name: `Voice Note Insight ${index + 1}`,
    category: "miscellaneous" as KnowledgeCategory,
    summary: sentence,
    facts: [
      {
        key: "note",
        value: sentence,
        verificationLevel: "likely" as VerificationLevel,
      },
    ],
  }));

  return {
    knowledgeObjects,
    suggestedFaqs: sentences.slice(0, 2).map((sentence) => ({
      question: `Can you tell me more about: ${sentence.slice(0, 60)}?`,
      answer: sentence,
    })),
    suggestedBuyerQuestions: [
      "What improvements have been made?",
      "Are there any warranties available?",
    ],
    missingInformation: sentences.length === 0 ? ["Transcript did not contain structured facts"] : [],
    requiresVerification: sentences.map((sentence) => sentence.slice(0, 120)),
  };
}

function inferRoomFromPath(storagePath: string): string | null {
  const normalized = storagePath.toLowerCase();
  const rooms = [
    "kitchen",
    "bedroom",
    "bathroom",
    "garage",
    "backyard",
    "living room",
    "dining room",
  ];

  return rooms.find((room) => normalized.includes(room.replace(" ", "-"))) ??
    rooms.find((room) => normalized.includes(room.replace(" ", "_"))) ??
    null;
}

function inferCategoryFromRoom(room: string): KnowledgeCategory {
  const normalized = room.toLowerCase();
  if (normalized.includes("kitchen")) return "interior";
  if (normalized.includes("garage")) return "exterior";
  if (normalized.includes("backyard")) return "landscape";
  if (normalized.includes("bathroom") || normalized.includes("bedroom")) return "interior";
  return "miscellaneous";
}
