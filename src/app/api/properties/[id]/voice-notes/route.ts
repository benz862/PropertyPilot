import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createPropertyTwinService } from "@/lib/property-twin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface VoiceNoteRequest {
  transcript?: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const body = (await request.json()) as VoiceNoteRequest;
    const transcript = body.transcript?.trim();

    if (!transcript) {
      return NextResponse.json(
        { data: null, error: "Voice note transcript is required." },
        { status: 400 },
      );
    }

    const twin = await createPropertyTwinService();
    const result = await twin.processVoiceNote(propertyId, transcript);

    return NextResponse.json({ data: result, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice note capture failed.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
