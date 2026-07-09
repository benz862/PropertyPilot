import { describe, expect, it } from "vitest";

import { validateFactValue, detectConflictingFacts } from "@/lib/knowledge-engine";
import { hasEntitlement, getPlanByTier } from "@/lib/commerce";
import { hasPermission } from "@/lib/security";
import { PRODUCT_PRINCIPLES } from "@/lib/product/constitution";

describe("Knowledge Engine validation", () => {
  it("rejects empty fact values", () => {
    const result = validateFactValue("roof_type", "");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("detects conflicting facts", () => {
    const conflicts = detectConflictingFacts([
      {
        id: "1",
        propertyId: "p1",
        knowledgeObjectId: "ko1",
        factKey: "roof_type",
        factValue: "Shingle",
        versionNumber: 1,
        verificationLevel: "verified",
        source: "agent",
        sourceReference: null,
        isCurrent: true,
        retiredAt: null,
        createdBy: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        propertyId: "p1",
        knowledgeObjectId: "ko1",
        factKey: "roof_type",
        factValue: "Metal",
        versionNumber: 2,
        verificationLevel: "likely",
        source: "agent",
        sourceReference: null,
        isCurrent: true,
        retiredAt: null,
        createdBy: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    expect(conflicts.length).toBe(1);
  });
});

describe("Commerce entitlements", () => {
  it("grants voice_ai on starter plan", () => {
    const plan = getPlanByTier("starter");
    expect(hasEntitlement(plan.entitlements, "voice_ai")).toBe(true);
    expect(hasEntitlement(plan.entitlements, "enterprise_api")).toBe(false);
  });
});

describe("Security RBAC", () => {
  it("allows realtor property write", () => {
    expect(hasPermission("realtor", "property:write")).toBe(true);
  });

  it("denies visitor property write", () => {
    expect(hasPermission("visitor", "property:write")).toBe(false);
  });
});

describe("Product constitution", () => {
  it("defines core principles", () => {
    expect(PRODUCT_PRINCIPLES.length).toBeGreaterThanOrEqual(5);
  });
});
