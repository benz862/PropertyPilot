import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  createOfflineConciergeResponse,
  processVoiceConcierge,
} from "@/lib/ai/voice/concierge";

export const runtime = "nodejs";

function getOpenAIClient(): OpenAI | null {
  if (!env.openai.apiKey) return null;
  return new OpenAI({ apiKey: env.openai.apiKey });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const propertyId = String(formData.get("propertyId") ?? "");
    const visitorSessionId = String(formData.get("visitorSessionId") ?? "");
    const currentPoiId = (formData.get("currentPoiId") as string | null) || null;
    const transcriptOnly = String(formData.get("transcriptOnly") ?? "") === "true";
    const audio = formData.get("audio");

    if (!propertyId || !visitorSessionId) {
      return NextResponse.json(
        { error: "propertyId and visitorSessionId are required" },
        { status: 400 },
      );
    }

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        {
          data: {
            ...createOfflineConciergeResponse("the listing agent"),
            transcript: "",
            audioBase64: null,
            audioMimeType: null,
          },
          error: null,
        },
        { status: 200 },
      );
    }

    let message = String(formData.get("message") ?? "").trim();
    if (!message) {
      if (!(audio instanceof File)) {
        return NextResponse.json(
          { error: "audio file is required when message is not provided" },
          { status: 400 },
        );
      }

      const transcription = await client.audio.transcriptions.create({
        file: audio,
        model: "gpt-4o-mini-transcribe",
      });
      message = transcription.text?.trim() ?? "";
    }

    if (!message) {
      return NextResponse.json({ error: "Could not transcribe audio" }, { status: 400 });
    }

    const supabase = await createClient();
    const response = await processVoiceConcierge(supabase, {
      propertyId,
      visitorSessionId,
      conversationId: String(formData.get("conversationId") ?? ""),
      message,
      currentPoiId,
      interrupted: String(formData.get("interrupted") ?? "") === "true",
    });

    if (transcriptOnly) {
      return NextResponse.json({
        data: {
          ...response,
          transcript: message,
          audioBase64: null,
          audioMimeType: null,
        },
        error: null,
      });
    }

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: response.voiceConfig.voiceId || "alloy",
      input: response.spokenAnswer,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    return NextResponse.json({
      data: {
        ...response,
        transcript: message,
        audioBase64: audioBuffer.toString("base64"),
        audioMimeType: "audio/mpeg",
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice audio processing unavailable";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
