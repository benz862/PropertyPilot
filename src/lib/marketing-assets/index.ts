export { MarketingAssetService, createMarketingAssetService } from "./service";
export { generateCopywriting, buildAssetHtml } from "./copywriting";
export { getTemplate, DEFAULT_V1_ASSETS, THEME_COLORS } from "./templates";
export { buildBrochureVersionManifest, BROCHURE_GENERATOR_VERSION } from "./brochure";
export { generateMarketingContentDrafts } from "./content-engine";
export type {
  AssetType,
  AssetTheme,
  AssetStatus,
  MarketingAsset,
  AssetGenerationJob,
  CopywritingOutput,
  AssetQualityReview,
  MarketingChannel,
  MarketingContentDraft,
  MarketingContentStatus,
  MarketingContentType,
} from "./types";
