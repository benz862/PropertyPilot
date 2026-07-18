import type { PropertyProfile } from "@/lib/property-twin/types";

import type { GeneratedAssets, PhotoCoverageMap } from "./types";
import { getMissingCoverageSuggestions } from "./photo-coverage";

interface AssetInput {
  profile: PropertyProfile;
  photoCoverage: PhotoCoverageMap;
  publicRemarks?: string | null;
  pois: Array<{ title: string; subtitle: string | null }>;
  suggestedFaqs: Array<{ question: string; answer: string }>;
  features: string[];
}

export function generatePropertyAssets(input: AssetInput): GeneratedAssets {
  const address = `${input.profile.street}, ${input.profile.city}`;
  const beds = input.profile.bedrooms;
  const baths = input.profile.bathrooms;
  const sqft = input.profile.finishedSquareFeet;

  const propertySummary = [
    address,
    beds != null && baths != null ? `${beds} bed / ${baths} bath` : null,
    sqft != null ? `${sqft.toLocaleString()} sq ft` : null,
    input.profile.yearBuilt != null ? `Built ${input.profile.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const remarks = input.publicRemarks ?? input.profile.publicRemarks ?? "";
  const marketingDescription = remarks
    ? remarks
    : propertySummary || `${input.profile.street}, ${input.profile.city}`;

  const luxuryDescription = remarks || marketingDescription;

  const socialMediaSummary = `${address}${sqft ? ` · ${sqft.toLocaleString()} sq ft` : ""}`;

  const featureSheet = [
    ...input.features.slice(0, 8),
    beds != null ? `${beds} bedrooms` : null,
    baths != null ? `${baths} bathrooms` : null,
    sqft != null ? `${sqft.toLocaleString()} finished sq ft` : null,
  ].filter((item): item is string => Boolean(item));

  const roomIntroductions = input.pois.map((poi) => ({
    room: poi.title,
    introduction:
      poi.subtitle ??
      `Welcome to the ${poi.title}. Ask me anything about this area of the home.`,
  }));

  const showingNotes = [
    ...getMissingCoverageSuggestions(input.photoCoverage.missingRooms).slice(0, 3),
    "Confirm source-attributed facts before publishing.",
  ];

  return {
    propertySummary,
    marketingDescription,
    luxuryDescription,
    socialMediaSummary,
    featureSheet,
    suggestedFaqs: input.suggestedFaqs,
    roomIntroductions,
    showingNotes,
  };
}
