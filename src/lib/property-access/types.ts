export type AccessTokenType =
  | "permanent"
  | "temporary"
  | "open_house"
  | "private_showing"
  | "builder_demo"
  | "preview";

export type PropertyAccessMode =
  | "published"
  | "preview"
  | "draft"
  | "archived"
  | "private"
  | "expired"
  | "unavailable";

export type EntryMethod = "qr" | "direct_url" | "shared_link" | "preview";

export interface PropertyAccessToken {
  id: string;
  propertyId: string;
  token: string;
  tokenType: AccessTokenType;
  expiresAt: string | null;
  passwordHash: string | null;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpenHouseConfig {
  propertyId: string;
  startAt: string;
  endAt: string;
  welcomeMessage: string | null;
  enabled: boolean;
}

export interface AccessResolution {
  propertyId: string;
  slug: string;
  mode: PropertyAccessMode;
  tokenType: AccessTokenType;
  isPreview: boolean;
  excludeAnalytics: boolean;
  welcomeOverride: string | null;
  accessUrl: string;
}

export interface VisitorSessionContext {
  sessionId: string;
  sessionToken: string;
  propertyId: string;
  anonymousId: string;
  preferredLanguage: string;
  deviceType: string;
  entryMethod: EntryMethod;
  isPreview: boolean;
}

export interface AccessAnalyticsEvent {
  propertyId: string;
  sessionId: string | null;
  eventType: "qr_scan" | "entry" | "bounce" | "session_recovery";
  entryMethod: EntryMethod;
  language: string;
  deviceType: string;
  metadata: Record<string, unknown>;
}

export interface SmartEntryProfile {
  deviceType: "mobile" | "tablet" | "desktop";
  orientation: "portrait" | "landscape";
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  lowBandwidth: boolean;
}
