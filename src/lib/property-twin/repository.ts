import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  isActiveRow,
  mapKnowledgeFact,
  mapKnowledgeObject,
  mapProperty,
  mapRelationship,
  mapSuggestion,
  mapTimelineEvent,
} from "@/lib/property-twin/mappers";
import type {
  CreateKnowledgeFactInput,
  CreateKnowledgeObjectInput,
  KnowledgeCategory,
  CreatePropertyInput,
  CreateRelationshipInput,
  PropertyProfile,
  TwinAuditAction,
  UpdatePropertyProfileInput,
} from "@/lib/property-twin/types";
import type { PropertyIntelligence } from "@/lib/property-intelligence";

export type TwinSupabaseClient = SupabaseClient<Database>;

export class PropertyTwinRepository {
  constructor(private readonly client: TwinSupabaseClient) {}

  async createProperty(input: CreatePropertyInput): Promise<PropertyProfile> {
    const insertRow = {
      owner_id: input.ownerId,
      street: input.street,
      city: input.city,
      province_state: input.provinceState,
      postal_code: input.postalCode,
      country: input.country ?? "US",
      property_type: "single_family" as const,
      slug: `${input.street}-${input.city}-${Date.now()}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    };

    const { data, error } = await this.client
      .from("properties")
      .insert(insertRow)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create property");
    }

    return mapProperty(data);
  }

  async getProperty(propertyId: string): Promise<PropertyProfile | null> {
    const { data, error } = await this.client
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapProperty(data) : null;
  }

  async updateProperty(
    propertyId: string,
    input: UpdatePropertyProfileInput,
  ): Promise<PropertyProfile> {
    const { data, error } = await this.client
      .from("properties")
      .update({
        mls_number: input.mlsNumber,
        street: input.street,
        city: input.city,
        province_state: input.provinceState,
        postal_code: input.postalCode,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
        property_type:
          input.propertyType != null
            ? (input.propertyType as import("@/types/database").PropertyType)
            : undefined,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        finished_sq_ft: input.finishedSquareFeet,
        lot_size_sq_ft: input.lotSize,
        year_built: input.yearBuilt,
        annual_taxes: input.annualTaxes,
        hoa_fee:
          input.hoa && typeof input.hoa.fee === "number"
            ? input.hoa.fee
            : undefined,
        school_district: input.schoolDistrict,
        public_remarks: input.publicRemarks,
        private_notes: input.privateNotes,
        listing_price: input.listingPrice,
        listing_status: input.listingStatus,
        agent_name: input.agentName,
        brokerage: input.brokerage,
        utilities: input.utilities,
        tax_information: input.taxInformation,
        property_description: input.propertyDescription,
      })
      .eq("id", propertyId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update property");
    }

    return mapProperty(data);
  }

  async softDeleteProperty(propertyId: string): Promise<void> {
    const { error } = await this.client
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", propertyId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async createKnowledgeObject(input: CreateKnowledgeObjectInput) {
    const { data, error } = await this.client
      .from("knowledge_objects")
      .insert({
        property_id: input.propertyId,
        category: toStoredKnowledgeCategory(input.category),
        name: input.name,
        summary: input.summary ?? null,
        confidence_level: verificationToConfidence(input.confidenceLevel ?? "unknown"),
        verification_source: input.verificationSource ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create knowledge object");
    }

    return mapKnowledgeObject(data);
  }

  async listKnowledgeObjects(propertyId: string) {
    const { data, error } = await this.client
      .from("knowledge_objects")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapKnowledgeObject);
  }

  async softDeleteKnowledgeObject(objectId: string): Promise<void> {
    const { error } = await this.client
      .from("knowledge_objects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", objectId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentFact(knowledgeObjectId: string, factKey: string) {
    const { data, error } = await this.client
      .from("knowledge_facts")
      .select("*")
      .eq("knowledge_object_id", knowledgeObjectId)
      .eq("fact_key", factKey)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapKnowledgeFact(data) : null;
  }

  async createKnowledgeFact(input: CreateKnowledgeFactInput) {
    const existing = await this.getCurrentFact(input.knowledgeObjectId, input.factKey);
    const versionNumber = existing ? existing.versionNumber + 1 : 1;

    if (existing) {
      const { error: retireError } = await this.client
        .from("knowledge_facts")
        .update({
          is_current: false,
          retired_at: new Date().toISOString(),
          verification_level: "retired",
        })
        .eq("id", existing.id);

      if (retireError) {
        throw new Error(retireError.message);
      }
    }

    const { data, error } = await this.client
      .from("knowledge_facts")
      .insert({
        property_id: input.propertyId,
        knowledge_object_id: input.knowledgeObjectId,
        fact_key: input.factKey,
        fact_value: input.factValue,
        version_number: versionNumber,
        verification_level: input.verificationLevel ?? "unknown",
        source: input.source ?? "manual_entry",
        source_reference: input.sourceReference ?? null,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create knowledge fact");
    }

    return mapKnowledgeFact(data);
  }

  async listCurrentFacts(propertyId: string) {
    const { data, error } = await this.client
      .from("knowledge_facts")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_current", true)
      .is("deleted_at", null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapKnowledgeFact);
  }

  async listFactHistory(knowledgeObjectId: string, factKey: string) {
    const { data, error } = await this.client
      .from("knowledge_facts")
      .select("*")
      .eq("knowledge_object_id", knowledgeObjectId)
      .eq("fact_key", factKey)
      .is("deleted_at", null)
      .order("version_number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapKnowledgeFact);
  }

  async createRelationship(input: CreateRelationshipInput) {
    const { data, error } = await this.client
      .from("knowledge_relationships")
      .insert({
        property_id: input.propertyId,
        source_object_id: input.sourceObjectId,
        target_object_id: input.targetObjectId,
        relationship_type: input.relationshipType ?? "related_to",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create relationship");
    }

    return mapRelationship(data);
  }

  async listRelationships(propertyId: string) {
    const { data, error } = await this.client
      .from("knowledge_relationships")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRelationship);
  }

  async listSystems(propertyId: string) {
    const { data, error } = await this.client
      .from("systems")
      .select("id, system_type, manufacturer, age_years")
      .eq("property_id", propertyId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((system) => ({
      id: system.id,
      name: system.system_type,
      manufacturer: system.manufacturer,
      age_years: system.age_years,
    }));
  }

  async listAppliances(propertyId: string) {
    const { data, error } = await this.client
      .from("appliances")
      .select("id, name, manufacturer, model")
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Array<{
      id: string;
      name: string;
      manufacturer: string | null;
      model: string | null;
    }>;
  }

  async listPhotos(propertyId: string) {
    const { data, error } = await this.client
      .from("photos")
      .select("id, caption, detected_room, storage_bucket, storage_path, tags, display_order")
      .eq("property_id", propertyId)
      .order("display_order");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((photo) => ({
      id: photo.id,
      caption: photo.caption,
      is_primary: photo.display_order === 0,
      detected_room: photo.detected_room ?? null,
      storage_bucket: photo.storage_bucket,
      storage_path: photo.storage_path,
      tags: photo.tags,
    }));
  }

  async listDocuments(propertyId: string) {
    const { data, error } = await this.client
      .from("documents")
      .select("id, title, document_type")
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Array<{
      id: string;
      title: string;
      document_type: string;
    }>;
  }

  async listPois(propertyId: string) {
    const { data, error } = await this.client
      .from("points_of_interest")
      .select("id, title, display_order")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("display_order");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Array<{
      id: string;
      title: string;
      display_order: number;
    }>;
  }

  async listTimeline(propertyId: string) {
    const { data, error } = await this.client
      .from("property_timeline_events")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("event_date", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapTimelineEvent);
  }

  async hasNeighborhoodIntelligence(propertyId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("neighborhood_intelligence")
      .select("id")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).length > 0;
  }

  async listSuggestions(propertyId: string, status?: "pending" | "accepted" | "dismissed") {
    let query = this.client
      .from("ai_suggestions")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("priority", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapSuggestion);
  }

  async upsertSuggestion(
    propertyId: string,
    suggestionType: string,
    message: string,
    priority: number,
    metadata: Record<string, unknown> = {},
  ) {
    const existing = await this.client
      .from("ai_suggestions")
      .select("*")
      .eq("property_id", propertyId)
      .eq("suggestion_type", suggestionType)
      .eq("status", "pending")
      .is("deleted_at", null)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const { data, error } = await this.client
        .from("ai_suggestions")
        .update({ message, priority, metadata })
        .eq("id", existing.data.id)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to update suggestion");
      }

      return mapSuggestion(data);
    }

    const { data, error } = await this.client
      .from("ai_suggestions")
      .insert({
        property_id: propertyId,
        suggestion_type: suggestionType,
        message,
        priority,
        metadata,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create suggestion");
    }

    return mapSuggestion(data);
  }

  async updateSuggestionStatus(
    suggestionId: string,
    status: "accepted" | "dismissed",
  ) {
    const { data, error } = await this.client
      .from("ai_suggestions")
      .update({ status })
      .eq("id", suggestionId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update suggestion status");
    }

    return mapSuggestion(data);
  }

  async createDefaultVoicePersonality(propertyId: string) {
    const { data, error } = await this.client
      .from("voice_personalities")
      .insert({ property_id: propertyId, voice_id: "alloy" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create voice personality");
    }

    return data;
  }

  async createDefaultAiPolicy(propertyId: string) {
    const { data, error } = await this.client
      .from("ai_policies")
      .insert({
        property_id: propertyId,
        rules: [
          "Never guess or speculate about property facts.",
          "Always disclose uncertainty when information is unavailable.",
        ],
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create AI policy");
    }

    return data;
  }

  async linkPropertyConfig(
    propertyId: string,
    voicePersonalityId: string,
    aiPolicyId: string,
  ) {
    const { error } = await this.client
      .from("properties")
      .update({
        voice_personality_id: voicePersonalityId,
        ai_policy_id: aiPolicyId,
      })
      .eq("id", propertyId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async publishProperty(propertyId: string) {
    const { data, error } = await this.client
      .from("properties")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", propertyId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to publish property");
    }

    return mapProperty(data);
  }

  async storePhotoAnalysis(
    photoId: string,
    analysis: {
      caption: string | null;
      detectedFeatures: string[];
      detectedRoom: string | null;
      detectedObjects: string[];
      suggestedKnowledgeObjects: unknown[];
      qualityScore: number | null;
      isDuplicate: boolean;
    },
  ) {
    const { data, error } = await this.client
      .from("photos")
      .update({
        caption: analysis.caption,
        detected_features: analysis.detectedFeatures,
        detected_room: analysis.detectedRoom,
        detected_objects: analysis.detectedObjects,
        suggested_knowledge_objects: analysis.suggestedKnowledgeObjects,
        quality_score: analysis.qualityScore,
        is_duplicate: analysis.isDuplicate,
        analysis_status: "completed",
      })
      .eq("id", photoId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to store photo analysis");
    }

    return data;
  }

  async storeDocumentExtraction(
    documentId: string,
    extractedData: Record<string, unknown>,
    requiresReview: boolean,
    searchableContent?: string | null,
  ) {
    const { data, error } = await this.client
      .from("documents")
      .update({
        extracted_data: extractedData,
        requires_review: requiresReview,
        searchable_content: searchableContent ?? undefined,
      })
      .eq("id", documentId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to store document extraction");
    }

    return data;
  }

  async storeVoiceNoteIntelligence(
    propertyId: string,
    transcript: string,
    intelligence: {
      structuredKnowledge: unknown;
      suggestedFaqs: unknown[];
      suggestedBuyerQuestions: string[];
      missingInformation: string[];
      requiresVerification: string[];
    },
    storagePath?: string | null,
  ) {
    const { data, error } = await this.client
      .from("voice_notes")
      .insert({
        property_id: propertyId,
        storage_path: storagePath ?? null,
        transcript,
        structured_knowledge: intelligence.structuredKnowledge as Record<string, unknown>,
        suggested_faqs: intelligence.suggestedFaqs,
        suggested_buyer_questions: intelligence.suggestedBuyerQuestions,
        missing_information: intelligence.missingInformation,
        requires_verification: intelligence.requiresVerification,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to store voice note intelligence");
    }

    return data;
  }

  async storePropertyIntelligence(
    propertyId: string,
    intelligence: PropertyIntelligence,
  ) {
    const { data, error } = await this.client
      .from("property_intelligence")
      .upsert(
        {
          property_id: propertyId,
          intelligence: intelligence as unknown as Record<string, unknown>,
          source_map: intelligence.sourceMap as unknown as Record<string, unknown>[],
          missing_information: intelligence.missingInformation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "property_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to store property intelligence");
    }

    return data;
  }

  async writeAuditLog(input: {
    propertyId: string;
    entityType: string;
    entityId: string;
    action: TwinAuditAction;
    actorId?: string | null;
    previousData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
  }) {
    const { error } = await this.client.from("twin_audit_log").insert({
      property_id: input.propertyId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      actor_id: input.actorId ?? null,
      previous_data: input.previousData ?? null,
      new_data: input.newData ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async getPhoto(photoId: string) {
    const { data, error } = await this.client
      .from("photos")
      .select("*")
      .eq("id", photoId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data && isActiveRow(data) ? data : null;
  }

  async getDocument(documentId: string) {
    const { data, error } = await this.client
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  async hasVoicePersonality(propertyId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("voice_personalities")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data);
  }

  async hasAiPolicy(propertyId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("ai_policies")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data);
  }
}

type StoredKnowledgeCategory = Database["public"]["Enums"]["knowledge_category"];

/**
 * The intelligence layer uses broader semantic categories than the original
 * Postgres enum. Keep persistence compatible until the enum is expanded.
 */
export function toStoredKnowledgeCategory(
  category: KnowledgeCategory | StoredKnowledgeCategory,
): StoredKnowledgeCategory {
  const aliases: Partial<Record<KnowledgeCategory, StoredKnowledgeCategory>> = {
    structural: "foundation",
    mechanical: "hvac",
    plumbing: "utilities",
    landscape: "landscaping",
    appliances: "appliance",
  };

  const supported: StoredKnowledgeCategory[] = [
    "roof",
    "hvac",
    "kitchen",
    "bathroom",
    "pool",
    "electrical",
    "foundation",
    "garage",
    "flex_space",
    "windows",
    "driveway",
    "landscaping",
    "deck",
    "fireplace",
    "solar",
    "appliance",
    "well",
    "septic",
    "security",
    "neighborhood",
    "schools",
    "utilities",
    "other",
  ];

  if (supported.includes(category as StoredKnowledgeCategory)) {
    return category as StoredKnowledgeCategory;
  }

  return aliases[category as KnowledgeCategory] ?? "other";
}

function verificationToConfidence(
  level: import("@/lib/property-twin/types").VerificationLevel,
): "high" | "medium" | "low" {
  if (level === "verified") return "high";
  if (level === "likely") return "medium";
  return "low";
}
