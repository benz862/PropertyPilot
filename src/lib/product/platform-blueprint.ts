export const PLATFORM_PILLARS = [
  {
    name: "Property Management",
    capabilities: ["Organizations", "Properties", "Assets", "Profiles", "Permissions"],
  },
  {
    name: "Knowledge Platform",
    capabilities: ["Knowledge Objects", "Facts", "Evidence", "Review", "Verification", "Timeline"],
  },
  {
    name: "AI Platform",
    capabilities: ["Prompt Library", "Retrieval", "Memory", "Recommendations", "Conversation", "Evaluation"],
  },
  {
    name: "Buyer Experience",
    capabilities: ["AI Guide", "QR Codes", "Digital Brochure", "Voice", "Search", "Navigation", "Lead Capture"],
  },
  {
    name: "Marketing Platform",
    capabilities: ["PDF", "HTML", "Email", "Social Media", "Campaigns", "SEO", "Branding"],
  },
  {
    name: "Analytics Platform",
    capabilities: ["Events", "Buyer Intelligence", "Property Health", "Buyer Readiness", "Recommendations", "Journey Replay"],
  },
  {
    name: "Automation Platform",
    capabilities: ["Jobs", "Workflows", "Notifications", "Scheduling", "CRM", "Background Processing"],
  },
  {
    name: "Commercial Platform",
    capabilities: ["Subscriptions", "Features", "Entitlements", "Billing", "Feature Packs", "Enterprise"],
  },
] as const;

export const PRIMARY_USER_JOURNEYS = {
  agent: [
    "Create Property",
    "Walk Property",
    "Record Voice",
    "Approve Knowledge",
    "Publish Property",
    "Generate Marketing",
    "Share QR",
    "Monitor Buyers",
    "Improve Knowledge",
  ],
  buyer: [
    "Open Property",
    "Meet AI Guide",
    "Explore Assets",
    "Ask Questions",
    "Download Brochure",
    "Schedule Showing",
    "Become Lead",
  ],
  broker: [
    "Monitor Portfolio",
    "Review Health",
    "Assign Work",
    "Approve Marketing",
    "Analyze Performance",
  ],
} as const;

export const PLATFORM_MISSION =
  "Make every property understandable through a living, searchable, explainable Digital Property Twin.";
