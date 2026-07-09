import type {
  KnowledgeCategory,
  KnowledgeSource,
  VerificationLevel,
} from "@/lib/property-twin/types";

export const VERIFICATION_PRIORITY: VerificationLevel[] = [
  "verified",
  "likely",
  "unknown",
  "conflicting",
  "retired",
];

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  "structural",
  "mechanical",
  "electrical",
  "plumbing",
  "interior",
  "exterior",
  "landscape",
  "appliances",
  "safety",
  "accessibility",
  "luxury_features",
  "energy_efficiency",
  "technology",
  "maintenance",
  "renovations",
  "neighborhood",
  "community",
  "schools",
  "utilities",
  "legal_documents",
  "hoa",
  "insurance",
  "miscellaneous",
];

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
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

export const COMPLETENESS_WEIGHTS = {
  corePropertyData: 15,
  systems: 10,
  appliances: 10,
  photos: 15,
  documents: 10,
  pois: 15,
  neighborhood: 5,
  maintenance: 10,
  verificationCoverage: 10,
} as const;

export const PUBLISHING_MIN_VERIFICATION_PERCENT = 50;

export const REQUIRED_PROPERTY_FIELDS = [
  "street",
  "city",
  "province_state",
  "postal_code",
  "property_type",
  "bedrooms",
  "bathrooms",
  "finished_square_feet",
] as const;

export const CORE_SYSTEM_NAMES = [
  "roof",
  "hvac",
  "heating",
  "cooling",
  "electrical",
  "plumbing",
] as const;
