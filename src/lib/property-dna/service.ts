import type { SupabaseClient } from "@supabase/supabase-js";

import type { PropertyIntelligence } from "@/lib/property-intelligence";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import type {
  Database,
  Document,
  KnowledgeObject,
  Photo,
  Property,
  PropertyAssetRow,
  PropertyIntelligenceRow,
  PropertyRoom,
  VoiceNoteRow,
} from "@/types/database";

import { assemblePropertyDNA, type AssemblePropertyDNAInput } from "./assemble";
import { generateRecommendations, type Recommendation } from "./recommendations";
import type { GeneratedAssetRecord, GeneratedAssetType, PropertyDNA } from "./types";

type Client = SupabaseClient<Database>;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * The one read surface for Property DNA. Loads every knowledge source and
 * composes the normalized DNA object that all other engines consume.
 */
export class PropertyDNAService {
  constructor(private readonly client: Client) {}

  async getPropertyDNA(slugOrId: string): Promise<PropertyDNA | null> {
    const property = await this.findProperty(slugOrId);
    if (!property) return null;
    return this.assembleFor(property);
  }

  async getRecommendations(slugOrId: string): Promise<Recommendation[]> {
    const dna = await this.getPropertyDNA(slugOrId);
    if (!dna) return [];
    return generateRecommendations(dna);
  }

  /** Rebuild Property DNA, bump version, mark studio assets stale, refresh recommendations. */
  async rebuildPropertyDNA(propertyId: string): Promise<{
    dna: PropertyDNA;
    recommendations: Recommendation[];
  }> {
    const property = await this.findProperty(propertyId);
    if (!property) throw new Error("Property not found");

    const newVersion = (property.dna_version ?? 1) + 1;
    await this.client.from("properties").update({ dna_version: newVersion }).eq("id", propertyId);
    await this.client
      .from("property_assets")
      .update({ status: "needs_refresh" })
      .eq("property_id", propertyId);

    const refreshed: Property = { ...property, dna_version: newVersion };
    const dna = await this.assembleFor(refreshed);
    const recommendations = generateRecommendations(dna);
    dna.health.recommendations = recommendations.map((item) => item.title);
    return { dna, recommendations };
  }

  private async assembleFor(property: Property): Promise<PropertyDNA> {
    const [rooms, intelligence, knowledgeObjects, documents, voiceNotes, photos, questions, assets, agent] =
      await Promise.all([
        this.listRooms(property.id),
        this.getIntelligence(property.id),
        this.listKnowledgeObjects(property.id),
        this.listDocuments(property.id),
        this.listVoiceNotes(property.id),
        this.listPhotos(property.id),
        this.listBuyerQuestions(property.id),
        this.listAssets(property.id),
        this.getAgentContact(property.owner_id),
      ]);

    const primaryPhoto = photos.find((photo) => photo.is_primary) ?? photos[0] ?? null;
    const heroImageUrl = primaryPhoto ? getPhotoPublicUrl(primaryPhoto) : null;

    const input: AssemblePropertyDNAInput = {
      property: {
        id: property.id,
        slug: property.slug,
        street: property.street,
        city: property.city,
        provinceState: property.province_state,
        price: property.listing_price,
        beds: property.bedrooms,
        baths: property.bathrooms,
        squareFeet: property.finished_sq_ft,
        lotSize: property.lot_size_sq_ft,
        yearBuilt: property.year_built,
        propertyType: property.property_type,
        schoolDistrict: property.school_district,
        mlsDescription: property.public_remarks,
        description: property.property_description ?? null,
        status: property.status,
        publishedAt: property.published_at ?? null,
        agentName: property.agent_name ?? null,
        agentEmail: agent.email,
        agentPhone: agent.phone,
        heroImageUrl,
      },
      intelligence: intelligence.intelligence,
      intelligenceUpdatedAt: intelligence.updatedAt,
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        features: room.features,
        updates: room.updates,
        includedItems: room.included_items,
        talkingPoints: room.talking_points,
        cautions: room.cautions,
      })),
      knowledgeObjects: knowledgeObjects.map((ko) => ({
        id: ko.id,
        name: ko.name,
        category: ko.category,
        summary: ko.summary,
        verifiedFacts: ko.verified_facts,
      })),
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        storagePath: doc.storage_path,
        documentType: doc.document_type,
        extractedText: doc.searchable_content,
      })),
      voiceNotes: voiceNotes.map((note) => ({ id: note.id, transcript: note.transcript })),
      photos: photos.map((photo) => ({
        id: photo.id,
        storagePath: photo.storage_path,
        caption: photo.caption,
        detectedRoom: photo.detected_room ?? null,
        isPrimary: Boolean(photo.is_primary),
        detectedFeatures: photo.detected_features,
      })),
      buyerQuestions: questions.map((question) => ({
        id: question.id,
        selectedRoom: question.selected_room,
        question: question.question,
        normalizedQuestion: question.normalized_question,
        answer: question.answer,
        confidence: question.confidence,
        needsAgentFollowup: question.needs_agent_followup,
        createdAt: question.created_at,
      })),
      generatedAssets: assets.map(mapAssetRecord),
      dnaVersion: property.dna_version ?? 1,
    };

    return assemblePropertyDNA(input);
  }

  private async findProperty(slugOrId: string): Promise<Property | null> {
    const base = this.client.from("properties").select("*").is("deleted_at", null);
    const { data, error } = await (isUuid(slugOrId)
      ? base.eq("id", slugOrId).maybeSingle()
      : base.eq("slug", slugOrId).maybeSingle());
    if (error) throw new Error(error.message);
    return data;
  }

  private async listRooms(propertyId: string): Promise<PropertyRoom[]> {
    const { data } = await this.client.from("property_rooms").select("*").eq("property_id", propertyId).order("name");
    return data ?? [];
  }

  private async getIntelligence(
    propertyId: string,
  ): Promise<{ intelligence: PropertyIntelligence | null; updatedAt: string | null }> {
    const { data } = await this.client
      .from("property_intelligence")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();
    if (!data) return { intelligence: null, updatedAt: null };
    return { intelligence: coerceIntelligence(data), updatedAt: data.updated_at };
  }

  private async listKnowledgeObjects(propertyId: string): Promise<KnowledgeObject[]> {
    const { data } = await this.client
      .from("knowledge_objects")
      .select("id, name, summary, category, verified_facts, confidence_level")
      .eq("property_id", propertyId)
      .is("deleted_at", null);
    return (data as KnowledgeObject[] | null) ?? [];
  }

  private async listDocuments(propertyId: string): Promise<Document[]> {
    const { data } = await this.client
      .from("documents")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null);
    return data ?? [];
  }

  private async listVoiceNotes(propertyId: string): Promise<VoiceNoteRow[]> {
    const { data } = await this.client
      .from("voice_notes")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null);
    return data ?? [];
  }

  private async listPhotos(propertyId: string): Promise<Photo[]> {
    const { data } = await this.client
      .from("photos")
      .select("*")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("display_order");
    return data ?? [];
  }

  private async listBuyerQuestions(propertyId: string) {
    const { data } = await this.client
      .from("buyer_questions")
      .select(
        "id, selected_room, question, normalized_question, answer, confidence, needs_agent_followup, created_at",
      )
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  }

  private async listAssets(propertyId: string): Promise<PropertyAssetRow[]> {
    const { data } = await this.client.from("property_assets").select("*").eq("property_id", propertyId);
    return data ?? [];
  }

  private async getAgentContact(ownerId: string | null): Promise<{ email: string | null; phone: string | null }> {
    if (!ownerId) return { email: null, phone: null };
    const { data } = await this.client.from("profiles").select("email, phone").eq("id", ownerId).maybeSingle();
    return { email: data?.email ?? null, phone: data?.phone ?? null };
  }
}

export function createPropertyDNAService(client: Client): PropertyDNAService {
  return new PropertyDNAService(client);
}

function mapAssetRecord(row: PropertyAssetRow): GeneratedAssetRecord {
  return {
    id: row.id,
    type: row.asset_type as GeneratedAssetType,
    title: row.title,
    content: row.content,
    fileUrl: row.file_url,
    lastGeneratedAt: row.last_generated_at,
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function coerceIntelligence(row: PropertyIntelligenceRow): PropertyIntelligence {
  const intel = (row.intelligence ?? {}) as Record<string, unknown>;
  const rooms = Array.isArray(intel.rooms)
    ? (intel.rooms as unknown[]).flatMap((room) => {
        if (!room || typeof room !== "object") return [];
        const record = room as Record<string, unknown>;
        const name = typeof record.name === "string" ? record.name : null;
        if (!name) return [];
        return [
          {
            name,
            features: stringList(record.features),
            condition: typeof record.condition === "string" ? record.condition : undefined,
          },
        ];
      })
    : [];

  return {
    propertySummary: typeof intel.propertySummary === "string" ? intel.propertySummary : "",
    keyFeatures: stringList(intel.keyFeatures),
    upgrades: stringList(intel.upgrades),
    rooms,
    exteriorFeatures: stringList(intel.exteriorFeatures),
    lotFeatures: stringList(intel.lotFeatures),
    neighborhoodNotes: stringList(intel.neighborhoodNotes),
    possibleBuyerQuestions: stringList(intel.possibleBuyerQuestions),
    agentTalkingPoints: stringList(intel.agentTalkingPoints),
    missingInformation: row.missing_information ?? stringList(intel.missingInformation),
    sourceMap: [],
  };
}
