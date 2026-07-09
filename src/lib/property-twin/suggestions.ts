import { detectMissingItems } from "@/lib/property-twin/completeness";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type { AiSuggestion } from "@/lib/property-twin/types";

const SUGGESTION_PRIORITY: Record<string, number> = {
  missing_poi: 100,
  missing_primary_photo: 95,
  missing_hvac_age: 90,
  missing_roof_warranty: 85,
  missing_backyard_photos: 80,
  missing_electrical: 75,
  missing_dishwasher_model: 70,
  unknown_flooring: 65,
  missing_documents: 60,
  missing_neighborhood: 55,
  voice_note_recommendation: 50,
};

export class SuggestionService {
  constructor(private readonly repository: PropertyTwinRepository) {}

  async refreshSuggestions(propertyId: string): Promise<AiSuggestion[]> {
    const [profile, systems, appliances, photos, documents, pois, facts, hasNeighborhood] =
      await Promise.all([
        this.repository.getProperty(propertyId),
        this.repository.listSystems(propertyId),
        this.repository.listAppliances(propertyId),
        this.repository.listPhotos(propertyId),
        this.repository.listDocuments(propertyId),
        this.repository.listPois(propertyId),
        this.repository.listCurrentFacts(propertyId),
        this.repository.hasNeighborhoodIntelligence(propertyId),
      ]);

    if (!profile) {
      throw new Error("Property not found");
    }

    const missingItems = detectMissingItems({
      profile,
      systems,
      appliances,
      photos,
      documents,
      pois,
      hasNeighborhood,
      facts,
    });

    const suggestions: AiSuggestion[] = [];

    for (const item of missingItems) {
      const mapped = mapMissingItemToSuggestion(item);
      if (!mapped) {
        continue;
      }

      const suggestion = await this.repository.upsertSuggestion(
        propertyId,
        mapped.type,
        mapped.message,
        mapped.priority,
        { source: "missing_knowledge_detection" },
      );
      suggestions.push(suggestion);
    }

    const flexSpace = facts.find((fact) =>
      fact.factKey.toLowerCase().includes("flex"),
    );
    if (flexSpace) {
      const suggestion = await this.repository.upsertSuggestion(
        propertyId,
        "voice_note_recommendation",
        "Record a voice note for the Flex Space.",
        SUGGESTION_PRIORITY.voice_note_recommendation ?? 50,
        { knowledgeObjectHint: "flex_space" },
      );
      suggestions.push(suggestion);
    }

    if (photos.some((photo) => photo.detected_room?.toLowerCase().includes("garage"))) {
      // Garage photos exist — no upload suggestion needed.
    } else {
      const suggestion = await this.repository.upsertSuggestion(
        propertyId,
        "missing_garage_photos",
        "Upload garage photos.",
        78,
        { source: "photo_coverage" },
      );
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  async acceptSuggestion(suggestionId: string, actorId?: string | null) {
    const suggestion = await this.repository.updateSuggestionStatus(suggestionId, "accepted");
    await this.repository.writeAuditLog({
      propertyId: suggestion.propertyId,
      entityType: "ai_suggestion",
      entityId: suggestion.id,
      action: "suggestion_accept",
      actorId,
      newData: { status: "accepted" },
    });
    return suggestion;
  }

  async dismissSuggestion(suggestionId: string, actorId?: string | null) {
    const suggestion = await this.repository.updateSuggestionStatus(suggestionId, "dismissed");
    await this.repository.writeAuditLog({
      propertyId: suggestion.propertyId,
      entityType: "ai_suggestion",
      entityId: suggestion.id,
      action: "suggestion_dismiss",
      actorId,
      newData: { status: "dismissed" },
    });
    return suggestion;
  }

  async listPending(propertyId: string) {
    return this.repository.listSuggestions(propertyId, "pending");
  }
}

function mapMissingItemToSuggestion(
  item: string,
): { type: string; message: string; priority: number } | null {
  const normalized = item.toLowerCase();

  if (normalized.includes("hvac age")) {
    return {
      type: "missing_hvac_age",
      message: "Add HVAC maintenance records and verify system age.",
      priority: SUGGESTION_PRIORITY.missing_hvac_age ?? 90,
    };
  }

  if (normalized.includes("roof warranty")) {
    return {
      type: "missing_roof_warranty",
      message: "Verify roof installation date and upload warranty documentation.",
      priority: SUGGESTION_PRIORITY.missing_roof_warranty ?? 85,
    };
  }

  if (normalized.includes("backyard")) {
    return {
      type: "missing_backyard_photos",
      message: "Upload backyard photos.",
      priority: SUGGESTION_PRIORITY.missing_backyard_photos ?? 80,
    };
  }

  if (normalized.includes("electrical")) {
    return {
      type: "missing_electrical",
      message: "Add electrical panel and service information.",
      priority: SUGGESTION_PRIORITY.missing_electrical ?? 75,
    };
  }

  if (normalized.includes("dishwasher model")) {
    return {
      type: "missing_dishwasher_model",
      message: "Add dishwasher model and warranty details.",
      priority: SUGGESTION_PRIORITY.missing_dishwasher_model ?? 70,
    };
  }

  if (normalized.includes("flooring")) {
    return {
      type: "unknown_flooring",
      message: "Verify flooring type and installation date.",
      priority: SUGGESTION_PRIORITY.unknown_flooring ?? 65,
    };
  }

  if (normalized.includes("points of interest")) {
    return {
      type: "missing_poi",
      message: "Create at least one point of interest for the tour.",
      priority: SUGGESTION_PRIORITY.missing_poi ?? 100,
    };
  }

  if (normalized.includes("documents")) {
    return {
      type: "missing_documents",
      message: "Upload property survey or inspection report.",
      priority: SUGGESTION_PRIORITY.missing_documents ?? 60,
    };
  }

  if (normalized.includes("neighborhood")) {
    return {
      type: "missing_neighborhood",
      message: "Add neighborhood intelligence and school information.",
      priority: SUGGESTION_PRIORITY.missing_neighborhood ?? 55,
    };
  }

  return null;
}
