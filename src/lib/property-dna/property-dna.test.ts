import { describe, expect, it } from "vitest";

import type { PropertyIntelligence } from "@/lib/property-intelligence";

import { assemblePropertyDNA, type AssemblePropertyDNAInput } from "./assemble";
import { generateAllAssets, generateAsset } from "./asset-generation";
import { answerQuestionFromDNA, UNKNOWN_ANSWER } from "./question-answering";
import { generateRecommendations } from "./recommendations";

const intelligence: PropertyIntelligence = {
  propertySummary: "Beautifully updated 4 bed home with a quartz kitchen near downtown parks.",
  keyFeatures: ["Quartz kitchen island", "Hardwood floors"],
  upgrades: ["Kitchen remodel 2022"],
  rooms: [{ name: "Kitchen", features: ["Quartz counters", "Gas range"] }],
  exteriorFeatures: ["Covered deck"],
  lotFeatures: ["Fenced backyard"],
  neighborhoodNotes: ["Walking distance to the community park and coffee shops."],
  possibleBuyerQuestions: ["What updates were completed?"],
  agentTalkingPoints: ["Quartz kitchen island"],
  missingInformation: ["No supporting documents uploaded."],
  sourceMap: [],
};

function baseInput(overrides: Partial<AssemblePropertyDNAInput> = {}): AssemblePropertyDNAInput {
  return {
    property: {
      id: "prop-1",
      slug: "123-main",
      street: "123 Main St",
      city: "Austin",
      provinceState: "TX",
      price: 725000,
      beds: 4,
      baths: 3,
      squareFeet: 2450,
      yearBuilt: 2019,
      propertyType: "single_family",
      schoolDistrict: "Austin ISD",
      status: "draft",
      agentName: "Jamie Agent",
      agentEmail: "jamie@example.com",
      ...overrides.property,
    },
    intelligence,
    rooms: [
      {
        id: "room-1",
        name: "Kitchen",
        description: "Chef's kitchen",
        features: ["Quartz counters", "Large island"],
        updates: ["Remodeled 2022"],
        talkingPoints: ["Great for entertaining"],
      },
    ],
    voiceNotes: [{ id: "voice-1", transcript: "The roof was replaced in 2021 and the HVAC is a 2020 heat pump." }],
    documents: [],
    photos: [{ id: "photo-1", storagePath: "prop-1/kitchen.webp", detectedRoom: "Kitchen", isPrimary: true }],
    buyerQuestions: [],
    ...overrides,
  };
}

describe("assemblePropertyDNA", () => {
  it("builds a normalized DNA object from all sources", () => {
    const dna = assemblePropertyDNA(baseInput());

    expect(dna.propertyId).toBe("prop-1");
    expect(dna.basic.address).toBe("123 Main St, Austin, TX");
    expect(dna.basic.price).toBe(725000);
    expect(dna.basic.summary).toContain("quartz kitchen");
  });

  it("merges manual room knowledge with intelligence rooms", () => {
    const dna = assemblePropertyDNA(baseInput());
    const kitchen = dna.rooms.find((room) => room.name === "Kitchen");
    expect(kitchen).toBeDefined();
    expect(kitchen?.features).toContain("Quartz counters");
    expect(kitchen?.features).toContain("Gas range");
    expect(kitchen?.upgrades).toContain("Remodeled 2022");
  });

  it("derives systems facts from voice-note corpus", () => {
    const dna = assemblePropertyDNA(baseInput());
    expect(dna.systems.roof?.value).toMatch(/roof was replaced in 2021/i);
    expect(dna.systems.hvac?.value).toMatch(/heat pump/i);
    expect(dna.systems.roof?.sourceRefs[0]?.sourceType).toBe("voice_note");
  });

  it("computes non-zero health scores and flags missing systems", () => {
    const dna = assemblePropertyDNA(baseInput());
    expect(dna.health.knowledgeScore).toBeGreaterThan(0);
    expect(dna.health.marketingScore).toBeGreaterThan(0);
    expect(dna.health.missingInformation).toContain("Water heater details missing.");
    expect(dna.health.missingInformation).toContain("No QR tour published.");
  });
});

describe("answerQuestionFromDNA", () => {
  it("answers a room question from DNA content", () => {
    const dna = assemblePropertyDNA(baseInput());
    const result = answerQuestionFromDNA(dna, { selectedRoom: "Kitchen", question: "Tell me about the kitchen counters" });
    expect(result.needsAgentFollowup).toBe(false);
    expect(result.answer.toLowerCase()).toContain("quartz");
    expect(result.sourceRefs.length).toBeGreaterThan(0);
  });

  it("flags follow-up when DNA has no relevant content", () => {
    const dna = assemblePropertyDNA(baseInput());
    const result = answerQuestionFromDNA(dna, { selectedRoom: "Whole Property", question: "Is there a helicopter pad?" });
    expect(result.needsAgentFollowup).toBe(true);
    expect(result.answer).toBe(UNKNOWN_ANSWER);
  });

  it("requires verification for disclosure-sensitive topics", () => {
    const dna = assemblePropertyDNA(baseInput());
    const result = answerQuestionFromDNA(dna, { selectedRoom: "Whole Property", question: "What are the property taxes and school ratings?" });
    expect(result.needsAgentFollowup).toBe(true);
    expect(result.confidence).toBe("low");
  });
});

describe("generateAsset / generateAllAssets", () => {
  it("generates every supported asset from DNA", () => {
    const dna = assemblePropertyDNA(baseInput());
    const assets = generateAllAssets(dna);
    const types = assets.map((asset) => asset.type);
    expect(types).toContain("feature_sheet");
    expect(types).toContain("buyer_brochure");
    expect(types).toContain("qr_sign");
    expect(types).toContain("voice_intro");
    expect(assets.every((asset) => asset.content.length > 0)).toBe(true);
  });

  it("includes address and disclaimer in the feature sheet", () => {
    const dna = assemblePropertyDNA(baseInput());
    const asset = generateAsset(dna, "feature_sheet");
    expect(asset.content).toContain("123 Main St");
    expect(asset.content).toContain("independently verified");
  });

  it("builds QR signs for each room", () => {
    const dna = assemblePropertyDNA(baseInput());
    const asset = generateAsset(dna, "qr_sign");
    expect(asset.content.toLowerCase()).toContain("scan to ask questions about this kitchen");
  });
});

describe("generateRecommendations", () => {
  it("recommends adding missing systems and publishing", () => {
    const dna = assemblePropertyDNA(baseInput());
    const recs = generateRecommendations(dna);
    expect(recs.some((rec) => rec.id === "water-heater")).toBe(true);
    // roof + hvac are present in the voice note, so they should not be flagged
    expect(recs.some((rec) => rec.id === "roof-age")).toBe(false);
    expect(recs.some((rec) => rec.id === "hvac-age")).toBe(false);
  });

  it("detects repeated buyer questions", () => {
    const dna = assemblePropertyDNA(
      baseInput({
        buyerQuestions: [
          { id: "q1", question: "How old is the roof?", normalizedQuestion: "how old is the roof?", needsAgentFollowup: false, createdAt: "2026-07-01T00:00:00Z" },
          { id: "q2", question: "How old is the roof?", normalizedQuestion: "how old is the roof?", needsAgentFollowup: false, createdAt: "2026-07-02T00:00:00Z" },
        ],
      }),
    );
    const recs = generateRecommendations(dna);
    expect(recs.some((rec) => rec.category === "buyer_signal" && rec.title.includes("same question"))).toBe(true);
  });
});
