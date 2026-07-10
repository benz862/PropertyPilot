import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { env } from "@/lib/env";
import { createPropertyDNAService } from "@/lib/property-dna";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: null, error: "Database not configured" }, { status: 503 });
    }

    await requireAuthenticatedUser();
    const { id } = await params;
    const client = await createClient();
    const result = await createPropertyDNAService(client).rebuildPropertyDNA(id);

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rebuild Property DNA";
    return NextResponse.json({ data: null, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
