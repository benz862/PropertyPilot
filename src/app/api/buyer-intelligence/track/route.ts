import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/lib/repositories/session-repository";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventType } from "@/types/database";

export const runtime = "nodejs";

interface TrackRequestBody {
  propertyId: string;
  visitorSessionId: string;
  eventType: AnalyticsEventType;
  poiId?: string | null;
  eventData?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackRequestBody;

    if (!body.propertyId || !body.visitorSessionId || !body.eventType) {
      return NextResponse.json(
        { error: "propertyId, visitorSessionId, and eventType are required" },
        { status: 400 },
      );
    }

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: { tracked: false }, error: null });
    }

    const client = await createClient();
    await recordAnalyticsEvent(client, {
      propertyId: body.propertyId,
      visitorSessionId: body.visitorSessionId,
      poiId: body.poiId ?? undefined,
      eventType: body.eventType,
      eventData: body.eventData,
    });

    return NextResponse.json({ data: { tracked: true }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
