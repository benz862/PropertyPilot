import { afterEach, describe, expect, it, vi } from "vitest";

import { extractMlsData } from "@/lib/property-builder/extractors/mls-extractor";
import type { PropertyProfile } from "@/lib/property-twin/types";

const profile: PropertyProfile = {
  id: "property-1",
  ownerId: "owner-1",
  mlsNumber: null,
  status: "draft",
  street: "123 Main St",
  city: "Austin",
  provinceState: "TX",
  postalCode: "78701",
  country: "US",
  latitude: null,
  longitude: null,
  propertyType: "single_family",
  bedrooms: 4,
  bathrooms: 3,
  finishedSquareFeet: 2450,
  lotSize: null,
  yearBuilt: 2019,
  annualTaxes: null,
  hoa: {},
  schoolDistrict: null,
  publicRemarks: null,
  privateNotes: null,
  listingPrice: 725000,
  listingStatus: "draft",
  agentName: null,
  brokerage: null,
  utilities: {},
  taxInformation: {},
  propertyDescription: null,
  voicePersonalityId: null,
  aiPolicyId: null,
  publishedAt: null,
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z",
};

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.doUnmock("openai");
  vi.doUnmock("@/lib/supabase/server");
});

describe("buildPropertyIntelligence", () => {
  it("builds sourced intelligence from MLS only", async () => {
    const { buildPropertyIntelligence } = await import("./service");
    const mls = extractMlsData({
      structured: {
        features: ["Quartz kitchen island", "Fenced backyard"],
        public_remarks: "Updated kitchen with quartz counters near downtown parks.",
        school_district: "Austin ISD",
      },
    });

    const result = buildPropertyIntelligence({ profile, mls });

    expect(result.propertySummary).toContain("Updated kitchen");
    expect(result.keyFeatures).toContain("Quartz kitchen island");
    expect(result.neighborhoodNotes).toContain("School district: Austin ISD");
    expect(result.sourceMap.some((entry) => entry.sources.includes("MLS upload"))).toBe(true);
  });

  it("combines MLS and voice-note upgrades", async () => {
    const { analyzeVoiceNote } = await import("@/lib/property-twin/intelligence");
    const { buildPropertyIntelligence } = await import("./service");
    const mls = extractMlsData({ structured: { features: ["Open kitchen"] } });
    const transcript = "The roof was replaced in 2021. The kitchen has quartz counters.";
    const voice = analyzeVoiceNote({ propertyId: profile.id, transcript });

    const result = buildPropertyIntelligence({
      profile,
      mls,
      voiceNotes: [{ id: "voice-1", transcript, result: voice }],
    });

    expect(result.upgrades.some((upgrade) => upgrade.includes("roof was replaced"))).toBe(true);
    expect(
      result.sourceMap.some(
        (entry) => entry.field.includes("roof") && entry.sources.includes("voice note:voice-1"),
      ),
    ).toBe(true);
  });

  it("combines MLS and photo intelligence", async () => {
    const { buildPropertyIntelligence } = await import("./service");
    const result = buildPropertyIntelligence({
      profile,
      mls: extractMlsData({ structured: { features: ["Hardwood floors"] } }),
      photos: [
        {
          id: "photo-1",
          storagePath: "property-1/kitchen-island.webp",
          result: {
            caption: "Kitchen with island",
            detectedFeatures: ["Visible quartz island"],
            detectedRoom: "kitchen",
            detectedObjects: ["pendant lighting"],
            suggestedKnowledgeObjects: [],
            qualityScore: 0.8,
            isDuplicate: false,
          },
        },
      ],
    });

    expect(result.rooms.some((room) => room.name === "Kitchen")).toBe(true);
    expect(result.keyFeatures).toContain("Visible quartz island");
    expect(
      result.sourceMap.some((entry) => entry.sources.includes("photo:property-1/kitchen-island.webp")),
    ).toBe(true);
  });

  it("combines MLS and document intelligence", async () => {
    const { buildPropertyIntelligence } = await import("./service");
    const result = buildPropertyIntelligence({
      profile,
      mls: extractMlsData({ structured: { features: ["Two-car garage"] } }),
      documents: [
        {
          id: "doc-1",
          title: "Inspection",
          storagePath: "property-1/inspection.txt",
          result: {
            extractedDates: ["2024"],
            manufacturers: [],
            modelNumbers: [],
            serialNumbers: [],
            measurements: {},
            maintenanceNotes: ["Water heater replaced in 2024"],
            recommendations: ["Monitor exterior caulking"],
            requiresReview: true,
            rawExtracted: {
              extractedText: "Water heater replaced in 2024. Recommend monitoring exterior caulking.",
            },
          },
        },
      ],
    });

    expect(result.upgrades).toContain("Water heater replaced in 2024");
    expect(result.missingInformation).toContain("Review extracted document facts: Inspection");
    expect(
      result.sourceMap.some((entry) => entry.sources.includes("document:property-1/inspection.txt")),
    ).toBe(true);
  });
});

describe("document and AI failure handling", () => {
  it("returns a structured error when Supabase file read fails", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        storage: {
          from: () => ({
            download: async () => ({ data: null, error: { message: "storage unavailable" } }),
          }),
        },
      }),
    }));
    const { analyzeDocument } = await import("@/lib/property-twin/intelligence");

    const result = await analyzeDocument({
      documentId: "doc-1",
      title: "Inspection",
      documentType: "inspection_report",
      storagePath: "property-1/inspection.pdf",
      mimeType: "application/pdf",
    });

    expect(result.requiresReview).toBe(true);
    expect(result.rawExtracted.error).toBe("storage unavailable");
  });

  it("returns a structured error for unsupported document types", async () => {
    const { analyzeDocument } = await import("@/lib/property-twin/intelligence");

    const result = await analyzeDocument({
      documentId: "doc-2",
      title: "Spreadsheet",
      documentType: "other",
      storagePath: "property-1/data.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    expect(result.requiresReview).toBe(true);
    expect(String(result.rawExtracted.error)).toContain("Unsupported document type");
  });

  it("preserves metadata and records an issue when AI photo extraction fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.doMock("openai", () => ({
      default: class {
        chat = {
          completions: {
            create: async () => {
              throw new Error("vision unavailable");
            },
          },
        };
      },
    }));

    const { analyzePhoto } = await import("@/lib/property-twin/intelligence");
    const result = await analyzePhoto({
      photoId: "photo-1",
      storagePath: "property-1/kitchen-main.jpg",
    });

    expect(result.detectedRoom).toBe("kitchen");
    expect(result.detectedFeatures[0]).toContain("AI photo extraction failed");
    expect(result.suggestedKnowledgeObjects[0]?.name).toBe("kitchen");
  });
});
