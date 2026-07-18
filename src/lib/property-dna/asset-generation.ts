import type { Fact, GeneratedAssetType, PropertyDNA } from "./types";

export type StudioSection = "print" | "digital" | "voice" | "marketing" | "buyer" | "social" | "email";

export interface StudioSectionMeta {
  id: StudioSection;
  label: string;
  description: string;
}

export const STUDIO_SECTIONS: StudioSectionMeta[] = [
  { id: "print", label: "Print", description: "Handouts and printable materials" },
  { id: "digital", label: "Digital", description: "Screens, links, and QR signage" },
  { id: "voice", label: "Voice", description: "Scripts for the AI voice agent" },
  { id: "marketing", label: "Marketing", description: "Listing descriptions and copy" },
  { id: "buyer", label: "Buyer", description: "Buyer-facing FAQs and notes" },
  { id: "social", label: "Social", description: "Social media captions" },
  { id: "email", label: "Email", description: "Email announcements" },
];

export const DISCLAIMER =
  "Information is believed to be accurate but should be independently verified. Buyer should confirm all property details, measurements, taxes, schools, utilities, HOA rules, and condition through appropriate professionals and official sources.";

export interface GeneratedAsset {
  type: GeneratedAssetType;
  title: string;
  section: StudioSection;
  content: string;
  generatedAt: string;
}

interface AssetDefinition {
  type: GeneratedAssetType;
  title: string;
  section: StudioSection;
  generate: (dna: PropertyDNA) => string;
}

const ASSET_DEFINITIONS: AssetDefinition[] = [
  { type: "feature_sheet", title: "Feature Sheet", section: "print", generate: generateFeatureSheet },
  { type: "buyer_brochure", title: "Buyer Brochure", section: "print", generate: generateBuyerBrochure },
  { type: "open_house_flyer", title: "Open House Flyer", section: "print", generate: generateOpenHouseFlyer },
  { type: "qr_sign", title: "QR Sign", section: "digital", generate: generateQrSign },
  { type: "qr_code_png", title: "QR Code", section: "digital", generate: generateQrSign },
  { type: "property_website", title: "Property Website Copy", section: "digital", generate: generatePropertyWebsite },
  { type: "qr_tour", title: "QR Tour Copy", section: "digital", generate: generateQrTour },
  { type: "voice_intro", title: "Voice Greetings", section: "voice", generate: generateVoiceIntroductions },
  { type: "voice_agent_knowledge_base", title: "Voice Agent KB", section: "voice", generate: generateVoiceKnowledgeBase },
  { type: "mls_description", title: "MLS Description", section: "marketing", generate: generateMlsDescription },
  { type: "luxury_description", title: "Luxury Description", section: "marketing", generate: generateLuxuryDescription },
  { type: "property_description", title: "Property Description", section: "marketing", generate: generatePropertyDescription },
  { type: "family_description", title: "Family Buyer Copy", section: "marketing", generate: generateFamilyDescription },
  { type: "investor_description", title: "Investor Copy", section: "marketing", generate: generateInvestorDescription },
  { type: "buyer_faq", title: "Buyer FAQ", section: "buyer", generate: generateBuyerFaq },
  { type: "showing_notes", title: "Showing Notes", section: "buyer", generate: generateShowingNotes },
  { type: "neighborhood_guide", title: "Neighborhood Guide", section: "buyer", generate: generateNeighborhoodGuide },
  { type: "facebook_post", title: "Facebook Post", section: "social", generate: generateFacebookPost },
  { type: "instagram_post", title: "Instagram Caption", section: "social", generate: generateInstagramPost },
  { type: "linkedin_post", title: "LinkedIn Post", section: "social", generate: generateLinkedInPost },
  { type: "email_just_listed", title: "Just Listed Email", section: "email", generate: generateJustListedEmail },
  { type: "email_open_house", title: "Open House Email", section: "email", generate: generateOpenHouseEmail },
  { type: "email_price_reduction", title: "Price Reduction Email", section: "email", generate: generatePriceReductionEmail },
];

export function listAssetDefinitions(): Array<Omit<AssetDefinition, "generate">> {
  return ASSET_DEFINITIONS.map(({ type, title, section }) => ({ type, title, section }));
}

/** Generate a single asset of the given type from Property DNA. */
export function generateAsset(dna: PropertyDNA, type: GeneratedAssetType, now = new Date()): GeneratedAsset {
  const definition = ASSET_DEFINITIONS.find((entry) => entry.type === type);
  if (!definition) {
    throw new Error(`Unsupported asset type: ${type}`);
  }
  return {
    type: definition.type,
    title: definition.title,
    section: definition.section,
    content: definition.generate(dna),
    generatedAt: now.toISOString(),
  };
}

/** Generate every supported asset from Property DNA. */
export function generateAllAssets(dna: PropertyDNA, now = new Date()): GeneratedAsset[] {
  return ASSET_DEFINITIONS.map((definition) => ({
    type: definition.type,
    title: definition.title,
    section: definition.section,
    content: definition.generate(dna),
    generatedAt: now.toISOString(),
  }));
}

function generateFeatureSheet(dna: PropertyDNA): string {
  const lines = [
    `# ${dna.basic.address ?? "Property Feature Sheet"}`,
    "",
    basicsBlock(dna),
    "",
    "## Top Features",
    bulletList(topFeatures(dna, 8), "Feature details coming soon."),
    "",
    "## Major Updates",
    bulletList(majorUpdates(dna), "No major updates recorded yet."),
    "",
    "## Room Highlights",
    roomHighlights(dna, 5),
    "",
    agentBlock(dna),
    "",
    `_${DISCLAIMER}_`,
  ];
  return lines.join("\n");
}

function generateBuyerBrochure(dna: PropertyDNA): string {
  return [
    `# ${dna.basic.address ?? "Property Brochure"}`,
    "",
    "## The Story",
    dna.basic.summary ?? dna.basic.mlsDescription ?? "A wonderful home waiting for its next owner.",
    "",
    "## Room Highlights",
    roomHighlights(dna, 6),
    "",
    "## Features & Upgrades",
    bulletList([...topFeatures(dna, 6), ...majorUpdates(dna)], "Feature details coming soon."),
    "",
    "## Neighborhood",
    bulletList(dna.neighborhood.notes.map(factText), "Neighborhood notes coming soon."),
    "",
    agentBlock(dna),
    "",
    `_${DISCLAIMER}_`,
  ].join("\n");
}

function generateOpenHouseFlyer(dna: PropertyDNA): string {
  const points = topFeatures(dna, 5);
  return [
    "# Open House",
    dna.basic.address ?? "",
    basicsBlock(dna),
    "",
    "## 5 Reasons to Fall in Love",
    bulletList(points.length ? points : ["Beautiful, well-cared-for home", "Great location", "Move-in ready"], ""),
    "",
    "Scan the QR code on site to ask questions about any room.",
    "",
    agentBlock(dna),
  ].join("\n");
}

function generateQrSign(dna: PropertyDNA): string {
  const lines = [
    `# Scan to explore ${shortAddress(dna)}`,
    "Point your camera at the QR code to ask questions about this home.",
    "",
    "## Room signs",
  ];
  const rooms = dna.rooms.length ? dna.rooms.map((room) => room.name) : ["Whole Property"];
  for (const room of rooms) {
    lines.push(`- ${room}: "Scan to ask questions about this ${room.toLowerCase()}."`);
  }
  return lines.join("\n");
}

function generateMlsDescription(dna: PropertyDNA): string {
  const intro = dna.basic.summary ?? dna.basic.mlsDescription ?? shortAddress(dna);
  const features = topFeatures(dna, 5);
  const featureText = features.length ? ` Highlights include ${joinList(features)}.` : "";
  return `${intro}${featureText}`.replace(/\s+/g, " ").trim().slice(0, 900);
}

function generateLuxuryDescription(dna: PropertyDNA): string {
  const features = topFeatures(dna, 5);
  const featureText = features.length ? ` Thoughtfully appointed with ${joinList(features)}.` : "";
  return [
    `Presenting ${shortAddress(dna)} — an exceptional residence where comfort meets craftsmanship.`,
    dna.basic.summary ? ` ${dna.basic.summary}` : "",
    featureText,
    " An extraordinary opportunity for the discerning buyer.",
  ]
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function generatePropertyDescription(dna: PropertyDNA): string {
  return [
    `## Short`,
    generateMlsDescription(dna).slice(0, 300),
    "",
    `## Long`,
    [dna.basic.summary, ...topFeatures(dna, 8).map((f) => `- ${f}`)].filter(Boolean).join("\n"),
  ].join("\n");
}

function generateBuyerFaq(dna: PropertyDNA): string {
  const groups: Array<{ title: string; items: string[] }> = [
    {
      title: "Property",
      items: [
        dna.basic.beds != null ? `**How many bedrooms?** ${dna.basic.beds} bedrooms.` : "",
        dna.basic.baths != null ? `**How many bathrooms?** ${dna.basic.baths} bathrooms.` : "",
        dna.basic.squareFeet != null ? `**What is the square footage?** ${dna.basic.squareFeet.toLocaleString()} finished sq ft.` : "",
        dna.basic.yearBuilt != null ? `**When was it built?** ${dna.basic.yearBuilt}.` : "",
      ].filter(Boolean),
    },
    {
      title: "Systems & Utilities",
      items: Object.values(dna.systems)
        .filter((fact): fact is Fact => Boolean(fact))
        .map((fact) => `**${fact.label}?** ${fact.value}`),
    },
    {
      title: "Rooms",
      items: dna.rooms
        .filter((room) => room.features.length || room.buyerTalkingPoints.length)
        .slice(0, 6)
        .map((room) => `**What should I know about the ${room.name.toLowerCase()}?** ${[...room.buyerTalkingPoints, ...room.features].slice(0, 3).join("; ")}`),
    },
    {
      title: "Neighborhood",
      items: dna.neighborhood.notes.slice(0, 5).map((fact) => `- ${fact.value}`),
    },
    {
      title: "From Buyer Questions",
      items: dna.buyerQuestions
        .filter((question) => question.answer && !question.needsAgentFollowup)
        .slice(0, 8)
        .map((question) => `**${question.question}** ${question.answer}`),
    },
  ];

  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => [`## ${group.title}`, group.items.join("\n")].join("\n"))
    .join("\n\n");
}

function generateShowingNotes(dna: PropertyDNA): string {
  const talkingPoints = [
    ...dna.rooms.flatMap((room) => room.buyerTalkingPoints),
    ...topFeatures(dna, 5),
  ];
  const cautions = dna.rooms.flatMap((room) => room.cautions);
  const expected = dna.buyerQuestions.slice(0, 6).map((question) => question.question);

  return [
    "# Showing Notes (agent-facing)",
    "",
    "## Best Talking Points",
    bulletList(dedupe(talkingPoints).slice(0, 8), "Add room talking points to strengthen showings."),
    "",
    "## Sensitive / Do Not Overstate",
    bulletList(dedupe(cautions), "None flagged."),
    "",
    "## Buyer Questions to Expect",
    bulletList(dedupe(expected), "No buyer questions logged yet."),
    "",
    "## Verify Before Publishing",
    bulletList(dna.health.missingInformation.slice(0, 8), "Nothing outstanding."),
  ].join("\n");
}

function generateVoiceIntroductions(dna: PropertyDNA): string {
  const address = shortAddress(dna);
  return [
    "## General Greeting",
    `Welcome to ${address}. I'm your AI guide — ask me anything about this home, from the kitchen finishes to the neighborhood.`,
    "",
    "## Room-Specific Greeting",
    `You're exploring one of the rooms at ${address}. Ask me about features, updates, or what's included.`,
    "",
    "## Open House Greeting",
    `Thanks for visiting our open house at ${address}. Scan any room's QR code and I'll answer your questions on the spot.`,
    "",
    "## Unknown-Answer Fallback",
    "I don't have that detail yet, but I can send your question straight to the listing agent. Would you like to leave your contact info?",
    "",
    "## Lead-Capture Prompt",
    "If you'd like a follow-up or a copy of the brochure, share your name and email and the agent will reach out.",
  ].join("\n");
}

function generateNeighborhoodGuide(dna: PropertyDNA): string {
  const sections: Array<[string, Fact[]]> = [
    ["Schools", dna.neighborhood.schools],
    ["Shopping", dna.neighborhood.shopping],
    ["Dining", dna.neighborhood.restaurants],
    ["Parks & Recreation", dna.neighborhood.parks],
    ["Commute", dna.neighborhood.commute],
    ["Notes", dna.neighborhood.notes],
  ];
  const body = sections
    .filter(([, facts]) => facts.length > 0)
    .map(([title, facts]) => [`## ${title}`, bulletList(facts.map(factText), "")].join("\n"))
    .join("\n\n");
  return body || "Neighborhood details will appear here once added to Property DNA.";
}

function generatePropertyWebsite(dna: PropertyDNA): string {
  return [
    `# ${dna.basic.address ?? "Property Website"}`,
    "",
    "## Hero",
    dna.basic.summary ?? dna.basic.mlsDescription ?? "A wonderful home waiting for its next owner.",
    "",
    "## Highlights",
    bulletList(topFeatures(dna, 8), "Feature details coming soon."),
    "",
    "## Rooms",
    roomHighlights(dna, 8),
    "",
    "## Neighborhood",
    bulletList(dna.neighborhood.notes.map(factText), "Neighborhood notes coming soon."),
    "",
    agentBlock(dna),
  ].join("\n");
}

function generateQrTour(dna: PropertyDNA): string {
  return [
    `# QR Tour — ${shortAddress(dna)}`,
    "",
    "Scan room QR codes to ask questions about this home in real time.",
    "",
    "## Rooms on tour",
    bulletList(dna.rooms.map((room) => room.name), "Whole Property"),
    "",
    "## Sample questions buyers ask",
    bulletList(
      dna.buyerQuestions.slice(0, 5).map((question) => question.question),
      "- How old is the roof?\n- What schools are nearby?\n- What are the utility costs?",
    ),
  ].join("\n");
}

function generateVoiceKnowledgeBase(dna: PropertyDNA): string {
  const systemFacts = Object.values(dna.systems)
    .filter((fact): fact is Fact => Boolean(fact))
    .map((fact) => `- ${fact.label}: ${fact.value}`);
  const roomFacts = dna.rooms.flatMap((room) =>
    [...room.features, ...room.buyerTalkingPoints].map((item) => `- ${room.name}: ${item}`),
  );
  return [
    "# Voice Agent Knowledge Base",
    "",
    "## Property Basics",
    basicsBlock(dna),
    "",
    "## Systems",
    bulletList(systemFacts, "No system details recorded."),
    "",
    "## Room Knowledge",
    bulletList(roomFacts.slice(0, 20), "Add room features to improve answers."),
    "",
    "## Neighborhood",
    bulletList(dna.neighborhood.notes.map(factText), "No neighborhood notes yet."),
  ].join("\n");
}

function generateFamilyDescription(dna: PropertyDNA): string {
  const schools = dna.neighborhood.schools.map(factText).join(", ");
  return [
    `Welcome home to ${shortAddress(dna)} — a comfortable fit for family life.`,
    dna.basic.beds != null ? `With ${dna.basic.beds} bedrooms` : "",
    schools ? `near ${schools}` : "",
    topFeatures(dna, 4).length ? `, you'll love ${joinList(topFeatures(dna, 4))}.` : ".",
    dna.basic.summary ? ` ${dna.basic.summary}` : "",
  ]
    .filter(Boolean)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function generateInvestorDescription(dna: PropertyDNA): string {
  return [
    `Investment opportunity at ${shortAddress(dna)}.`,
    dna.basic.price != null ? `Listed at $${dna.basic.price.toLocaleString()}.` : "",
    dna.basic.squareFeet != null ? `${dna.basic.squareFeet.toLocaleString()} sq ft.` : "",
    topFeatures(dna, 4).length ? `Key features: ${joinList(topFeatures(dna, 4))}.` : "",
    "Verify financials, rents, and condition with your advisor.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateFacebookPost(dna: PropertyDNA): string {
  return [
    `🏡 ${dna.basic.address ?? "New listing"}`,
    dna.basic.price != null ? `💰 $${dna.basic.price.toLocaleString()}` : "",
    basicsBlock(dna),
    "",
    topFeatures(dna, 3).join(" · ") || dna.basic.summary || "Schedule a showing today.",
    "",
    "Message me for details or scan the QR tour on site.",
  ]
    .filter(Boolean)
    .join("\n");
}

function generateInstagramPost(dna: PropertyDNA): string {
  const tags = ["#realestate", "#newlisting", "#homeforsale", "#propertypilot"];
  return [
    `${shortAddress(dna)} ✨`,
    dna.basic.summary?.slice(0, 200) ?? generateMlsDescription(dna).slice(0, 200),
    "",
    tags.join(" "),
  ].join("\n");
}

function generateLinkedInPost(dna: PropertyDNA): string {
  return [
    `Just listed: ${dna.basic.address ?? shortAddress(dna)}`,
    "",
    generateMlsDescription(dna).slice(0, 400),
    "",
    "Reach out for a private showing or investor package.",
  ].join("\n");
}

function generateJustListedEmail(dna: PropertyDNA): string {
  return [
    `Subject: Just Listed — ${shortAddress(dna)}`,
    "",
    `I'm excited to share a new listing at ${dna.basic.address ?? shortAddress(dna)}.`,
    "",
    basicsBlock(dna),
    "",
    topFeatures(dna, 5).map((feature) => `• ${feature}`).join("\n") || "• Details available on request.",
    "",
    "Reply to schedule a showing or request the buyer brochure.",
    "",
    agentBlock(dna),
  ].join("\n");
}

function generateOpenHouseEmail(dna: PropertyDNA): string {
  return [
    `Subject: Open House — ${shortAddress(dna)}`,
    "",
    `You're invited to tour ${dna.basic.address ?? shortAddress(dna)}.`,
    "",
    "## What to expect",
    bulletList(topFeatures(dna, 5), "A welcoming home ready for your visit."),
    "",
    "Scan the QR codes in each room to ask questions on the spot.",
    "",
    agentBlock(dna),
  ].join("\n");
}

function generatePriceReductionEmail(dna: PropertyDNA): string {
  return [
    `Subject: Price Update — ${shortAddress(dna)}`,
    "",
    `Great news on ${dna.basic.address ?? shortAddress(dna)}.`,
    dna.basic.price != null ? `Now offered at $${dna.basic.price.toLocaleString()}.` : "",
    "",
    generateMlsDescription(dna).slice(0, 300),
    "",
    "Reply if you'd like a private showing.",
  ]
    .filter(Boolean)
    .join("\n");
}

function basicsBlock(dna: PropertyDNA): string {
  return [
    dna.basic.price != null ? `Price: $${dna.basic.price.toLocaleString()}` : null,
    dna.basic.beds != null ? `Beds: ${dna.basic.beds}` : null,
    dna.basic.baths != null ? `Baths: ${dna.basic.baths}` : null,
    dna.basic.squareFeet != null ? `${dna.basic.squareFeet.toLocaleString()} sq ft` : null,
    dna.basic.lotSize != null ? `Lot: ${dna.basic.lotSize.toLocaleString()} sq ft` : null,
    dna.basic.yearBuilt != null ? `Built ${dna.basic.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function agentBlock(dna: PropertyDNA): string {
  const contact = [dna.meta.agentName, dna.meta.agentEmail, dna.meta.agentPhone].filter(Boolean).join(" · ");
  return contact ? `Contact: ${contact}` : "Contact your listing agent for details.";
}

function topFeatures(dna: PropertyDNA, limit: number): string[] {
  const features = [
    ...dna.rooms.flatMap((room) => room.features),
    ...dna.exterior.features.map(factText),
    ...dna.exterior.lotFeatures.map(factText),
  ];
  return dedupe(features).slice(0, limit);
}

function majorUpdates(dna: PropertyDNA): string[] {
  const updates = [
    ...dna.rooms.flatMap((room) => room.upgrades),
    ...Object.values(dna.systems)
      .filter((fact): fact is Fact => Boolean(fact))
      .map((fact) => `${fact.label}: ${fact.value}`),
  ];
  return dedupe(updates).slice(0, 8);
}

function roomHighlights(dna: PropertyDNA, limit: number): string {
  const rooms = dna.rooms
    .filter((room) => room.features.length || room.description || room.buyerTalkingPoints.length)
    .slice(0, limit);
  if (rooms.length === 0) return "Room highlights coming soon.";
  return rooms
    .map((room) => {
      const detail = [room.description, ...room.features].filter(Boolean).slice(0, 3).join("; ");
      return `- **${room.name}**: ${detail || "Details coming soon."}`;
    })
    .join("\n");
}

function factText(fact: Fact): string {
  return fact.value;
}

function bulletList(items: string[], fallback: string): string {
  const filtered = dedupe(items.filter(Boolean));
  if (filtered.length === 0) return fallback;
  return filtered.map((item) => `- ${item}`).join("\n");
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function shortAddress(dna: PropertyDNA): string {
  return dna.basic.address?.split(",")[0] ?? "this property";
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item.trim());
  }
  return result;
}
