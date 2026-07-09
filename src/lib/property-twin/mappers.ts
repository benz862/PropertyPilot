import type { Tables } from "@/lib/property-twin/database.types";
import type {
  AiSuggestion,
  DocumentType,
  KnowledgeFact,
  KnowledgeObject,
  KnowledgeRelationship,
  PropertyProfile,
  PropertyListingStatus,
  PropertyTimelineEvent,
  TimelineEventType,
  VerificationLevel,
  KnowledgeSource,
} from "@/lib/property-twin/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapProperty(row: Tables<"properties">): PropertyProfile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    mlsNumber: row.mls_number,
    status: row.status as PropertyListingStatus,
    street: row.street,
    city: row.city,
    provinceState: row.province_state,
    postalCode: row.postal_code,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    propertyType: row.property_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    finishedSquareFeet: row.finished_sq_ft,
    lotSize: row.lot_size_sq_ft,
    yearBuilt: row.year_built,
    annualTaxes: row.annual_taxes,
    hoa: row.hoa_fee != null ? { fee: row.hoa_fee } : {},
    schoolDistrict: row.school_district,
    publicRemarks: row.public_remarks,
    privateNotes: row.private_notes,
    listingPrice: row.listing_price,
    listingStatus: row.listing_status ?? null,
    agentName: row.agent_name ?? null,
    brokerage: row.brokerage ?? null,
    utilities: asRecord(row.utilities),
    taxInformation: asRecord(row.tax_information),
    propertyDescription: row.property_description ?? null,
    voicePersonalityId: row.voice_personality_id ?? null,
    aiPolicyId: row.ai_policy_id ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapKnowledgeObject(row: Tables<"knowledge_objects">): KnowledgeObject {
  return {
    id: row.id,
    propertyId: row.property_id,
    category: row.category as KnowledgeObject["category"],
    name: row.name,
    summary: row.summary,
    videoUrl: row.video_url,
    confidenceLevel: mapConfidenceToVerification(row.confidence_level),
    verificationSource: mapKnowledgeSource(row.verification_source),
    revisionNumber: row.revision_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConfidenceToVerification(
  level: Tables<"knowledge_objects">["confidence_level"],
): VerificationLevel {
  if (level === "high") return "verified";
  if (level === "medium") return "likely";
  return "unknown";
}

function mapKnowledgeSource(value: string | null): KnowledgeObject["verificationSource"] {
  const allowed: KnowledgeSource[] = [
    "mls",
    "agent",
    "homeowner",
    "builder",
    "inspection_report",
    "photo",
    "voice_note",
    "pdf_document",
    "warranty_document",
    "floor_plan",
    "manual_entry",
    "integration",
  ];
  if (value && allowed.includes(value as KnowledgeSource)) {
    return value as KnowledgeSource;
  }
  return value ? "manual_entry" : null;
}

export function mapKnowledgeFact(row: Tables<"knowledge_facts">): KnowledgeFact {
  return {
    id: row.id,
    propertyId: row.property_id,
    knowledgeObjectId: row.knowledge_object_id,
    factKey: row.fact_key,
    factValue: row.fact_value,
    versionNumber: row.version_number,
    verificationLevel: row.verification_level,
    source: row.source,
    sourceReference: row.source_reference,
    isCurrent: row.is_current,
    retiredAt: row.retired_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRelationship(
  row: Tables<"knowledge_relationships">,
): KnowledgeRelationship {
  return {
    id: row.id,
    propertyId: row.property_id,
    sourceObjectId: row.source_object_id,
    targetObjectId: row.target_object_id,
    relationshipType: row.relationship_type,
    createdAt: row.created_at,
  };
}

export function mapTimelineEvent(
  row: Tables<"property_timeline_events">,
): PropertyTimelineEvent {
  return {
    id: row.id,
    propertyId: row.property_id,
    knowledgeObjectId: row.knowledge_object_id,
    eventType: row.event_type as TimelineEventType,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    verificationLevel: row.verification_level as VerificationLevel,
    createdAt: row.created_at,
  };
}

export function mapSuggestion(row: Tables<"ai_suggestions">): AiSuggestion {
  return {
    id: row.id,
    propertyId: row.property_id,
    suggestionType: row.suggestion_type,
    message: row.message,
    priority: row.priority,
    status: row.status,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
  };
}

export function mapDocumentType(value: string): DocumentType {
  const allowed: DocumentType[] = [
    "inspection_report",
    "warranty",
    "disclosure",
    "floor_plan",
    "manual",
    "survey",
    "hoa",
    "receipt",
    "other",
  ];
  return allowed.includes(value as DocumentType) ? (value as DocumentType) : "other";
}

export function preferVerification(
  current: VerificationLevel,
  incoming: VerificationLevel,
): VerificationLevel {
  const order: VerificationLevel[] = [
    "verified",
    "likely",
    "unknown",
    "conflicting",
    "retired",
  ];
  const currentIndex = order.indexOf(current);
  const incomingIndex = order.indexOf(incoming);
  return incomingIndex <= currentIndex ? incoming : current;
}

export function isActiveRow<T extends { deleted_at?: string | null }>(row: T): boolean {
  return row.deleted_at == null;
}
