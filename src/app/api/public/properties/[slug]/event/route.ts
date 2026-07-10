import { NextResponse } from "next/server";

import { createBuyerActivityService } from "@/lib/property-dna/buyer-activity";
import type { BuyerEventType } from "@/lib/property-dna/buyer-activity";
import { getPublicPropertyBySlugOrId } from "@/lib/public-room-agent/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface EventBody {
  type?: BuyerEventType;
  room?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

const ALLOWED: Set<BuyerEventType> = new Set([
  "qr_scan",
  "page_open",
  "room_selected",
  "session_started",
  "session_ended",
  "asset_downloaded",
]);

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as EventBody;
    if (!body.type || !ALLOWED.has(body.type)) {
      return NextResponse.json({ data: null, error: "Invalid event type" }, { status: 400 });
    }

    const client = await createClient();
    const property = await getPublicPropertyBySlugOrId(client, slug);
    if (!property) {
      return NextResponse.json({ data: null, error: "Property not found" }, { status: 404 });
    }

    await createBuyerActivityService(client).recordEvent({
      propertyId: property.id,
      type: body.type,
      room: body.room ?? null,
      visitorSessionId: body.sessionId ?? null,
      metadata: body.metadata,
    });

    return NextResponse.json({ data: { recorded: true }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
