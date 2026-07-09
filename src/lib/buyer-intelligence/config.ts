export interface IntentScoringConfig {
  tourCompletion: number;
  showingRequest: number;
  brochureDownload: number;
  repeatQuestions: number;
  timeSpentPerMinute: number;
  conversationDepth: number;
  voiceInteractions: number;
}

export const DEFAULT_INTENT_CONFIG: IntentScoringConfig = {
  tourCompletion: 25,
  showingRequest: 30,
  brochureDownload: 15,
  repeatQuestions: 5,
  timeSpentPerMinute: 2,
  conversationDepth: 3,
  voiceInteractions: 4,
};

export const INTENT_THRESHOLDS = {
  ready_to_act: 75,
  very_interested: 50,
  interested: 25,
  exploring: 0,
} as const;

export const CONCERN_PATTERNS: Array<{ topic: string; patterns: RegExp[] }> = [
  { topic: "taxes", patterns: [/\b(tax|taxes|property tax|assessment)\b/i] },
  { topic: "roof", patterns: [/\b(roof|shingle|leak)\b/i] },
  { topic: "hvac", patterns: [/\b(hvac|furnace|heating|cooling|air condition)\b/i] },
  { topic: "hoa", patterns: [/\b(hoa|homeowner.?s association|dues)\b/i] },
  { topic: "commute", patterns: [/\b(commute|traffic|drive time|transit)\b/i] },
  { topic: "noise", patterns: [/\b(noise|quiet|sound|traffic noise)\b/i] },
  { topic: "yard", patterns: [/\b(yard|lot size|backyard size)\b/i] },
  { topic: "maintenance", patterns: [/\b(maintenance|upkeep|repair)\b/i] },
  { topic: "accessibility", patterns: [/\b(accessib|wheelchair|ada|mobility)\b/i] },
  { topic: "storage", patterns: [/\b(storage|closet|attic|basement)\b/i] },
  { topic: "price", patterns: [/\b(price|offer|negotiat|afford)\b/i] },
];

export const INTEREST_TOPIC_LABELS: Record<string, string> = {
  workshop: "Workshop",
  pool: "Pool",
  schools: "Schools",
  garage: "Garage",
  accessibility: "Accessibility",
  office_space: "Home Office",
  home_office: "Home Office",
  investment: "Investment Potential",
  luxury_features: "Luxury Finishes",
  storage: "Storage",
  kitchen: "Kitchen",
  backyard: "Backyard",
  smart_home: "Smart Home",
  energy_efficiency: "Energy Efficiency",
  pet_friendly: "Pet Friendly",
};
