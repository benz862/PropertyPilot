import { colors } from "@/styles";

import type { AssetTheme, AssetType } from "./types";

export interface AssetTemplate {
  assetType: AssetType;
  theme: AssetTheme;
  version: string;
  sections: string[];
}

const BASE_SECTIONS: Record<AssetType, string[]> = {
  brochure: [
    "hero",
    "address",
    "agent",
    "summary",
    "features",
    "photos",
    "systems",
    "timeline",
    "qr",
    "contact",
  ],
  feature_sheet: ["address", "improvements", "systems", "appliances", "lot", "schools", "qr"],
  welcome_sign: ["photo", "address", "agent", "qr", "welcome"],
  info_sheet: ["address", "summary", "features", "agent"],
  open_house_sign: ["photo", "address", "open_house_message", "qr"],
  qr_sign: ["qr", "address", "instructions"],
  summary_pdf: ["summary", "features", "agent", "qr"],
  luxury_brochure: ["hero", "luxury_description", "features", "timeline", "agent", "qr"],
  room_highlight: ["room_name", "photo", "fact", "qr_shortcut"],
};

export function getTemplate(assetType: AssetType, theme: AssetTheme): AssetTemplate {
  return {
    assetType,
    theme,
    version: "1.0.0",
    sections: BASE_SECTIONS[assetType],
  };
}

export const DEFAULT_V1_ASSETS: AssetType[] = [
  "brochure",
  "feature_sheet",
  "welcome_sign",
  "info_sheet",
  "open_house_sign",
  "qr_sign",
  "summary_pdf",
];

export const THEME_COLORS: Record<AssetTheme, { primary: string; accent: string }> = {
  modern: { primary: colors.primary, accent: colors.secondary },
  luxury: { primary: colors.neutral[900], accent: colors.secondary },
  minimal: { primary: colors.neutral[50], accent: colors.primary },
  classic: { primary: colors.neutral[700], accent: colors.secondary },
  dark: { primary: colors.neutral[900], accent: colors.secondary },
  light: { primary: colors.neutral[50], accent: colors.primary },
};
