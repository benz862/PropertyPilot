import { NextResponse } from "next/server";

import { createPropertyTwinService } from "@/lib/property-twin";
import { mapSuggestionPriority } from "@/lib/property-builder";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: [], error: null });
    }

    const twin = await createPropertyTwinService();
    const suggestions = await twin.refreshMissingKnowledge(id);

    const data = suggestions.map((suggestion) => ({
      id: suggestion.id,
      type: suggestion.suggestionType,
      message: suggestion.message,
      priority: mapSuggestionPriority(suggestion.priority),
      priorityScore: suggestion.priority,
      status: suggestion.status,
    }));

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestions fetch failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
