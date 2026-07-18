export interface SourceMapEntry {
  field: string;
  sources: string[];
}

export interface IntelligenceRoom {
  name: string;
  features: string[];
  condition?: string;
}

export interface PropertyIntelligence {
  propertySummary: string;
  keyFeatures: string[];
  upgrades: string[];
  rooms: IntelligenceRoom[];
  exteriorFeatures: string[];
  lotFeatures: string[];
  neighborhoodNotes: string[];
  possibleBuyerQuestions: string[];
  agentTalkingPoints: string[];
  missingInformation: string[];
  sourceMap: SourceMapEntry[];
}

export interface AttributedFact {
  field: keyof Omit<PropertyIntelligence, "sourceMap">;
  value: string;
  sources: string[];
}
