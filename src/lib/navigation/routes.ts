export const realtorRoutes = {
  dashboard: "/dashboard",
  v2: "/v2",
  properties: "/properties",
  newProperty: "/properties/new",
  property: (id: string) => `/properties/${id}`,
  propertySection: (id: string, section: PropertyEditorSection) =>
    `/properties/${id}/${section}`,
  leads: "/leads",
  appointments: "/appointments",
  analytics: "/analytics",
  intelligence: "/intelligence",
  documents: "/documents",
  knowledgeCenter: "/knowledge-builder",
  voiceNotes: "/voice-notes",
  generatedAssets: "/generated-assets",
  billing: "/billing",
  integrations: "/integrations",
  settings: "/settings",
  help: "/help",
} as const;

export type PropertyEditorSection =
  | "overview"
  | "property-dna"
  | "rooms"
  | "property-twin"
  | "knowledge"
  | "photos"
  | "voice-notes"
  | "documents"
  | "buyer-questions"
  | "buyer-activity"
  | "analytics"
  | "generated-assets"
  | "publishing"
  | "settings";

/** Legacy section slugs redirect to current tabs */
export const legacySectionRedirects: Record<string, PropertyEditorSection> = {
  pois: "property-twin",
  suggestions: "overview",
  leads: "buyer-questions",
  "property-studio": "generated-assets",
  "qr-tour": "publishing",
};

export const propertyEditorSections: Array<{
  slug: PropertyEditorSection;
  label: string;
  description: string;
}> = [
  { slug: "overview", label: "Overview", description: "Property health and status" },
  { slug: "property-dna", label: "Property DNA", description: "The single source of truth" },
  { slug: "rooms", label: "Rooms", description: "Room-specific buyer knowledge" },
  { slug: "generated-assets", label: "Property Studio", description: "Assets generated from Property DNA" },
  { slug: "publishing", label: "QR Tour", description: "Public page, QR codes, go-live" },
  { slug: "buyer-activity", label: "Buyer Activity", description: "Scans, questions, and leads" },
  { slug: "documents", label: "Documents", description: "Inspection reports and files" },
  { slug: "voice-notes", label: "Voice Notes", description: "Agent-recorded notes" },
  { slug: "photos", label: "Photos", description: "Property imagery" },
  { slug: "property-twin", label: "Property Twin", description: "Knowledge graph and systems" },
  { slug: "knowledge", label: "Knowledge", description: "Facts and knowledge objects" },
  { slug: "analytics", label: "Analytics", description: "Tour and engagement data" },
  { slug: "buyer-questions", label: "Buyer Questions", description: "Questions from tours" },
  { slug: "settings", label: "Settings", description: "Voice, branding, and rules" },
];

export const buyerRoutes = {
  welcome: (slug: string) => `/tour/${slug}`,
  start: (slug: string) => `/tour/${slug}/start`,
  experience: (slug: string, poiId?: string) =>
    poiId ? `/tour/${slug}/experience?poi=${poiId}` : `/tour/${slug}/experience`,
  lead: (slug: string) => `/tour/${slug}/lead`,
  thanks: (slug: string) => `/tour/${slug}/thanks`,
} as const;

export type WizardStepId =
  | "basic-info"
  | "mls"
  | "photos"
  | "documents"
  | "room-knowledge"
  | "voice-notes"
  | "ai-build"
  | "review"
  | "publish";

export const wizardSteps: Array<{
  id: WizardStepId;
  label: string;
  description: string;
}> = [
  { id: "basic-info", label: "Basic Info", description: "Address and property details" },
  { id: "mls", label: "Upload MLS", description: "Import listing data" },
  { id: "photos", label: "Photos", description: "Upload property photos" },
  { id: "documents", label: "Documents", description: "Inspection reports and files" },
  { id: "room-knowledge", label: "Room Knowledge", description: "Room-specific buyer answers" },
  { id: "voice-notes", label: "Voice Notes", description: "Record agent knowledge" },
  { id: "ai-build", label: "AI Build", description: "Generate property twin" },
  { id: "review", label: "Review", description: "Review AI suggestions" },
  { id: "publish", label: "Publish", description: "Go live with QR code" },
];

export const defaultTourAreas = [
  {
    id: "kitchen",
    title: "Kitchen",
    description: "Explore appliances, finishes, and layout",
    estimatedMinutes: 3,
  },
  {
    id: "living-room",
    title: "Living Room",
    description: "Main living space and natural light",
    estimatedMinutes: 2,
  },
  {
    id: "primary-suite",
    title: "Primary Suite",
    description: "Bedroom, ensuite, and closet space",
    estimatedMinutes: 3,
  },
  {
    id: "flex-space",
    title: "Flex Space",
    description: "Versatile bonus room or office",
    estimatedMinutes: 2,
  },
  {
    id: "backyard",
    title: "Backyard",
    description: "Outdoor living and landscaping",
    estimatedMinutes: 2,
  },
  {
    id: "garage",
    title: "Garage",
    description: "Storage, parking, and workshop area",
    estimatedMinutes: 2,
  },
] as const;

export const buyerSidebarSections = [
  { id: "features", label: "Features" },
  { id: "systems", label: "Systems" },
  { id: "timeline", label: "Timeline" },
  { id: "neighborhood", label: "Neighborhood" },
  { id: "schools", label: "Schools" },
  { id: "utilities", label: "Utilities" },
  { id: "documents", label: "Documents" },
  { id: "agent", label: "Agent" },
] as const;

export type BuyerSidebarSectionId = (typeof buyerSidebarSections)[number]["id"];
