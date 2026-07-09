import { NextResponse } from "next/server";

import { createPropertyBuilderService } from "@/lib/property-builder";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface BuildRequestBody {
  propertyId: string;
  mls?: {
    rawText?: string;
    structured?: Record<string, unknown>;
  };
  voiceTranscripts?: string[];
}

export async function POST(request: Request) {
  try {
    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json(
        { error: "Database configuration required to build property twin" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as BuildRequestBody;

    if (!body.propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const builder = await createPropertyBuilderService();
    const result = await builder.buildPropertyTwin({
      propertyId: body.propertyId,
      mls: body.mls,
      voiceTranscripts: body.voiceTranscripts,
    });

    return NextResponse.json({ data: result, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property build failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
