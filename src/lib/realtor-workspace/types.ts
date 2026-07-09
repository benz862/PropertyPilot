import type { HealthStatus } from "@/lib/property-health/score";
import type {
  AnalyticsEventType,
  CrmStatus,
  DocumentType,
  KnowledgeCategory,
  Lead,
  Property,
  PropertyStatus,
  TwinAuditAction,
} from "@/types/database";

export type { HealthStatus };

export interface PropertySummary {
  id: string;
  slug: string;
  address: string;
  status: PropertyStatus;
  heroPhotoUrl: string | null;
  healthScore: number;
  healthStatus: HealthStatus;
  aiReadiness: number;
  completeness: number;
  visitorCount: number;
  leadCount: number;
  qrStatus: "active" | "inactive" | "pending";
  lastUpdated: string;
}

export interface AiRecommendation {
  id: string;
  propertyId: string | null;
  propertyAddress: string | null;
  message: string;
  priority: number;
  type: "suggestion" | "question" | "health" | "engagement";
}

export interface WorkspaceNotification {
  id: string;
  type:
    | "new_lead"
    | "property_published"
    | "showing_requested"
    | "unknown_question"
    | "knowledge_review"
    | "brochure_generated"
    | "voice_processed";
  title: string;
  message: string;
  propertyId: string | null;
  createdAt: string;
  read: boolean;
}

export interface ActivityEvent {
  id: string;
  propertyId: string;
  propertyAddress: string;
  action: TwinAuditAction | AnalyticsEventType | "lead_captured" | "question_asked";
  title: string;
  description: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  qrScans: number;
  tourStarts: number;
  questionsAsked: number;
  leadsCaptured: number;
  avgDurationMinutes: number | null;
}

export interface SubscriptionInfo {
  tier: string;
  label: string;
  propertyCount: number;
  propertyLimit: number | null;
}

export interface WorkspaceDashboardData {
  realtorName: string;
  properties: PropertySummary[];
  attentionListings: PropertySummary[];
  recentLeads: LeadWithProperty[];
  recommendations: AiRecommendation[];
  analytics: AnalyticsSummary;
  subscription: SubscriptionInfo;
  activity: ActivityEvent[];
  notifications: WorkspaceNotification[];
  unansweredQuestionCount: number;
}

export interface LeadWithProperty extends Lead {
  propertyAddress: string;
  propertySlug: string;
  interestScore: number;
}

export interface SearchResultGroup {
  type: "properties" | "knowledge" | "photos" | "documents" | "leads" | "questions" | "assets";
  label: string;
  results: SearchResultItem[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  propertyId?: string;
}

export type KnowledgeGroupKey =
  | "systems"
  | "features"
  | "rooms"
  | "exterior"
  | "interior"
  | "neighborhood"
  | "utilities"
  | "appliances";

export const KNOWLEDGE_GROUP_LABELS: Record<KnowledgeGroupKey, string> = {
  systems: "Systems",
  features: "Features",
  rooms: "Rooms",
  exterior: "Exterior",
  interior: "Interior",
  neighborhood: "Neighborhood",
  utilities: "Utilities",
  appliances: "Appliances",
};

export const KNOWLEDGE_CATEGORY_GROUPS: Partial<Record<KnowledgeCategory, KnowledgeGroupKey>> = {
  roof: "systems",
  hvac: "systems",
  electrical: "systems",
  plumbing: "systems",
  mechanical: "systems",
  structural: "systems",
  foundation: "systems",
  septic: "systems",
  well: "systems",
  solar: "systems",
  security: "systems",
  safety: "systems",
  appliance: "appliances",
  appliances: "appliances",
  kitchen: "rooms",
  bathroom: "rooms",
  garage: "rooms",
  flex_space: "rooms",
  pool: "exterior",
  deck: "exterior",
  driveway: "exterior",
  landscaping: "exterior",
  landscape: "exterior",
  exterior: "exterior",
  interior: "interior",
  windows: "interior",
  fireplace: "interior",
  renovations: "interior",
  luxury_features: "features",
  technology: "features",
  energy_efficiency: "features",
  accessibility: "features",
  neighborhood: "neighborhood",
  schools: "neighborhood",
  community: "neighborhood",
  utilities: "utilities",
  maintenance: "systems",
  other: "features",
  miscellaneous: "features",
  hoa: "neighborhood",
  insurance: "systems",
  legal_documents: "features",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  inspection_report: "Inspection",
  property_disclosure: "Disclosure",
  warranty: "Warranty",
  survey: "Survey",
  floor_plan: "Floor Plan",
  receipt: "Receipts",
  brochure: "Generated Assets",
  hoa_document: "Other",
  manual: "Other",
  other: "Other",
};

export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

export function formatPropertyAddress(property: Property): string {
  return `${property.street}, ${property.city}`;
}
