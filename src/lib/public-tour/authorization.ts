import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function hasPublicTourAccess(client: Client, propertyId: string): Promise<boolean> {
  const { data } = await client
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .in("status", ["active", "published"])
    .is("deleted_at", null)
    .maybeSingle();
  return Boolean(data);
}

export async function hasSessionForPublicTour(
  client: Client,
  propertyId: string,
  visitorSessionId: string,
): Promise<boolean> {
  const [{ data: session }, hasTourAccess] = await Promise.all([
    client
      .from("visitor_sessions")
      .select("id")
      .eq("id", visitorSessionId)
      .eq("property_id", propertyId)
      .maybeSingle(),
    hasPublicTourAccess(client, propertyId),
  ]);
  return Boolean(session) && hasTourAccess;
}
