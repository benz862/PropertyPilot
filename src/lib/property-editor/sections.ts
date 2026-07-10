import type { PropertyEditorSection } from "@/lib/navigation/routes";

export function getSectionTitle(section: PropertyEditorSection): string {
  const titles: Record<PropertyEditorSection, string> = {
    overview: "Property Overview",
    "property-dna": "Property DNA",
    rooms: "Rooms",
    "property-twin": "Property Twin",
    knowledge: "Knowledge",
    photos: "Photo Center",
    documents: "Document Center",
    "voice-notes": "Voice Notes",
    "buyer-questions": "Buyer Questions",
    "buyer-activity": "Buyer Activity",
    analytics: "Analytics",
    "generated-assets": "Property Studio",
    publishing: "QR Tour",
    settings: "Workspace Settings",
  };
  return titles[section];
}
