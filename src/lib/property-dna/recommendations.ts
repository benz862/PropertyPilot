import type { PropertyDNA } from "./types";

export type RecommendationPriority = "critical" | "important" | "optional";

export type RecommendationCategory =
  | "knowledge"
  | "marketing"
  | "publishing"
  | "buyer_signal"
  | "media";

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
}

const PRIORITY_RANK: Record<RecommendationPriority, number> = {
  critical: 0,
  important: 1,
  optional: 2,
};

export interface RecommendationInput {
  /** Minimum times a normalized question must repeat to trigger an FAQ suggestion. */
  repeatedQuestionThreshold?: number;
}

/**
 * Analyze Property DNA (and the buyer questions captured on it) to produce a
 * prioritized set of "make this property better" recommendations.
 */
export function generateRecommendations(dna: PropertyDNA, input: RecommendationInput = {}): Recommendation[] {
  const recs: Recommendation[] = [];
  const threshold = input.repeatedQuestionThreshold ?? 2;

  if (!dna.systems.roof) {
    recs.push(rec("roof-age", "Add roof age", "Buyers often ask about roof condition. Add the roof age or last replacement year.", "critical", "knowledge"));
  }
  if (!dna.systems.hvac) {
    recs.push(rec("hvac-age", "Add HVAC information", "Add the age and type of heating/cooling — a top buyer concern.", "critical", "knowledge"));
  }
  if (!dna.systems.waterHeater) {
    recs.push(rec("water-heater", "Add water heater details", "Note the water heater age/type so the AI can answer maintenance questions.", "important", "knowledge"));
  }
  if (!dna.systems.internet) {
    recs.push(rec("internet", "Add internet/utility information", "Relocation buyers ask about internet providers and utility costs.", "optional", "knowledge"));
  }

  if (dna.photos.length === 0) {
    recs.push(rec("photos", "Upload property photos", "Add photos so buyers can see the home and the AI can reference rooms.", "critical", "media"));
  } else if (dna.photos.length < 6) {
    recs.push(rec("more-photos", "Add more photos", "You have fewer than 6 photos. Add more to improve marketing readiness.", "optional", "media"));
  } else if (!dna.photos.some((photo) => photo.isPrimary) && !dna.meta.heroImageUrl) {
    recs.push(rec("hero-image", "Choose a hero image", "Pick a primary/hero photo to lead your marketing assets.", "optional", "media"));
  }

  if (!dna.rooms.some((room) => room.id !== null)) {
    recs.push(rec("room-knowledge", "Add room knowledge", "Add room-specific features and talking points so buyers get grounded answers.", "important", "knowledge"));
  }

  const strongestRoom = findStrongestRoom(dna);
  if (strongestRoom) {
    recs.push(
      rec(
        `lead-with-${slug(strongestRoom.name)}`,
        `Improve ${strongestRoom.name.toLowerCase()} marketing`,
        `The ${strongestRoom.name.toLowerCase()} has strong features. Lead with it in your marketing copy.`,
        "optional",
        "marketing",
      ),
    );
  }

  if (dna.neighborhood.notes.length === 0 && dna.neighborhood.schools.length === 0) {
    recs.push(rec("neighborhood-guide", "Generate a Neighborhood Guide", "No neighborhood information yet. Add notes and generate a Neighborhood Guide.", "optional", "marketing"));
  }

  if (dna.generatedAssets.length === 0 && dna.health.knowledgeScore >= 40) {
    recs.push(rec("generate-assets", "Generate marketing assets", "Property DNA has enough detail to generate a feature sheet, brochure, and QR signs.", "important", "marketing"));
  }

  if (dna.meta.publishStatus !== "published" && !dna.meta.publishedAt && dna.health.buyerReadinessScore >= 50) {
    recs.push(rec("publish", "Publish the QR tour", "This property is buyer-ready. Publish the QR tour and print room QR signs before showings.", "important", "publishing"));
  }

  const repeated = findRepeatedQuestions(dna, threshold);
  for (const { normalized, count, sample } of repeated) {
    recs.push(
      rec(
        `faq-${slug(normalized)}`,
        "Buyers keep asking the same question",
        `Buyers asked "${sample}" ${count} times. Add it to your Buyer FAQ or update Property DNA.`,
        "important",
        "buyer_signal",
      ),
    );
  }

  for (const topic of detectRepeatedTopics(dna)) {
    recs.push(
      rec(
        `topic-${topic.id}`,
        topic.title,
        topic.detail,
        "important",
        "buyer_signal",
      ),
    );
  }

  const weakRooms = dna.rooms.filter(
    (room) => room.id !== null && room.features.length + room.buyerTalkingPoints.length < 2,
  );
  if (weakRooms.length > 0) {
    recs.push(
      rec(
        "weak-rooms",
        "Strengthen room coverage",
        `${weakRooms.slice(0, 3).map((room) => room.name).join(", ")} need more features or talking points.`,
        "important",
        "knowledge",
      ),
    );
  }

  const assetTypes = new Set(dna.generatedAssets.map((asset) => asset.type));
  if (!assetTypes.has("buyer_brochure") && dna.health.marketingScore >= 30) {
    recs.push(rec("missing-brochure", "Generate a buyer brochure", "You have enough Property DNA to generate a buyer brochure.", "important", "marketing"));
  }
  if (!assetTypes.has("qr_sign") && dna.meta.publishStatus === "published") {
    recs.push(rec("missing-qr-signs", "Generate QR room signs", "Publish is live but QR signs are not generated yet. Print signs for each room.", "important", "publishing"));
  }
  if (!assetTypes.has("buyer_faq") && dna.buyerQuestions.length >= 2) {
    recs.push(rec("missing-faq", "Generate a Buyer FAQ", "Buyer questions are coming in. Generate an FAQ from Property DNA.", "important", "marketing"));
  }
  if (!assetTypes.has("neighborhood_guide") && dna.neighborhood.notes.length === 0) {
    recs.push(rec("no-neighborhood-guide", "Add a Neighborhood Guide", "Neighborhood information is thin. Add notes and generate a guide.", "optional", "marketing"));
  }

  const unanswered = dna.buyerQuestions.filter((question) => question.needsAgentFollowup).length;
  if (unanswered >= 3) {
    recs.push(
      rec(
        "unanswered-questions",
        "Review unanswered buyer questions",
        `The AI could not answer ${unanswered} buyer questions. Review and add the missing details to Property DNA.`,
        "important",
        "buyer_signal",
      ),
    );
  }

  return recs.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

function findStrongestRoom(dna: PropertyDNA) {
  const ranked = dna.rooms
    .map((room) => ({ room, score: room.features.length + room.upgrades.length + room.buyerTalkingPoints.length }))
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.room ?? null;
}

function detectRepeatedTopics(dna: PropertyDNA) {
  const topics: Array<{ id: string; title: string; detail: string; keywords: string[] }> = [
    {
      id: "roof",
      title: "Buyers keep asking about the roof",
      detail: "Multiple questions mention the roof. Add roof age and condition to Property DNA.",
      keywords: ["roof", "shingle"],
    },
    {
      id: "school",
      title: "Buyers keep asking about schools",
      detail: "School questions are repeating. Add school district and nearby schools to the neighborhood section.",
      keywords: ["school", "district"],
    },
    {
      id: "tax",
      title: "Buyers keep asking about taxes",
      detail: "Tax questions are coming up often. Add annual tax details or where to verify them.",
      keywords: ["tax", "taxes", "property tax"],
    },
    {
      id: "utilities",
      title: "Buyers keep asking about utilities",
      detail: "Utility cost questions are repeating. Add average utility notes to Property DNA.",
      keywords: ["utility", "utilities", "electric", "water bill", "gas bill"],
    },
  ];

  const counts = new Map<string, number>();
  for (const question of dna.buyerQuestions) {
    const text = question.question.toLowerCase();
    for (const topic of topics) {
      if (topic.keywords.some((keyword) => text.includes(keyword))) {
        counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
      }
    }
  }

  return topics.filter((topic) => (counts.get(topic.id) ?? 0) >= 2);
}

function findRepeatedQuestions(dna: PropertyDNA, threshold: number) {
  const counts = new Map<string, { count: number; sample: string }>();
  for (const question of dna.buyerQuestions) {
    const normalized = (question.normalizedQuestion ?? question.question).trim().toLowerCase();
    if (!normalized) continue;
    const existing = counts.get(normalized);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(normalized, { count: 1, sample: question.question });
    }
  }
  return Array.from(counts.entries())
    .filter(([, value]) => value.count >= threshold)
    .map(([normalized, value]) => ({ normalized, count: value.count, sample: value.sample }));
}

function rec(
  id: string,
  title: string,
  detail: string,
  priority: RecommendationPriority,
  category: RecommendationCategory,
): Recommendation {
  return { id, title, detail, priority, category };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
