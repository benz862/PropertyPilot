import { NextResponse } from "next/server";

import { searchWorkspace } from "@/lib/realtor-workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const data = await searchWorkspace(query);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ data: [], error: message }, { status: 500 });
  }
}
