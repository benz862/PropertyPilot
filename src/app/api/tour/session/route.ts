import { NextResponse } from "next/server";

import {
  createVisitorSession,
  getVisitorSession,
} from "@/lib/repositories/session-repository";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface SessionRequestBody {
  propertyId: string;
  sessionToken?: string;
  currentPoiId?: string | null;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  language?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SessionRequestBody;

    if (!body.propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const sessionToken = body.sessionToken ?? crypto.randomUUID();

    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("id", body.propertyId)
      .in("status", ["active", "published"])
      .is("deleted_at", null)
      .maybeSingle();

    if (!property) {
      return NextResponse.json({ data: null, error: "Property not found" }, { status: 404 });
    }

    const existing = body.sessionToken
      ? await getVisitorSession(supabase, sessionToken)
      : null;

    if (existing && existing.property_id === property.id) {
      return NextResponse.json({ data: existing, error: null });
    }

    const session = await createVisitorSession(supabase, {
      propertyId: property.id,
      sessionToken,
      currentPoiId: body.currentPoiId,
      deviceType: body.deviceType,
      browser: body.browser,
      operatingSystem: body.operatingSystem,
      language: body.language,
    });

    return NextResponse.json({ data: session, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session creation failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
