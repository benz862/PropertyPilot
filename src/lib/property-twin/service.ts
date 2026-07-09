import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { CompletenessService } from "@/lib/property-twin/completeness";
import { mapDocumentType } from "@/lib/property-twin/mappers";
import { KnowledgeGraphService } from "@/lib/property-twin/knowledge-graph";
import { IntelligenceService } from "@/lib/property-twin/intelligence";
import { PropertyTwinRepository } from "@/lib/property-twin/repository";
import { PublishingService } from "@/lib/property-twin/publishing";
import { SuggestionService } from "@/lib/property-twin/suggestions";
import type {
  CreateKnowledgeFactInput,
  CreateKnowledgeObjectInput,
  CreatePropertyInput,
  CreateRelationshipInput,
  PropertyTwinSnapshot,
  UpdatePropertyProfileInput,
} from "@/lib/property-twin/types";

/**
 * PropertyTwinService is the single entry point for all Digital Property Twin operations.
 * AI layers (PRD-003) must consume this service — never raw database tables.
 */
export class PropertyTwinService {
  private readonly repository: PropertyTwinRepository;
  readonly knowledgeGraph: KnowledgeGraphService;
  readonly completeness: CompletenessService;
  readonly publishing: PublishingService;
  readonly suggestions: SuggestionService;
  readonly intelligence: IntelligenceService;

  constructor(repository: PropertyTwinRepository) {
    this.repository = repository;
    this.knowledgeGraph = new KnowledgeGraphService(repository);
    this.completeness = new CompletenessService(repository);
    this.publishing = new PublishingService(repository, this.completeness);
    this.suggestions = new SuggestionService(repository);
    this.intelligence = new IntelligenceService(repository);
  }

  static async create(): Promise<PropertyTwinService> {
    const client = await createServerSupabaseClient();
    return new PropertyTwinService(new PropertyTwinRepository(client));
  }

  async createProperty(input: CreatePropertyInput) {
    const property = await this.repository.createProperty(input);

    const [voicePersonality, aiPolicy] = await Promise.all([
      this.repository.createDefaultVoicePersonality(property.id),
      this.repository.createDefaultAiPolicy(property.id),
    ]);

    await this.repository.linkPropertyConfig(property.id, voicePersonality.id, aiPolicy.id);

    await this.repository.writeAuditLog({
      propertyId: property.id,
      entityType: "property",
      entityId: property.id,
      action: "create",
      actorId: input.ownerId,
      newData: { street: property.street, city: property.city },
    });

    return this.repository.getProperty(property.id);
  }

  async getProperty(propertyId: string) {
    return this.repository.getProperty(propertyId);
  }

  async updatePropertyProfile(
    propertyId: string,
    input: UpdatePropertyProfileInput,
    actorId?: string | null,
  ) {
    const previous = await this.repository.getProperty(propertyId);
    const updated = await this.repository.updateProperty(propertyId, input);

    await this.repository.writeAuditLog({
      propertyId,
      entityType: "property",
      entityId: propertyId,
      action: "update",
      actorId,
      previousData: previous ? { ...previous } : null,
      newData: { ...updated },
    });

    return updated;
  }

  async softDeleteProperty(propertyId: string, actorId?: string | null) {
    await this.repository.softDeleteProperty(propertyId);
    await this.repository.writeAuditLog({
      propertyId,
      entityType: "property",
      entityId: propertyId,
      action: "soft_delete",
      actorId,
    });
  }

  async createKnowledgeObject(input: CreateKnowledgeObjectInput, actorId?: string | null) {
    const object = await this.repository.createKnowledgeObject(input);
    await this.repository.writeAuditLog({
      propertyId: input.propertyId,
      entityType: "knowledge_object",
      entityId: object.id,
      action: "create",
      actorId,
      newData: { name: object.name, category: object.category },
    });
    return object;
  }

  async addFact(input: CreateKnowledgeFactInput, actorId?: string | null) {
    const fact = await this.repository.createKnowledgeFact({
      ...input,
      createdBy: actorId ?? input.createdBy ?? null,
    });

    await this.repository.writeAuditLog({
      propertyId: input.propertyId,
      entityType: "knowledge_fact",
      entityId: fact.id,
      action: fact.versionNumber > 1 ? "retire" : "create",
      actorId,
      newData: {
        factKey: fact.factKey,
        factValue: fact.factValue,
        versionNumber: fact.versionNumber,
        verificationLevel: fact.verificationLevel,
      },
    });

    return fact;
  }

  async verifyFact(
    propertyId: string,
    knowledgeObjectId: string,
    factKey: string,
    factValue: string,
    actorId?: string | null,
  ) {
    return this.addFact(
      {
        propertyId,
        knowledgeObjectId,
        factKey,
        factValue,
        verificationLevel: "verified",
        source: "agent",
        createdBy: actorId ?? null,
      },
      actorId,
    );
  }

  async getFactHistory(knowledgeObjectId: string, factKey: string) {
    return this.repository.listFactHistory(knowledgeObjectId, factKey);
  }

  async linkKnowledgeObjects(input: CreateRelationshipInput, actorId?: string | null) {
    const relationship = await this.repository.createRelationship(input);
    await this.repository.writeAuditLog({
      propertyId: input.propertyId,
      entityType: "knowledge_relationship",
      entityId: relationship.id,
      action: "create",
      actorId,
      newData: {
        sourceObjectId: relationship.sourceObjectId,
        targetObjectId: relationship.targetObjectId,
        relationshipType: relationship.relationshipType,
      },
    });
    return relationship;
  }

  async getTwinSnapshot(propertyId: string): Promise<PropertyTwinSnapshot | null> {
    const profile = await this.repository.getProperty(propertyId);
    if (!profile) {
      return null;
    }

    const [
      knowledgeObjects,
      facts,
      relationships,
      systems,
      appliances,
      photos,
      documents,
      pois,
      timeline,
      completeness,
      suggestions,
    ] = await Promise.all([
      this.repository.listKnowledgeObjects(propertyId),
      this.repository.listCurrentFacts(propertyId),
      this.repository.listRelationships(propertyId),
      this.repository.listSystems(propertyId),
      this.repository.listAppliances(propertyId),
      this.repository.listPhotos(propertyId),
      this.repository.listDocuments(propertyId),
      this.repository.listPois(propertyId),
      this.repository.listTimeline(propertyId),
      this.completeness.calculate(propertyId),
      this.suggestions.listPending(propertyId),
    ]);

    return {
      profile,
      knowledgeObjects,
      facts,
      relationships,
      systems: systems.map((system) => ({
        id: system.id,
        name: system.name,
        manufacturer: system.manufacturer,
        ageYears: system.age_years,
      })),
      appliances: appliances.map((appliance) => ({
        id: appliance.id,
        name: appliance.name,
        manufacturer: appliance.manufacturer,
        model: appliance.model,
      })),
      photos: photos.map((photo) => ({
        id: photo.id,
        caption: photo.caption,
        isPrimary: photo.is_primary,
        detectedRoom: photo.detected_room,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        title: document.title,
        documentType: mapDocumentType(document.document_type),
      })),
      pois: pois.map((poi) => ({
        id: poi.id,
        title: poi.title,
        displayOrder: poi.display_order,
      })),
      timeline,
      completeness,
      suggestions,
    };
  }

  async refreshMissingKnowledge(propertyId: string) {
    return this.suggestions.refreshSuggestions(propertyId);
  }

  async publishProperty(propertyId: string, actorId?: string | null) {
    const validation = await this.publishing.validate(propertyId);
    if (!validation.canPublish) {
      throw new Error(validation.errors.join("; "));
    }

    const published = await this.repository.publishProperty(propertyId);
    await this.repository.writeAuditLog({
      propertyId,
      entityType: "property",
      entityId: propertyId,
      action: "publish",
      actorId,
      newData: { status: published.status, publishedAt: published.publishedAt },
    });

    return published;
  }

  /** Primary AI retrieval interface — verified/likely facts only, never retired. */
  async getKnowledgeForAi(propertyId: string) {
    const [graph, verifiedFacts, snapshot] = await Promise.all([
      this.knowledgeGraph.queryGraph(propertyId, { maxDepth: 2 }),
      this.knowledgeGraph.getVerifiedFactsForAi(propertyId),
      this.getTwinSnapshot(propertyId),
    ]);

    return {
      graph,
      verifiedFacts,
      profile: snapshot?.profile ?? null,
      pois: snapshot?.pois ?? [],
      timeline: snapshot?.timeline ?? [],
    };
  }

  async analyzePhoto(photoId: string) {
    const photo = await this.repository.getPhoto(photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    const existingPhotos = await this.repository.listPhotos(photo.property_id);
    const existingCaptions = existingPhotos
      .filter((item) => item.id !== photoId)
      .map((item) => item.caption)
      .filter((caption): caption is string => Boolean(caption));

    return this.intelligence.analyzePhoto({
      photoId,
      storagePath: photo.storage_path,
      existingCaptions,
    });
  }

  async analyzeDocument(documentId: string) {
    const document = await this.repository.getDocument(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    return this.intelligence.analyzeDocument({
      documentId,
      title: document.title,
      documentType: document.document_type,
      storagePath: document.storage_path,
    });
  }

  async processVoiceNote(
    propertyId: string,
    transcript: string,
    storagePath?: string | null,
  ) {
    const result = await this.intelligence.analyzeVoiceNote({
      propertyId,
      transcript,
      storagePath,
    });

    for (const object of result.knowledgeObjects) {
      const knowledgeObject = await this.createKnowledgeObject({
        propertyId,
        category: object.category,
        name: object.name,
        summary: object.summary,
        confidenceLevel: "likely",
        verificationSource: "voice_note",
      });

      for (const fact of object.facts) {
        await this.addFact({
          propertyId,
          knowledgeObjectId: knowledgeObject.id,
          factKey: fact.key,
          factValue: fact.value,
          verificationLevel: fact.verificationLevel,
          source: "voice_note",
        });
      }
    }

    await this.refreshMissingKnowledge(propertyId);
    return result;
  }
}

export async function createPropertyTwinService(): Promise<PropertyTwinService> {
  return PropertyTwinService.create();
}
