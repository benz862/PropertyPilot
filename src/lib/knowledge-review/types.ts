export type KnowledgeReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "edited"
  | "merged"
  | "archived";

export type KnowledgeReviewItemType =
  | "new_fact"
  | "updated_fact"
  | "conflict"
  | "duplicate"
  | "suggested_asset"
  | "timeline_change"
  | "maintenance_item"
  | "marketing_suggestion"
  | "buyer_faq"
  | "warning";

export type ConfidenceBand = "verified" | "high" | "medium" | "manual_review" | "never_auto_approve";

export interface KnowledgeReviewItem {
  id: string;
  propertyId: string;
  assetId: string | null;
  itemType: KnowledgeReviewItemType;
  status: KnowledgeReviewStatus;
  factKey: string | null;
  proposedValue: string | null;
  existingValue: string | null;
  confidence: number;
  explanation: string | null;
  evidence: Record<string, unknown>;
}

export interface ProposedFact {
  factKey: string;
  proposedValue: string;
  confidence: number;
  evidence?: Record<string, unknown>;
  explanation?: string;
}
