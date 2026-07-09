import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type { PropertyTwinService } from "@/lib/property-twin/service";

import { generatePropertyAssets } from "@/lib/property-builder/asset-generator";
import { extractMlsData } from "@/lib/property-builder/extractors/mls-extractor";
import { extractDocumentIntelligence } from "@/lib/property-builder/extractors/document-extractor";
import { extractPhotoIntelligence } from "@/lib/property-builder/extractors/photo-extractor";
import { extractVoiceNoteIntelligence } from "@/lib/property-builder/extractors/voice-note-extractor";
import {
  calculatePhotoCoverage,
  getMissingCoverageSuggestions,
} from "@/lib/property-builder/photo-coverage";
import { calculatePropertyQuality } from "@/lib/property-builder/quality-score";
import { buildPropertyIntelligence } from "@/lib/property-intelligence";
import type {
  BuildPropertyTwinResult,
  MlsExtractionResult,
  PropertyQualityScore,
} from "@/lib/property-builder/types";

export interface BuildPropertyTwinInput {
  propertyId: string;
  mls?: {
    rawText?: string;
    structured?: Record<string, unknown>;
  };
  voiceTranscripts?: string[];
  actorId?: string | null;
}

export interface PropertyHealthReport {
  quality: PropertyQualityScore;
  completeness: BuildPropertyTwinResult["completeness"];
  photoCoverage: BuildPropertyTwinResult["photoCoverage"];
  assets: BuildPropertyTwinResult["assets"];
}

/**
 * PropertyBuilderService orchestrates AI extraction and twin construction.
 * Extraction modules remain independent — never embed in page components.
 */
export class PropertyBuilderService {
  constructor(
    private readonly twin: PropertyTwinService,
    private readonly repository: PropertyTwinRepository,
  ) {}

  static async create(): Promise<PropertyBuilderService> {
    const { createPropertyTwinService } = await import("@/lib/property-twin/service");
    const { PropertyTwinRepository } = await import("@/lib/property-twin/repository");
    const { createClient } = await import("@/lib/supabase/server");
    const client = await createClient();
    const twin = await createPropertyTwinService();
    const repository = new PropertyTwinRepository(client);
    return new PropertyBuilderService(twin, repository);
  }

  async getPropertyHealth(propertyId: string): Promise<PropertyHealthReport> {
    const snapshot = await this.twin.getTwinSnapshot(propertyId);
    if (!snapshot) {
      throw new Error("Property not found");
    }

    const photos = await this.repository.listPhotos(propertyId);
    const photoCoverage = calculatePhotoCoverage(
      photos.map((photo) => ({
        detectedRoom: photo.detected_room ?? null,
        tags: photo.tags,
      })),
    );

    const verifiedFacts = snapshot.facts.filter(
      (fact) => fact.verificationLevel === "verified" || fact.verificationLevel === "likely",
    );
    const verifiedFactRatio =
      snapshot.facts.length === 0 ? 0 : verifiedFacts.length / snapshot.facts.length;

    const [hasVoice, hasPolicy] = await Promise.all([
      this.repository.hasVoicePersonality(propertyId),
      this.repository.hasAiPolicy(propertyId),
    ]);

    const quality = calculatePropertyQuality({
      completeness: snapshot.completeness,
      photoCoverage,
      knowledgeObjectCount: snapshot.knowledgeObjects.length,
      voiceNoteCount: 0,
      hasVoicePersonality: hasVoice,
      hasAiPolicy: hasPolicy,
      poiCount: snapshot.pois.length,
      verifiedFactRatio,
    });

    const assets = generatePropertyAssets({
      profile: snapshot.profile,
      photoCoverage,
      pois: snapshot.pois.map((poi) => ({ title: poi.title, subtitle: null })),
      suggestedFaqs: [],
      features: [],
    });

    return {
      quality,
      completeness: snapshot.completeness,
      photoCoverage,
      assets,
    };
  }

  async ingestMls(
    propertyId: string,
    input: BuildPropertyTwinInput["mls"],
    actorId?: string | null,
  ): Promise<MlsExtractionResult> {
    const extraction = extractMlsData({
      rawText: input?.rawText,
      structured: input?.structured,
    });

    const update: import("@/lib/property-twin/types").UpdatePropertyProfileInput = {};
    const { fields } = extraction;

    if (fields.street) update.street = fields.street;
    if (fields.city) update.city = fields.city;
    if (fields.provinceState) update.provinceState = fields.provinceState;
    if (fields.postalCode) update.postalCode = fields.postalCode;
    if (fields.listingPrice != null) update.listingPrice = fields.listingPrice;
    if (fields.bedrooms != null) update.bedrooms = fields.bedrooms;
    if (fields.bathrooms != null) update.bathrooms = fields.bathrooms;
    if (fields.finishedSquareFeet != null) {
      update.finishedSquareFeet = fields.finishedSquareFeet;
    }
    if (fields.lotSize != null) update.lotSize = fields.lotSize;
    if (fields.yearBuilt != null) update.yearBuilt = fields.yearBuilt;
    if (fields.propertyType) update.propertyType = fields.propertyType;
    if (fields.publicRemarks) update.publicRemarks = fields.publicRemarks;
    if (fields.schoolDistrict) update.schoolDistrict = fields.schoolDistrict;
    if (fields.annualTaxes != null) update.annualTaxes = fields.annualTaxes;
    if (fields.utilities) update.utilities = fields.utilities;
    if (fields.taxInformation) update.taxInformation = fields.taxInformation;

    if (Object.keys(update).length > 0) {
      await this.twin.updatePropertyProfile(propertyId, update, actorId);
    }

    if (fields.features?.length) {
      await this.createFeatureKnowledge(propertyId, fields.features, actorId);
    }

    return extraction;
  }

  async buildPropertyTwin(input: BuildPropertyTwinInput): Promise<BuildPropertyTwinResult> {
    const { propertyId } = input;
    const snapshot = await this.twin.getTwinSnapshot(propertyId);
    if (!snapshot) {
      throw new Error("Property not found");
    }

    let mlsResult: MlsExtractionResult | undefined;
    if (input.mls) {
      mlsResult = await this.ingestMls(propertyId, input.mls, input.actorId);
    }

    const fullPhotos = await this.repository.listPhotos(propertyId);
    const photoResults = [];
    for (const photo of fullPhotos) {
      const result = await extractPhotoIntelligence(this.twin.intelligence, {
        photoId: photo.id,
        storagePath: photo.storage_path,
        storageBucket: photo.storage_bucket,
        existingCaptions: fullPhotos
          .filter((item) => item.id !== photo.id)
          .map((item) => item.caption)
          .filter((caption): caption is string => Boolean(caption)),
      });
      photoResults.push(result);

      for (const suggested of result.suggestedKnowledgeObjects) {
        await this.twin.createKnowledgeObject(
          {
            propertyId,
            category: suggested.category,
            name: suggested.name,
            summary: result.caption,
            confidenceLevel: suggested.confidence,
            verificationSource: "photo",
          },
          input.actorId,
        );
      }
    }

    const documentResults = [];
    const documentIds = await this.repository.listDocuments(propertyId);
    for (const docRef of documentIds) {
      const document = await this.repository.getDocument(docRef.id);
      if (!document) continue;
      const result = await extractDocumentIntelligence(this.twin.intelligence, {
        documentId: document.id,
        title: document.title,
        documentType: document.document_type,
        storagePath: document.storage_path,
        storageBucket: document.storage_bucket,
        mimeType: document.mime_type,
      });
      documentResults.push(result);
    }

    const voiceResults = [];
    for (const transcript of input.voiceTranscripts ?? []) {
      const extracted = await extractVoiceNoteIntelligence(this.twin.intelligence, {
        propertyId,
        transcript,
      });
      voiceResults.push(extracted);
      await this.twin.processVoiceNote(propertyId, transcript);
    }

    const photoCoverage = calculatePhotoCoverage(
      fullPhotos.map((photo) => ({
        detectedRoom: photo.detected_room ?? null,
        tags: photo.tags,
      })),
    );

    for (const suggestion of getMissingCoverageSuggestions(photoCoverage.missingRooms)) {
      await this.repository.upsertSuggestion(
        propertyId,
        "photo_coverage",
        suggestion,
        70,
        { source: "photo_coverage_map" },
      );
    }

    const suggestions = await this.twin.refreshMissingKnowledge(propertyId);
    const health = await this.getPropertyHealth(propertyId);
    const refreshedSnapshot = await this.twin.getTwinSnapshot(propertyId);
    const intelligenceProfile = refreshedSnapshot?.profile ?? snapshot.profile;
    const propertyIntelligence = buildPropertyIntelligence({
      profile: intelligenceProfile,
      mls: mlsResult,
      photos: photoResults.map((result) => ({
        id: result.photoId,
        storagePath: result.storagePath,
        result,
      })),
      documents: documentResults.map((result) => ({
        id: result.documentId,
        title: result.title,
        storagePath: result.storagePath,
        result,
      })),
      voiceNotes: voiceResults.map((result, index) => ({
        transcript: input.voiceTranscripts?.[index] ?? "",
        result,
      })),
    });
    await this.repository.storePropertyIntelligence(propertyId, propertyIntelligence);

    return {
      propertyId,
      completeness: health.completeness,
      quality: health.quality,
      photoCoverage: health.photoCoverage,
      suggestionsRefreshed: suggestions.length,
      assets: {
        ...generatePropertyAssets({
          profile: intelligenceProfile,
          photoCoverage: health.photoCoverage,
          publicRemarks: propertyIntelligence.propertySummary,
          pois: propertyIntelligence.rooms.map((room) => ({ title: room.name, subtitle: room.features[0] ?? null })),
          suggestedFaqs: [
            ...voiceResults.flatMap((result) => result.suggestedFaqs),
            ...propertyIntelligence.possibleBuyerQuestions.slice(0, 6).map((question) => ({
              question,
              answer: propertyIntelligence.agentTalkingPoints[0] ?? propertyIntelligence.propertySummary,
            })),
          ],
          features: propertyIntelligence.keyFeatures,
        }),
        featureSheet: [
          ...propertyIntelligence.keyFeatures,
          ...propertyIntelligence.upgrades,
        ],
        showingNotes: [
          ...propertyIntelligence.agentTalkingPoints,
          ...propertyIntelligence.missingInformation.map((item) => `Verify: ${item}`),
        ].slice(0, 12),
      },
      extractions: {
        mls: mlsResult,
        photos: photoResults,
        documents: documentResults,
        voiceNotes: voiceResults,
        propertyIntelligence,
      },
      builtAt: new Date().toISOString(),
    };
  }

  private async createFeatureKnowledge(
    propertyId: string,
    features: string[],
    actorId?: string | null,
  ) {
    for (const feature of features.slice(0, 10)) {
      await this.twin.createKnowledgeObject(
        {
          propertyId,
          category: "miscellaneous",
          name: feature,
          summary: `MLS feature: ${feature}`,
          confidenceLevel: "likely",
          verificationSource: "mls",
        },
        actorId,
      );
    }
  }
}

export async function createPropertyBuilderService(): Promise<PropertyBuilderService> {
  return PropertyBuilderService.create();
}
