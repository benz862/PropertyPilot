import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();
    const [{ data: profile }, { data: connection }] = await Promise.all([
      supabase.from("profiles").select("ghl_location_id").eq("id", user.id).maybeSingle(),
      supabase
        .from("crm_connections")
        .select("location_id, status, auth_type")
        .eq("provider", "gohighlevel")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle(),
    ]);
    const locationConfigured = Boolean(profile?.ghl_location_id && connection?.location_id);

    return apiSuccess({
      provider: "gohighlevel",
      authType: connection?.auth_type ?? "private_token",
      connected: Boolean(env.ghl.privateIntegrationToken && locationConfigured),
      locationConfigured,
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
