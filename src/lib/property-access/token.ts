const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessToken(length = 7): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("");
}

export function buildAccessUrl(token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/p/${token}`;
}

export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function detectDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

export function detectPreferredLanguage(
  acceptLanguage: string | null,
  supported: string[] = ["en", "es", "fr"],
  fallback = "en",
): string {
  if (!acceptLanguage) return fallback;
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
  if (preferred && supported.includes(preferred)) {
    return preferred;
  }
  return fallback;
}

export function buildSmartEntryProfile(input: {
  userAgent: string;
  prefersReducedMotion?: boolean;
  prefersDarkMode?: boolean;
  connectionType?: string;
}): import("./types").SmartEntryProfile {
  const deviceType = detectDeviceType(input.userAgent);
  const isMobile = deviceType === "mobile";
  return {
    deviceType,
    orientation: isMobile ? "portrait" : "landscape",
    prefersReducedMotion: input.prefersReducedMotion ?? false,
    prefersDarkMode: input.prefersDarkMode ?? false,
    lowBandwidth: input.connectionType === "slow-2g" || input.connectionType === "2g",
  };
}
