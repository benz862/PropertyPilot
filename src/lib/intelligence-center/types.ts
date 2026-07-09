export interface IntelligenceRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  reason: string;
  action: string;
  propertyId: string | null;
  evidence: string[];
}

export interface PropertyScorecard {
  propertyId: string;
  address: string;
  overallScore: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
  buyerExperience: number;
  knowledgeQuality: number;
  photoQuality: number;
  marketingQuality: number;
  voiceExperience: number;
  leadConversion: number;
  conversationQuality: number;
  verification: number;
  publishingReadiness: number;
  recommendation: string;
}

export interface ExecutiveSummary {
  date: string;
  tourCount: number;
  brochureRequests: number;
  showingRequests: number;
  topTopics: string[];
  listingsNeedingAttention: string[];
  estimatedReadMinutes: number;
  narrative: string;
}

export interface IntelligenceDashboard {
  priorities: IntelligenceRecommendation[];
  recommendations: IntelligenceRecommendation[];
  propertiesNeedingAttention: PropertyScorecard[];
  topPerformers: PropertyScorecard[];
  recentLeads: number;
  healthChanges: number;
}

export interface BuyerInsightTrend {
  topic: string;
  count: number;
  trend: "rising" | "falling" | "stable";
}
