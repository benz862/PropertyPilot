import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { env } from "@/lib/env";
import { createPropertyDNAService } from "@/lib/property-dna";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: null, error: "Database not configured" }, { status: 503 });
    }

    await requireAuthenticatedUser();
    const { id } = await params;
    const client = await createClient();
    const recommendations = await createPropertyDNAService(client).getRecommendations(id);

    return NextResponse.json({ data: recommendations, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate recommendations";
    return NextResponse.json({ data: null, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
