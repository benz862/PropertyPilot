export const STAGING_STYLE_IDS = [
  "modern",
  "scandinavian",
  "mid_century",
  "farmhouse",
  "coastal",
  "industrial",
  "luxury",
  "minimalist",
  "japandi",
  "traditional",
] as const;

export type StagingStyleId = (typeof STAGING_STYLE_IDS)[number];

export interface StagingStyle {
  id: StagingStyleId;
  label: string;
  /** Prompt fragment describing furniture and decor style. */
  prompt: string;
}

/**
 * Structure-preserving instructions appended to every style prompt.
 * Tuned for fal apartment-staging LoRA: keep architecture, change furnishings.
 */
export const STAGING_STRUCTURE_GUARD =
  "Furnish this room. Keep the exact same room layout, walls, windows, doors, ceiling, floor material, camera angle, and lighting direction. Do not change architecture or add/remove structural elements. Photorealistic MLS listing photograph, natural shadows, no watermark, no text overlay.";

export const STAGING_STYLES: StagingStyle[] = [
  {
    id: "modern",
    label: "Modern",
    prompt:
      "Furnish with clean modern furniture: low-profile sofa, simple wood coffee table, minimal art, neutral palette with black accents, uncluttered",
  },
  {
    id: "scandinavian",
    label: "Scandinavian",
    prompt:
      "Furnish in Scandinavian style: light oak wood, white and soft gray textiles, cozy throws, simple greenery, bright airy uncluttered look",
  },
  {
    id: "mid_century",
    label: "Mid-Century",
    prompt:
      "Furnish mid-century modern: tapered wood legs, warm walnut tones, geometric patterns, iconic lounge chair, vintage-inspired accents",
  },
  {
    id: "farmhouse",
    label: "Modern Farmhouse",
    prompt:
      "Furnish modern farmhouse: slipcovered sofa, rustic wood accents, soft neutrals, woven textures, warm inviting lived-in look",
  },
  {
    id: "coastal",
    label: "Coastal",
    prompt:
      "Furnish coastal style: light blues and sandy neutrals, rattan and linen textures, breezy relaxed seating, subtle seaside accents",
  },
  {
    id: "industrial",
    label: "Industrial",
    prompt:
      "Furnish industrial loft style: metal frames, leather seating, charcoal and warm wood tones, spare masculine accents",
  },
  {
    id: "luxury",
    label: "Luxury",
    prompt:
      "Furnish luxury style: elegant upholstered seating, rich fabrics, marble or brass accents, refined artwork, high-end hotel feel",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    prompt:
      "Furnish minimalist: very few carefully chosen pieces, muted palette, generous negative space, simple geometric forms",
  },
  {
    id: "japandi",
    label: "Japandi",
    prompt:
      "Furnish Japandi style: low wood furniture, natural materials, soft earth tones, calm zen balance, Japanese-Scandinavian blend",
  },
  {
    id: "traditional",
    label: "Traditional",
    prompt:
      "Furnish traditional style: classic sofa, wood side tables, warm layered textiles, framed art, timeless inviting living space",
  },
];

export function isStagingStyleId(value: string): value is StagingStyleId {
  return (STAGING_STYLE_IDS as readonly string[]).includes(value);
}

export function getStagingStyle(id: StagingStyleId): StagingStyle {
  const style = STAGING_STYLES.find((entry) => entry.id === id);
  if (!style) {
    throw new Error(`Unknown staging style: ${id}`);
  }
  return style;
}

export function buildStagingPrompt(styleId: StagingStyleId, customNote?: string): string {
  const style = getStagingStyle(styleId);
  const note = customNote?.trim();
  const parts = [STAGING_STRUCTURE_GUARD, style.prompt];
  if (note) {
    parts.push(note);
  }
  return parts.join(" ");
}
