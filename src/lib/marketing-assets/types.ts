export type AssetType =
  | "brochure"
  | "feature_sheet"
  | "welcome_sign"
  | "info_sheet"
  | "open_house_sign"
  | "qr_sign"
  | "summary_pdf"
  | "luxury_brochure"
  | "room_highlight";

export type AssetTheme = "modern" | "luxury" | "minimal" | "classic" | "dark" | "light";

export type AssetStatus = "current" | "outdated" | "generating" | "failed";

export type AssetFormat = "pdf" | "html" | "mobile" | "email" | "png" | "jpg" | "svg";

export type MarketingChannel =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "x"
  | "threads"
  | "google_business_profile"
  | "email_campaign"
  | "mls_remarks"
  | "open_house_invitation"
  | "flyer";

export type MarketingContentType =
  | "property_description"
  | "luxury_description"
  | "feature_spotlight"
  | "workshop_highlight"
  | "neighborhood_highlight"
  | "renovation_story"
  | "timeline_story"
  | "open_house_announcement"
  | "just_listed"
  | "price_reduction"
  | "under_contract"
  | "sold"
  | "agent_introduction"
  | "behind_the_scenes"
  | "faq_carousel"
  | "buyer_tips";

export type MarketingContentStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export interface MarketingContentDraft {
  id: string;
  propertyId: string;
  channel: MarketingChannel;
  contentType: MarketingContentType;
  status: MarketingContentStatus;
  title: string;
  body: string;
  evidenceKeys: string[];
  promptKey: string;
  promptVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingAsset {
  id: string;
  propertyId: string;
  assetType: AssetType;
  title: string;
  theme: AssetTheme;
  format: AssetFormat;
  status: AssetStatus;
  version: number;
  sourceKnowledgeVersion: number;
  templateVersion: string;
  storagePath: string | null;
  publicUrl: string | null;
  generatedAt: string;
  generatedBy: string | null;
  regenerationReason: string | null;
  metadata: Record<string, unknown>;
}

export interface AssetGenerationJob {
  id: string;
  propertyId: string;
  assetTypes: AssetType[];
  theme: AssetTheme;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface CopywritingOutput {
  professionalDescription: string;
  luxuryDescription: string;
  mlsSummary: string;
  socialSummary: string;
  propertyHighlights: string[];
  neighborhoodSummary: string;
  roomIntroductions: Array<{ room: string; introduction: string }>;
}

export interface AssetQualityReview {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export const ASSET_DEPENDENCIES: Record<string, AssetType[]> = {
  roof: ["brochure", "feature_sheet", "summary_pdf"],
  hvac: ["brochure", "feature_sheet"],
  kitchen: ["brochure", "room_highlight"],
  listing_price: ["brochure", "feature_sheet", "summary_pdf"],
};
