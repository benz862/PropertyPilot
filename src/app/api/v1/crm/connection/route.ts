import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface ConnectionBody {
  locationId?: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = (await request.json()) as ConnectionBody;
    const locationId = body.locationId?.trim();

    if (!locationId || locationId.length > 100) {
      return apiError("Enter the GoHighLevel Location ID for this agent's sub-account.", 400);
    }

    const client = await createClient();
    const { error: profileError } = await client
      .from("profiles")
      .update({ ghl_location_id: locationId })
      .eq("id", user.id);
    if (profileError) throw new Error(profileError.message);

    // There can only be one active destination per PropertyPilot agent.
    const { error: disableError } = await client
      .from("crm_connections")
      .update({ status: "disabled" })
      .eq("provider", "gohighlevel")
      .eq("profile_id", user.id)
      .eq("status", "active");
    if (disableError) throw new Error(disableError.message);

    const { error: connectionError } = await client
      .from("crm_connections")
      .upsert(
        {
          provider: "gohighlevel",
          auth_type: "private_token",
          profile_id: user.id,
          location_id: locationId,
          status: "active",
          metadata: { configured_from: "agent_workspace" },
          created_by: user.id,
          updated_by: user.id,
        },
        { onConflict: "provider,location_id,profile_id" },
      );
    if (connectionError) throw new Error(connectionError.message);

    return apiSuccess({ connected: true, locationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM connection failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
