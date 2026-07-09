import { NextResponse } from "next/server";

import { buildBuyerIntelligenceReport } from "@/lib/buyer-intelligence";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: null, error: "Database not configured" }, { status: 503 });
    }

    const client = await createClient();
    const report = await buildBuyerIntelligenceReport(client, sessionId);

    if (!report) {
      return NextResponse.json({ data: null, error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ data: report, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
