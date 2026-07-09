import type { PropertyEditorSection } from "@/lib/navigation/routes";

export function getSectionTitle(section: PropertyEditorSection): string {
  const titles: Record<PropertyEditorSection, string> = {
    overview: "Property Overview",
    "property-twin": "Property Twin",
    knowledge: "Knowledge",
    photos: "Photo Center",
    documents: "Document Center",
    "voice-notes": "Voice Notes",
    "buyer-questions": "Buyer Questions",
    analytics: "Analytics",
    "generated-assets": "Generated Assets",
    publishing: "Publishing",
    settings: "Workspace Settings",
  };
  return titles[section];
}
