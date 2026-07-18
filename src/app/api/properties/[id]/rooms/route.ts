import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RoomRequestBody {
  name?: string;
  description?: string | null;
  features?: string[];
  updates?: string[];
  includedItems?: string[];
  talkingPoints?: string[];
  cautions?: string[];
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const body = (await request.json()) as RoomRequestBody;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ data: null, error: "Room name is required." }, { status: 400 });
    }

    const client = await createClient();
    const { data, error } = await client
      .from("property_rooms")
      .upsert(
        {
          property_id: propertyId,
          name,
          description: body.description?.trim() || null,
          features: normalizeList(body.features),
          updates: normalizeList(body.updates),
          included_items: normalizeList(body.includedItems),
          talking_points: normalizeList(body.talkingPoints),
          cautions: normalizeList(body.cautions),
        },
        { onConflict: "property_id,name" },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to save room knowledge.");
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save room knowledge.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}

function normalizeList(value: string[] | undefined): string[] {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}
