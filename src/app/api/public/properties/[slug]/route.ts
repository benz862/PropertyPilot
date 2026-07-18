import { NextResponse } from "next/server";

import { getPublicPropertyBySlugOrId } from "@/lib/public-room-agent/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const client = await createClient();
    const property = await getPublicPropertyBySlugOrId(client, slug);

    if (!property) {
      return NextResponse.json({ data: null, error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ data: property, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load property";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
