import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

interface GhlLocationResponse {
  location?: {
    id?: string;
    name?: string;
  };
  id?: string;
  name?: string;
  message?: string;
  error?: string;
}

export async function GET() {
  try {
    await requireAuthenticatedUser();

    const token = env.ghl.privateIntegrationToken;
    const locationId = env.ghl.locationId;

    if (!token) {
      return apiError("Missing GHL_PRIVATE_INTEGRATION_TOKEN", 503, "GHL_TOKEN_MISSING");
    }

    if (!locationId) {
      return apiError("Missing GHL_LOCATION_ID", 503, "GHL_LOCATION_ID_MISSING");
    }

    const response = await fetch(`${GHL_BASE_URL}/locations/${locationId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
      },
      cache: "no-store",
    });

    const payload = (await readGhlResponse(response)) as GhlLocationResponse;

    if (response.status === 401 || response.status === 403) {
      return apiError(
        "GoHighLevel authentication failed. Check that GHL_PRIVATE_INTEGRATION_TOKEN is valid and has access to this location.",
        401,
        "GHL_AUTH_FAILED",
      );
    }

    if (response.status === 404) {
      return apiError(
        "GoHighLevel location was not found. Check GHL_LOCATION_ID.",
        404,
        "GHL_LOCATION_NOT_FOUND",
      );
    }

    if (!response.ok) {
      return apiError(
        `GoHighLevel API returned ${response.status}: ${extractGhlMessage(payload)}`,
        502,
        "GHL_API_ERROR",
      );
    }

    return apiSuccess({
      connected: true,
      locationId,
      apiStatus: "ok",
      statusCode: response.status,
      locationName: payload.location?.name ?? payload.name ?? null,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GHL connection test failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

async function readGhlResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function extractGhlMessage(payload: GhlLocationResponse): string {
  return payload.message ?? payload.error ?? "Unexpected response";
}
