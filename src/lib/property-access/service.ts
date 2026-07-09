import { env } from "@/lib/env";
import { getPropertyById, getPropertyBySlug } from "@/lib/repositories/property-repository";
import {
  createVisitorSession,
  getVisitorSession,
} from "@/lib/repositories/session-repository";
import { createClient } from "@/lib/supabase/server";

import {
  buildAccessUrl,
  detectDeviceType,
  detectPreferredLanguage,
  generateAccessToken,
  isTokenExpired,
} from "./token";
import type {
  AccessResolution,
  EntryMethod,
  OpenHouseConfig,
  PropertyAccessMode,
  PropertyAccessToken,
  VisitorSessionContext,
} from "./types";

const tokenStore = new Map<string, PropertyAccessToken>();
const openHouseStore = new Map<string, OpenHouseConfig>();

function resolvePropertyMode(
  status: string,
  isPreview: boolean,
): PropertyAccessMode {
  if (isPreview) return "preview";
  switch (status) {
    case "published":
    case "active":
      return "published";
    case "draft":
    case "pending":
      return "draft";
    case "archived":
    case "sold":
      return "archived";
    default:
      return "unavailable";
  }
}

/**
 * Property Access Engine (PRD-012) — token resolution, sessions, entry flow.
 */
export class PropertyAccessService {
  async getOrCreatePermanentToken(propertyId: string): Promise<PropertyAccessToken> {
    const existing = [...tokenStore.values()].find(
      (t) => t.propertyId === propertyId && t.tokenType === "permanent" && t.isActive,
    );
    if (existing) return existing;

    const token: PropertyAccessToken = {
      id: crypto.randomUUID(),
      propertyId,
      token: generateAccessToken(),
      tokenType: "permanent",
      expiresAt: null,
      passwordHash: null,
      isActive: true,
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tokenStore.set(token.token, token);
    return token;
  }

  async createTemporaryToken(
    propertyId: string,
    expiresAt: string,
    tokenType: PropertyAccessToken["tokenType"] = "temporary",
  ): Promise<PropertyAccessToken> {
    const token: PropertyAccessToken = {
      id: crypto.randomUUID(),
      propertyId,
      token: generateAccessToken(),
      tokenType,
      expiresAt,
      passwordHash: null,
      isActive: true,
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tokenStore.set(token.token, token);
    return token;
  }

  async resolveToken(publicToken: string, preview = false): Promise<AccessResolution | null> {
    const stored = tokenStore.get(publicToken);
    const client = await createClient();

    let propertyId: string | null = stored?.propertyId ?? null;

    if (!propertyId) {
      const bySlug = await getPropertyBySlug(client, publicToken);
      if (bySlug) {
        propertyId = bySlug.id;
      }
    }

    if (!propertyId && stored) {
      propertyId = stored.propertyId;
    }

    if (!propertyId) return null;

    const property = await getPropertyById(client, propertyId);
    if (!property || property.deleted_at) return null;

    if (stored) {
      if (!stored.isActive || isTokenExpired(stored.expiresAt)) {
        return {
          propertyId,
          slug: property.slug,
          mode: "expired",
          tokenType: stored.tokenType,
          isPreview: false,
          excludeAnalytics: true,
          welcomeOverride: null,
          accessUrl: buildAccessUrl(stored.token, env.appUrl),
        };
      }
      stored.scanCount += 1;
      tokenStore.set(publicToken, stored);
    }

    const isPreview = preview || stored?.tokenType === "preview";
    const mode = resolvePropertyMode(property.status, isPreview);

    if (!isPreview && mode !== "published") {
      return {
        propertyId,
        slug: property.slug,
        mode,
        tokenType: stored?.tokenType ?? "permanent",
        isPreview: false,
        excludeAnalytics: true,
        welcomeOverride: null,
        accessUrl: buildAccessUrl(publicToken, env.appUrl),
      };
    }

    const openHouse = openHouseStore.get(propertyId);
    const welcomeOverride =
      openHouse?.enabled &&
      new Date() >= new Date(openHouse.startAt) &&
      new Date() <= new Date(openHouse.endAt)
        ? openHouse.welcomeMessage ?? "Welcome to today's Open House."
        : null;

    return {
      propertyId,
      slug: property.slug,
      mode,
      tokenType: stored?.tokenType ?? "permanent",
      isPreview,
      excludeAnalytics: isPreview,
      welcomeOverride,
      accessUrl: buildAccessUrl(publicToken, env.appUrl),
    };
  }

  async createSession(input: {
    propertyId: string;
    sessionToken?: string;
    entryMethod?: EntryMethod;
    userAgent?: string;
    acceptLanguage?: string | null;
    currentPoiId?: string | null;
    isPreview?: boolean;
  }): Promise<VisitorSessionContext> {
    const client = await createClient();
    const sessionToken = input.sessionToken ?? crypto.randomUUID();
    const userAgent = input.userAgent ?? "unknown";

    const existing = input.sessionToken
      ? await getVisitorSession(client, sessionToken)
      : null;

    if (existing) {
      return {
        sessionId: existing.id,
        sessionToken: existing.session_token,
        propertyId: existing.property_id,
        anonymousId: existing.session_token.slice(0, 8),
        preferredLanguage: existing.language ?? "en",
        deviceType: existing.device_type ?? detectDeviceType(userAgent),
        entryMethod: input.entryMethod ?? "direct_url",
        isPreview: input.isPreview ?? false,
      };
    }

    const session = await createVisitorSession(client, {
      propertyId: input.propertyId,
      sessionToken,
      currentPoiId: input.currentPoiId,
      deviceType: detectDeviceType(userAgent),
      browser: userAgent.slice(0, 120),
      operatingSystem: undefined,
      language: detectPreferredLanguage(input.acceptLanguage ?? null),
    });

    return {
      sessionId: session.id,
      sessionToken: session.session_token,
      propertyId: session.property_id,
      anonymousId: session.session_token.slice(0, 8),
      preferredLanguage: session.language ?? "en",
      deviceType: session.device_type ?? detectDeviceType(userAgent),
      entryMethod: input.entryMethod ?? "direct_url",
      isPreview: input.isPreview ?? false,
    };
  }

  configureOpenHouse(config: OpenHouseConfig): OpenHouseConfig {
    openHouseStore.set(config.propertyId, config);
    return config;
  }

  getAccessUrlForProperty(propertyId: string, slug: string): string {
    const stored = [...tokenStore.values()].find(
      (t) => t.propertyId === propertyId && t.isActive,
    );
    if (stored) {
      return buildAccessUrl(stored.token, env.appUrl);
    }
    return `${env.appUrl.replace(/\/$/, "")}/tour/${slug}`;
  }
}

export async function createPropertyAccessService(): Promise<PropertyAccessService> {
  return new PropertyAccessService();
}

export { buildAccessUrl, generateAccessToken } from "./token";
