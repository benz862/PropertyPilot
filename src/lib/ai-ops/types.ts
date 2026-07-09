export type ImprovementPriority = "critical" | "important" | "suggested" | "enhancement";

export type ImprovementStatus = "open" | "in_review" | "resolved" | "archived";

export interface ConversationReview {
  id: string;
  conversationId: string;
  propertyId: string;
  knowledgeCoverage: number;
  confidence: number;
  unknownAnswers: number;
  escalations: number;
  averageResponseMs: number;
  conversationLength: number;
  followUpRequests: number;
  analyzedAt: string;
}

export interface KnowledgeGap {
  id: string;
  propertyId: string;
  question: string;
  priority: ImprovementPriority;
  reason: string;
  suggestedSource: string;
  suggestedAction: string;
  status: ImprovementStatus;
  createdAt: string;
}

export interface PropertyImprovementItem {
  id: string;
  propertyId: string;
  title: string;
  priority: ImprovementPriority;
  status: ImprovementStatus;
  source: "conversation" | "qa" | "agent";
  createdAt: string;
}

export interface QualityIssue {
  type: string;
  message: string;
  severity: ImprovementPriority;
}
