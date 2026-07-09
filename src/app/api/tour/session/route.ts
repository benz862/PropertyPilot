import { NextResponse } from "next/server";

import {
  createVisitorSession,
  getVisitorSession,
} from "@/lib/repositories/session-repository";
import { createClient } from "@/lib/supabase/server";

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

    const supabase = await createClient();
    const sessionToken = body.sessionToken ?? crypto.randomUUID();

    const existing = body.sessionToken
      ? await getVisitorSession(supabase, sessionToken)
      : null;

    if (existing) {
      return NextResponse.json({ data: existing, error: null });
    }

    const session = await createVisitorSession(supabase, {
      propertyId: body.propertyId,
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
