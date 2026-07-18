import { describe, expect, it } from "vitest";

import {
  buildStagingPrompt,
  getStagingStyle,
  isStagingStyleId,
  STAGING_STRUCTURE_GUARD,
  STAGING_STYLE_IDS,
  STAGING_STYLES,
} from "./styles";

describe("staging styles", () => {
  it("exposes ten designer styles for the MVP picker", () => {
    expect(STAGING_STYLES).toHaveLength(10);
    expect(STAGING_STYLE_IDS).toHaveLength(10);
  });

  it("validates style ids", () => {
    expect(isStagingStyleId("scandinavian")).toBe(true);
    expect(isStagingStyleId("neon_disco")).toBe(false);
  });

  it("builds prompts that preserve room structure and include style cues", () => {
    for (const style of STAGING_STYLES) {
      const prompt = buildStagingPrompt(style.id);

      expect(prompt.startsWith(STAGING_STRUCTURE_GUARD)).toBe(true);
      expect(prompt).toContain("Keep the exact same room layout");
      expect(prompt).toContain("camera angle");
      expect(prompt.toLowerCase()).toContain(
        style.id === "mid_century"
          ? "mid-century"
          : style.id === "farmhouse"
            ? "farmhouse"
            : style.label.toLowerCase().split(" ")[0]!,
      );
      expect(getStagingStyle(style.id).label).toBe(style.label);
    }
  });

  it("appends optional custom notes without dropping the structure guard", () => {
    const prompt = buildStagingPrompt("minimalist", "Add a single olive tree in the corner.");
    expect(prompt).toContain(STAGING_STRUCTURE_GUARD);
    expect(prompt).toContain("olive tree");
  });
});
