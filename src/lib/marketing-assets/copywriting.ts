import { generatePropertyAssets } from "@/lib/property-builder/asset-generator";
import type { PropertyProfile } from "@/lib/property-twin/types";

import type { CopywritingOutput } from "./types";

export function generateCopywriting(input: {
  profile: PropertyProfile;
  features: string[];
  pois: Array<{ title: string; subtitle: string | null }>;
  publicRemarks?: string | null;
}): CopywritingOutput {
  const assets = generatePropertyAssets({
    profile: input.profile,
    photoCoverage: { entries: [], missingRooms: [], overallCoverage: 0 },
    publicRemarks: input.publicRemarks,
    pois: input.pois,
    suggestedFaqs: [],
    features: input.features,
  });

  return {
    professionalDescription: assets.marketingDescription,
    luxuryDescription: assets.luxuryDescription,
    mlsSummary: assets.propertySummary,
    socialSummary: assets.socialMediaSummary,
    propertyHighlights: assets.featureSheet,
    neighborhoodSummary: input.profile.schoolDistrict
      ? `Located in the ${input.profile.schoolDistrict} school district.`
      : "Neighborhood details available upon request.",
    roomIntroductions: assets.roomIntroductions,
  };
}

export function buildAssetHtml(input: {
  title: string;
  address: string;
  agentName: string;
  brokerage: string | null;
  summary: string;
  features: string[];
  qrUrl: string;
  theme: { primary: string; accent: string };
}): string {
  const featureList = input.features
    .slice(0, 8)
    .map((f) => `<li>${f}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${input.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: ${input.theme.primary}; margin: 2rem; }
    h1 { color: ${input.theme.primary}; border-bottom: 3px solid ${input.theme.accent}; }
    .accent { color: ${input.theme.accent}; }
    ul { line-height: 1.6; }
    .qr { margin-top: 2rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>${input.address}</h1>
  <p class="accent">${input.agentName}${input.brokerage ? ` · ${input.brokerage}` : ""}</p>
  <p>${input.summary}</p>
  <ul>${featureList}</ul>
  <p class="qr">Scan to tour: ${input.qrUrl}</p>
</body>
</html>`;
}
