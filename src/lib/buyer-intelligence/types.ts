export type BuyerIntentLevel = "exploring" | "interested" | "very_interested" | "ready_to_act";

export type BuyerSentiment = "positive" | "neutral" | "concerned" | "excited" | "uncertain";

export interface BuyerInterestSignal {
  name: string;
  confidenceScore: number;
  evidence: string[];
  supportingQuestions: string[];
  timestamp: string;
}

export interface BuyerConcernSignal {
  concern: string;
  confidence: number;
  evidence: string[];
  frequency: number;
  resolved: boolean;
}

export interface BuyerTimelineEvent {
  id: string;
  type: string;
  label: string;
  timestamp: string;
  poiId?: string | null;
}

export interface EngagementMetrics {
  tourStarted: boolean;
  tourCompleted: boolean;
  poisViewed: string[];
  questionsAsked: number;
  voiceInteractions: number;
  photoViews: number;
  documentViews: number;
  brochureRequests: number;
  showingRequests: number;
  exitPoint: string | null;
  durationMinutes: number | null;
}

export interface FollowUpRecommendation {
  action: string;
  reason: string;
  priority: number;
}

export interface BuyerIntelligenceReport {
  sessionId: string;
  propertyId: string;
  isAnonymous: boolean;
  leadId: string | null;
  sessionInfo: {
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    device: string | null;
    language: string | null;
  };
  engagement: EngagementMetrics;
  interests: BuyerInterestSignal[];
  concerns: BuyerConcernSignal[];
  intentLevel: BuyerIntentLevel;
  intentScore: number;
  sentiment: BuyerSentiment;
  executiveSummary: string;
  topQuestions: string[];
  timeline: BuyerTimelineEvent[];
  followUpRecommendations: FollowUpRecommendation[];
  suggestedTalkingPoints: string[];
  aiConfidence: number;
}

export interface TrackEventInput {
  propertyId: string;
  visitorSessionId: string;
  eventType: string;
  poiId?: string | null;
  eventData?: Record<string, unknown>;
}
