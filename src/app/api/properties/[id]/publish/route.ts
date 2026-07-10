import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { env } from "@/lib/env";
import { createPublishingService } from "@/lib/property-dna";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const client = await createClient();

    const { data: property } = await client
      .from("properties")
      .select("id, owner_id")
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ data: null, error: "Property not found" }, { status: 404 });
    }

    const publishing = createPublishingService(client, env.appUrl);
    const status = await publishing.publish(propertyId);

    return NextResponse.json({ data: status, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 422 },
    );
  }
}
