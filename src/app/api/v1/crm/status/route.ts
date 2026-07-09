import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { GhlService } from "@/services/crm/ghl.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const supabase = await createClient();
    const ghl = new GhlService(supabase);

    return apiSuccess({
      provider: "gohighlevel",
      authType: "private_token",
      connected: ghl.isConfigured(),
      locationConfigured: Boolean(env.ghl.locationId),
      tokenConfigured: Boolean(env.ghl.privateIntegrationToken),
      oauthEnabled: false,
      marketplaceAppEnabled: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM status failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST() {
  return apiError("OAuth CRM connection is not implemented. Configure GHL private token env vars.", 400);
}
