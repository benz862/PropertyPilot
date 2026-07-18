import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createStagingJob } from "@/lib/staging/service";
import { isStagingStyleId, STAGING_STYLES } from "@/lib/staging/styles";
import { createClient } from "@/lib/supabase/server";
import type { Photo } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string; photoId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id: propertyId } = await params;

    return NextResponse.json({
      data: {
        styles: STAGING_STYLES.map(({ id, label }) => ({ id, label })),
        propertyId,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load staging styles.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { id: propertyId, photoId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      style?: string;
      customNote?: string;
    };

    if (!body.style || !isStagingStyleId(body.style)) {
      return NextResponse.json(
        { data: null, error: "A valid staging style is required." },
        { status: 400 },
      );
    }

    const client = await createClient();
    const { data: photo, error: photoError } = await client
      .from("photos")
      .select("*")
      .eq("id", photoId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (photoError) {
      throw new Error(photoError.message);
    }

    if (!photo) {
      return NextResponse.json({ data: null, error: "Photo not found." }, { status: 404 });
    }

    const job = await createStagingJob(client, {
      propertyId,
      sourcePhoto: photo as Photo,
      style: body.style,
      userId: user.id,
      customNote: typeof body.customNote === "string" ? body.customNote : undefined,
    });

    return NextResponse.json({ data: { job }, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start staging.";
    const missingKey = message.includes("FAL_KEY");
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : missingKey ? 503 : 500 },
    );
  }
}
