/**
 * Product Constitution (PRD-024) — evergreen principles guiding all features.
 */
export const PRODUCT_MISSION =
  "Build the world's most trusted AI-powered property intelligence platform.";

export const PRODUCT_PRINCIPLES = [
  "Information should be verified.",
  "AI should admit uncertainty.",
  "Knowledge should outlive listings.",
  "Automation should reduce work, not create it.",
  "Technology should become invisible.",
] as const;

export const PRODUCT_CONSTRAINTS = {
  neverGuess: true,
  neverTrainOnCustomerData: true,
  digitalPropertyTwinIsSourceOfTruth: true,
  qrIsNotTheProduct: true,
} as const;

export type ProductPrinciple = (typeof PRODUCT_PRINCIPLES)[number];

export {
  PLATFORM_MISSION,
  PLATFORM_PILLARS,
  PRIMARY_USER_JOURNEYS,
} from "./platform-blueprint";
