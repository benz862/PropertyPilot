import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/api/auth";
import { env } from "@/lib/env";
import {
  createAssetGenerationService,
  createPropertyDNAService,
  type GeneratedAssetType,
} from "@/lib/property-dna";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: null, error: "Database not configured" }, { status: 503 });
    }

    await requireAuthenticatedUser();
    const { id } = await params;
    const client = await createClient();
    const assets = await createAssetGenerationService(client).list(id);

    return NextResponse.json({ data: assets, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assets";
    return NextResponse.json({ data: null, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: null, error: "Database not configured" }, { status: 503 });
    }

    await requireAuthenticatedUser();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { assetType?: GeneratedAssetType };

    const client = await createClient();
    const dna = await createPropertyDNAService(client).getPropertyDNA(id);
    if (!dna) {
      return NextResponse.json({ data: null, error: "Property not found" }, { status: 404 });
    }

    const service = createAssetGenerationService(client, env.appUrl);
    const data = body.assetType
      ? [await service.regenerate(dna, body.assetType)].filter(Boolean)
      : await service.generateAll(dna);

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate assets";
    return NextResponse.json({ data: null, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
