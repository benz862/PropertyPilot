import { NextResponse } from "next/server";

import { processAiChat } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface ChatRequestBody {
  propertyId: string;
  visitorSessionId: string;
  conversationId?: string;
  message: string;
  currentPoiId?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    if (!body.propertyId || !body.visitorSessionId || !body.message?.trim()) {
      return NextResponse.json(
        { error: "propertyId, visitorSessionId, and message are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const response = await processAiChat(supabase, {
      propertyId: body.propertyId,
      visitorSessionId: body.visitorSessionId,
      conversationId: body.conversationId ?? "",
      message: body.message.trim(),
      currentPoiId: body.currentPoiId,
    });

    return NextResponse.json({ data: response, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI processing failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
