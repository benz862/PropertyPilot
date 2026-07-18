import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createPropertyTwinService } from "@/lib/property-twin";
import type { UpdatePropertyProfileInput } from "@/lib/property-twin/types";

interface CreatePropertyRequest {
  street?: string;
  city?: string;
  provinceState?: string;
  postalCode?: string;
  propertyType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  finishedSquareFeet?: number | null;
  listingPrice?: number | null;
  publicRemarks?: string | null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = (await request.json()) as CreatePropertyRequest;

    const street = body.street?.trim();
    const city = body.city?.trim();
    const provinceState = body.provinceState?.trim();
    const postalCode = body.postalCode?.trim();

    if (!street || !city || !provinceState || !postalCode) {
      return NextResponse.json(
        { data: null, error: "Street, city, state, and postal code are required." },
        { status: 400 },
      );
    }

    const twin = await createPropertyTwinService();
    const property = await twin.createProperty({
      ownerId: user.id,
      street,
      city,
      provinceState,
      postalCode,
    });

    if (!property) {
      return NextResponse.json(
        { data: null, error: "Failed to create property." },
        { status: 500 },
      );
    }

    const update: UpdatePropertyProfileInput = {
      propertyType: body.propertyType || undefined,
      bedrooms: body.bedrooms ?? undefined,
      bathrooms: body.bathrooms ?? undefined,
      finishedSquareFeet: body.finishedSquareFeet ?? undefined,
      listingPrice: body.listingPrice ?? undefined,
      publicRemarks: body.publicRemarks || undefined,
    };

    const saved =
      Object.values(update).some((value) => value !== undefined)
        ? await twin.updatePropertyProfile(property.id, update, user.id)
        : property;

    return NextResponse.json({ data: saved, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create property.";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
