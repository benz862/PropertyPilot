import type { IntelligenceService } from "@/lib/property-twin/intelligence";
import type { DocumentIntelligenceResult } from "@/lib/property-twin/types";

const EXTRACTOR_VERSION = "1.0.0";

export interface DocumentExtractionInput {
  documentId: string;
  title: string;
  documentType: string;
  storagePath: string;
  storageBucket?: string;
  mimeType?: string | null;
}

export interface DocumentExtractionResult extends DocumentIntelligenceResult {
  source: "document";
  version: string;
  extractedAt: string;
  documentId: string;
  title: string;
  storagePath: string;
  traceableSource: {
    documentId: string;
    title: string;
    documentType: string;
    storagePath: string;
  };
}

export async function extractDocumentIntelligence(
  intelligence: IntelligenceService,
  input: DocumentExtractionInput,
): Promise<DocumentExtractionResult> {
  const analysis = await intelligence.analyzeDocument({
    documentId: input.documentId,
    title: input.title,
    documentType: input.documentType,
    storagePath: input.storagePath,
    storageBucket: input.storageBucket,
    mimeType: input.mimeType,
  });

  return {
    ...analysis,
    source: "document",
    version: EXTRACTOR_VERSION,
    extractedAt: new Date().toISOString(),
    documentId: input.documentId,
    title: input.title,
    storagePath: input.storagePath,
    traceableSource: {
      documentId: input.documentId,
      title: input.title,
      documentType: input.documentType,
      storagePath: input.storagePath,
    },
  };
}
