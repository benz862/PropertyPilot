import { NextResponse } from "next/server";

import { createPropertyBuilderService } from "@/lib/property-builder";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const builder = await createPropertyBuilderService();
    const result = await builder.getPropertyHealth(id);

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
