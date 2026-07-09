const UPGRADE_PATTERNS = [
  /\b(?:new|updated|renovated|remodeled|replaced|upgraded)\b[^.!?\n]{0,120}/gi,
  /\b(?:roof|hvac|furnace|water heater|kitchen|bathroom|windows|flooring)\b[^.!?\n]{0,80}\b(?:20\d{2}|19\d{2})\b/gi,
];

const FEATURE_KEYWORDS = [
  "quartz",
  "granite",
  "hardwood",
  "stainless",
  "fireplace",
  "pool",
  "deck",
  "patio",
  "garage",
  "solar",
  "smart home",
  "walk-in closet",
  "pantry",
  "island",
  "vaulted",
  "fenced",
];

const ROOM_NAMES = [
  "kitchen",
  "living room",
  "dining room",
  "primary bedroom",
  "bedroom",
  "bathroom",
  "garage",
  "basement",
  "office",
  "laundry",
];

const EXTERIOR_KEYWORDS = ["pool", "deck", "patio", "porch", "fenced", "garage", "driveway", "solar"];
const LOT_KEYWORDS = ["acre", "lot", "cul-de-sac", "corner lot", "fenced yard", "backyard"];
const NEIGHBORHOOD_KEYWORDS = ["school", "park", "downtown", "transit", "shopping", "restaurant", "trail"];
const DISCLOSURE_KEYWORDS = ["leak", "foundation", "mold", "asbestos", "unpermitted", "settling", "flood"];

export function extractFeaturePhrases(text: string): string[] {
  const normalized = normalizeText(text);
  const features = new Set<string>();

  for (const keyword of FEATURE_KEYWORDS) {
    const pattern = new RegExp(`[^.!?\\n]{0,55}\\b${escapeRegExp(keyword)}\\b[^.!?\\n]{0,55}`, "gi");
    for (const match of normalized.matchAll(pattern)) {
      const phrase = cleanPhrase(match[0]);
      if (phrase) features.add(phrase);
    }
  }

  return Array.from(features).slice(0, 12);
}

export function extractUpgradePhrases(text: string): string[] {
  const upgrades = new Set<string>();
  for (const pattern of UPGRADE_PATTERNS) {
    for (const match of normalizeText(text).matchAll(pattern)) {
      const phrase = cleanPhrase(match[0]);
      if (phrase) upgrades.add(phrase);
    }
  }
  return Array.from(upgrades).slice(0, 12);
}

export function extractRoomFacts(text: string): Array<{ name: string; features: string[] }> {
  const normalized = normalizeText(text);
  return ROOM_NAMES.map((room) => {
    const pattern = new RegExp(`[^.!?\\n]{0,80}\\b${escapeRegExp(room)}\\b[^.!?\\n]{0,100}`, "gi");
    const features = Array.from(normalized.matchAll(pattern))
      .map((match) => cleanPhrase(match[0]))
      .filter((phrase): phrase is string => Boolean(phrase))
      .slice(0, 4);
    return features.length ? { name: room, features } : null;
  }).filter((item): item is { name: string; features: string[] } => Boolean(item));
}

export function extractKeywordPhrases(text: string, keywords: string[]): string[] {
  const normalized = normalizeText(text);
  const phrases = new Set<string>();

  for (const keyword of keywords) {
    const pattern = new RegExp(`[^.!?\\n]{0,65}\\b${escapeRegExp(keyword)}\\b[^.!?\\n]{0,75}`, "gi");
    for (const match of normalized.matchAll(pattern)) {
      const phrase = cleanPhrase(match[0]);
      if (phrase) phrases.add(phrase);
    }
  }

  return Array.from(phrases).slice(0, 8);
}

export function extractExteriorPhrases(text: string): string[] {
  return extractKeywordPhrases(text, EXTERIOR_KEYWORDS);
}

export function extractLotPhrases(text: string): string[] {
  return extractKeywordPhrases(text, LOT_KEYWORDS);
}

export function extractNeighborhoodPhrases(text: string): string[] {
  return extractKeywordPhrases(text, NEIGHBORHOOD_KEYWORDS);
}

export function extractDisclosureSensitivePhrases(text: string): string[] {
  return extractKeywordPhrases(text, DISCLOSURE_KEYWORDS);
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanPhrase(value: string): string | null {
  const phrase = normalizeText(value)
    .replace(/^[-:;,.\s]+/, "")
    .replace(/[-:;,.\s]+$/, "");
  return phrase.length >= 4 ? phrase : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
