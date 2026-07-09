import { NextResponse } from "next/server";

import {
  createOfflineConciergeResponse,
  processVoiceConcierge,
} from "@/lib/ai/voice/concierge";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BuyerProfileMemory } from "@/lib/ai/conversation/buyer-profile";
import type { ConversationMemoryState } from "@/lib/ai/types";

export const runtime = "nodejs";

interface VoiceRequestBody {
  propertyId: string;
  visitorSessionId: string;
  conversationId?: string;
  message: string;
  currentPoiId?: string | null;
  memory?: ConversationMemoryState;
  buyerProfile?: BuyerProfileMemory;
  interrupted?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VoiceRequestBody;

    if (!body.propertyId || !body.visitorSessionId) {
      return NextResponse.json(
        { error: "propertyId and visitorSessionId are required" },
        { status: 400 },
      );
    }

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({
        data: createOfflineConciergeResponse("the listing agent"),
        error: null,
      });
    }

    const supabase = await createClient();

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "message is required for voice interaction" },
        { status: 400 },
      );
    }

    const response = await processVoiceConcierge(supabase, {
      propertyId: body.propertyId,
      visitorSessionId: body.visitorSessionId,
      conversationId: body.conversationId ?? "",
      message: body.message.trim(),
      currentPoiId: body.currentPoiId,
      memory: body.memory,
      buyerProfile: body.buyerProfile,
      interrupted: body.interrupted,
    });

    return NextResponse.json({ data: response, error: null });
  } catch (error) {
    const offline = createOfflineConciergeResponse("the listing agent");
    return NextResponse.json({
      data: {
        ...offline,
        answer: offline.spokenAnswer,
        confidence: "low" as const,
        intent: "general_conversation",
        buyerInterests: [],
        interestSummary: "",
        objections: [],
        escalated: false,
        unanswered: true,
        speakingSeconds: 0,
        maxSpeakingSeconds: 15,
        truncated: false,
        offerContinuation: false,
        voiceConfig: { voiceId: "alloy", speakingSpeed: 1, greeting: "" },
        durationMs: 0,
      },
      error: error instanceof Error ? error.message : "Voice processing unavailable",
    });
  }
}
