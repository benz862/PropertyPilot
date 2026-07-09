import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createPropertyTwinService } from "@/lib/property-twin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { id: propertyId } = await params;
    const twin = await createPropertyTwinService();
    const property = await twin.publishProperty(propertyId, user.id);

    return NextResponse.json({ data: property, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 422 },
    );
  }
}
