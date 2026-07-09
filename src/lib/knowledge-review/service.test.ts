import { describe, expect, it } from "vitest";

import { classifyReviewItem, getConfidenceBand, shouldRequireManualReview } from "./service";
import type { KnowledgeFact } from "@/lib/property-twin/types";

const existingFact: KnowledgeFact = {
  id: "fact_1",
  propertyId: "property_1",
  knowledgeObjectId: "object_1",
  factKey: "workshop_heated",
  factValue: "No",
  versionNumber: 1,
  verificationLevel: "verified",
  source: "agent",
  sourceReference: null,
  isCurrent: true,
  retiredAt: null,
  createdBy: null,
  createdAt: "",
  updatedAt: "",
};

describe("knowledge review service", () => {
  it("maps confidence to review bands", () => {
    expect(getConfidenceBand(100)).toBe("verified");
    expect(getConfidenceBand(95)).toBe("high");
    expect(getConfidenceBand(80)).toBe("medium");
    expect(getConfidenceBand(69)).toBe("manual_review");
    expect(getConfidenceBand(39)).toBe("never_auto_approve");
  });

  it("requires manual review below seventy percent", () => {
    expect(shouldRequireManualReview(69)).toBe(true);
    expect(shouldRequireManualReview(70)).toBe(false);
  });

  it("detects conflicts against verified facts", () => {
    expect(
      classifyReviewItem(
        { factKey: "workshop_heated", proposedValue: "Yes", confidence: 98 },
        [existingFact],
      ),
    ).toBe("conflict");
  });
});
