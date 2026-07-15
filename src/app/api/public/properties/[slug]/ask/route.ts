import { NextResponse } from "next/server";

import { askRoomQuestion, attachLeadToQuestion } from "@/lib/public-room-agent/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface AskRequestBody {
  roomId?: string | null;
  selectedRoom?: string;
  question?: string;
  inputType?: "voice" | "text";
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  questionId?: string | null;
  requestedFeatureSheet?: boolean;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as AskRequestBody;
    const selectedRoom = body.selectedRoom?.trim() || "Whole Property";
    const question = body.question?.trim();
    const client = await createClient();

    if (body.questionId && body.buyerName?.trim() && body.buyerEmail?.trim()) {
      const result = await attachLeadToQuestion(client, slug, {
        questionId: body.questionId,
        buyerName: body.buyerName.trim(),
        buyerEmail: body.buyerEmail.trim(),
        buyerPhone: body.buyerPhone?.trim() || null,
        requestedFeatureSheet: body.requestedFeatureSheet ?? false,
      });
      return NextResponse.json({ data: result, error: null });
    }

    if (!question) {
      return NextResponse.json({ data: null, error: "question is required" }, { status: 400 });
    }

    const result = await askRoomQuestion(client, slug, {
      roomId: body.roomId ?? null,
      selectedRoom,
      question,
      inputType: body.inputType ?? "text",
      buyerName: body.buyerName ?? null,
      buyerEmail: body.buyerEmail ?? null,
      buyerPhone: body.buyerPhone ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question failed";
    return NextResponse.json(
      { data: null, error: message },
      { status: message === "Property not found" ? 404 : 500 },
    );
  }
}
