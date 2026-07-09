import type { IntelligenceService } from "@/lib/property-twin/intelligence";
import type { PhotoIntelligenceResult } from "@/lib/property-twin/types";

const EXTRACTOR_VERSION = "1.0.0";

export interface PhotoExtractionInput {
  photoId: string;
  storagePath: string;
  existingCaptions?: string[];
}

export interface PhotoExtractionResult extends PhotoIntelligenceResult {
  source: "photo";
  version: string;
  extractedAt: string;
  suggestedPoi?: string;
  suggestedFeatures: string[];
  coverageContribution: string | null;
  missingCoverageSuggestions: string[];
}

export async function extractPhotoIntelligence(
  intelligence: IntelligenceService,
  input: PhotoExtractionInput,
): Promise<PhotoExtractionResult> {
  const analysis = await intelligence.analyzePhoto({
    photoId: input.photoId,
    storagePath: input.storagePath,
    existingCaptions: input.existingCaptions,
  });

  const room = analysis.detectedRoom;
  const suggestedFeatures = [
    ...analysis.detectedFeatures,
    ...analysis.detectedObjects,
  ];

  return {
    ...analysis,
    source: "photo",
    version: EXTRACTOR_VERSION,
    extractedAt: new Date().toISOString(),
    suggestedPoi: room ?? undefined,
    suggestedFeatures,
    coverageContribution: room,
    missingCoverageSuggestions: room ? [] : ["Room could not be detected — consider adding a descriptive filename."],
  };
}
