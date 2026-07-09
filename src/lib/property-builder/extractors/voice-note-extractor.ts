import type { IntelligenceService } from "@/lib/property-twin/intelligence";
import type { VoiceNoteIntelligenceResult } from "@/lib/property-twin/types";

const EXTRACTOR_VERSION = "1.0.0";

export interface VoiceNoteExtractionInput {
  propertyId: string;
  transcript: string;
  storagePath?: string | null;
}

export interface VoiceNoteExtractionResult extends VoiceNoteIntelligenceResult {
  source: "voice_note";
  version: string;
  extractedAt: string;
  suggestedTimelineEvents: Array<{
    title: string;
    description: string;
    eventType: string;
  }>;
  verificationTasks: string[];
}

export async function extractVoiceNoteIntelligence(
  intelligence: IntelligenceService,
  input: VoiceNoteExtractionInput,
): Promise<VoiceNoteExtractionResult> {
  const analysis = await intelligence.analyzeVoiceNote({
    propertyId: input.propertyId,
    transcript: input.transcript,
    storagePath: input.storagePath,
  });

  const yearMatches = input.transcript.match(/\b(19|20)\d{2}\b/g) ?? [];
  const suggestedTimelineEvents = yearMatches.slice(0, 3).map((year) => ({
    title: `Event in ${year}`,
    description: input.transcript.slice(0, 120),
    eventType: "custom",
  }));

  return {
    ...analysis,
    source: "voice_note",
    version: EXTRACTOR_VERSION,
    extractedAt: new Date().toISOString(),
    suggestedTimelineEvents,
    verificationTasks: analysis.requiresVerification,
  };
}
