import { describe, expect, it } from "vitest";

import { toStoredKnowledgeCategory } from "@/lib/property-twin/repository";

describe("toStoredKnowledgeCategory", () => {
  it("keeps categories supported by the database enum", () => {
    expect(toStoredKnowledgeCategory("fireplace")).toBe("fireplace");
    expect(toStoredKnowledgeCategory("other")).toBe("other");
  });

  it("maps compatible semantic aliases", () => {
    expect(toStoredKnowledgeCategory("mechanical")).toBe("hvac");
    expect(toStoredKnowledgeCategory("landscape")).toBe("landscaping");
    expect(toStoredKnowledgeCategory("appliances")).toBe("appliance");
  });

  it("uses the stored catch-all for unsupported semantic categories", () => {
    expect(toStoredKnowledgeCategory("miscellaneous")).toBe("other");
    expect(toStoredKnowledgeCategory("interior")).toBe("other");
    expect(toStoredKnowledgeCategory("accessibility")).toBe("other");
  });
});
