export interface VersionOneChecklistItem {
  key: string;
  label: string;
  required: boolean;
}

export const VERSION_ONE_PROMISE =
  "Walk a property, record natural voice notes, build a Digital Property Twin, and let buyers explore it with an AI guide grounded in verified knowledge.";

export const VERSION_ONE_CHECKLIST: VersionOneChecklistItem[] = [
  { key: "property_creation", label: "Property creation", required: true },
  { key: "asset_hierarchy", label: "Asset hierarchy", required: true },
  { key: "voice_capture", label: "Voice capture", required: true },
  { key: "transcription", label: "Transcription", required: true },
  { key: "knowledge_extraction", label: "Knowledge extraction", required: true },
  { key: "human_approval", label: "Human approval", required: true },
  { key: "digital_property_twin", label: "Digital Property Twin", required: true },
  { key: "ai_guide", label: "AI Guide", required: true },
  { key: "qr_access", label: "QR access", required: true },
  { key: "brochure_generation", label: "Brochure generation", required: true },
  { key: "lead_capture", label: "Lead capture", required: true },
  { key: "property_health", label: "Property Health", required: true },
  { key: "analytics", label: "Analytics", required: true },
  { key: "logging", label: "Logging", required: true },
  { key: "monitoring", label: "Monitoring", required: true },
];

export function calculateVersionOneReadiness(completedKeys: string[]) {
  const completed = new Set(completedKeys);
  const requiredItems = VERSION_ONE_CHECKLIST.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => completed.has(item.key));

  return {
    promise: VERSION_ONE_PROMISE,
    totalRequired: requiredItems.length,
    completedRequired: completedRequired.length,
    readinessPercent: Math.round((completedRequired.length / requiredItems.length) * 100),
    missing: requiredItems.filter((item) => !completed.has(item.key)),
  };
}
