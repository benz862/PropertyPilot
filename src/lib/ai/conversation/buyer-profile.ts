export interface BuyerProfileMemory {
  familySize: string | null;
  hasPets: boolean | null;
  needsHomeOffice: boolean | null;
  garageInterest: boolean | null;
  investmentGoals: boolean | null;
  accessibilityNeeds: boolean | null;
  communicationPreference: string | null;
}

export const EMPTY_BUYER_PROFILE: BuyerProfileMemory = {
  familySize: null,
  hasPets: null,
  needsHomeOffice: null,
  garageInterest: null,
  investmentGoals: null,
  accessibilityNeeds: null,
  communicationPreference: null,
};

const PROFILE_PATTERNS: Array<{
  field: keyof BuyerProfileMemory;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray) => BuyerProfileMemory[keyof BuyerProfileMemory];
}> = [
  {
    field: "familySize",
    patterns: [/\b(\d+)\s*(kids?|children)\b/i, /\bfamily of (\d+)\b/i],
    extract: (match) => match[1] ?? null,
  },
  {
    field: "hasPets",
    patterns: [/\b(dog|cat|pet|pets)\b/i],
    extract: () => true,
  },
  {
    field: "needsHomeOffice",
    patterns: [/\b(work from home|home office|remote work|office space)\b/i],
    extract: () => true,
  },
  {
    field: "garageInterest",
    patterns: [/\b(garage|parking|carport|workshop)\b/i],
    extract: () => true,
  },
  {
    field: "investmentGoals",
    patterns: [/\b(invest|rental|income property|flip)\b/i],
    extract: () => true,
  },
  {
    field: "accessibilityNeeds",
    patterns: [/\b(wheelchair|accessib|ada|ramp|mobility)\b/i],
    extract: () => true,
  },
  {
    field: "communicationPreference",
    patterns: [/\b(email me|text me|call me|prefer (email|phone|text))\b/i],
    extract: (match) => match[1]?.toLowerCase() ?? "contact",
  },
];

export function extractBuyerProfile(
  message: string,
  existing: BuyerProfileMemory = EMPTY_BUYER_PROFILE,
): BuyerProfileMemory {
  const profile = { ...existing };

  for (const rule of PROFILE_PATTERNS) {
    if (profile[rule.field] !== null && profile[rule.field] !== undefined) {
      continue;
    }
    for (const pattern of rule.patterns) {
      const match = message.match(pattern);
      if (match) {
        profile[rule.field] = rule.extract(match) as never;
        break;
      }
    }
  }

  return profile;
}

export function formatBuyerProfile(profile: BuyerProfileMemory): string {
  const parts: string[] = [];
  if (profile.familySize) parts.push(`Family size: ${profile.familySize}`);
  if (profile.hasPets) parts.push("Has pets");
  if (profile.needsHomeOffice) parts.push("Needs home office");
  if (profile.garageInterest) parts.push("Interested in garage/workshop");
  if (profile.investmentGoals) parts.push("Investment buyer");
  if (profile.accessibilityNeeds) parts.push("Accessibility needs");
  if (profile.communicationPreference) {
    parts.push(`Prefers ${profile.communicationPreference}`);
  }
  return parts.length > 0 ? parts.join("; ") : "No buyer profile signals yet.";
}

export function getProfileRecommendation(
  profile: BuyerProfileMemory,
): string | undefined {
  if (profile.needsHomeOffice) {
    return "In that case, the Flex Space or rear office might be worth a closer look.";
  }
  if (profile.garageInterest) {
    return "The garage and workshop areas might be especially relevant for you.";
  }
  if (profile.accessibilityNeeds) {
    return "I can point out accessibility features throughout the home if that would help.";
  }
  if (profile.hasPets) {
    return "The backyard and fencing details might be worth exploring.";
  }
  return undefined;
}
