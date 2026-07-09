import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { GhlService, type GhlLeadPayload } from "@/services/crm/ghl.service";

export const runtime = "nodejs";

interface LeadRequestBody {
  propertyId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
  timeline?: string;
  intent?: string;
  workingWithRealtor?: boolean;
  notes?: string;
  buyerIntentScore?: number;
  buyerInterests?: string[];
  buyerConcerns?: string[];
  aiConversationSummary?: string;
  brochureRequested?: boolean;
  showingRequested?: boolean;
  visitorSessionId?: string;
  consent: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequestBody;

    if (!body.propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    if (!body.consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    if (!env.supabase.url || !env.supabase.anonKey) {
      return NextResponse.json({ data: { saved: false }, error: null });
    }

    const supabase = await createClient();
    const name = [body.firstName, body.lastName].filter(Boolean).join(" ") || null;
    const brochureRequested = body.brochureRequested ?? true;
    const showingRequested = body.showingRequested ?? body.intent === "buying";
    const buyerInterests = normalizeList(body.buyerInterests, [
      body.intent ? `Intent: ${body.intent}` : null,
      body.timeline ? `Timeline: ${body.timeline}` : null,
      body.preferredContact ? `Preferred contact: ${body.preferredContact}` : null,
    ]);
    const buyerConcerns = normalizeList(body.buyerConcerns, [body.notes ?? null]);
    const aiConversationSummary = body.aiConversationSummary ?? body.notes ?? null;
    const buyerIntentScore =
      typeof body.buyerIntentScore === "number"
        ? body.buyerIntentScore
        : scoreBuyerIntent({
            intent: body.intent,
            timeline: body.timeline,
            showingRequested,
            brochureRequested,
          });
    const noteParts = [
      body.timeline ? `Timeline: ${body.timeline}` : null,
      body.intent ? `Intent: ${body.intent}` : null,
      body.preferredContact ? `Preferred contact: ${body.preferredContact}` : null,
      body.workingWithRealtor ? "Already working with a realtor" : null,
      body.notes ?? null,
    ].filter(Boolean);

    const { data, error } = await supabase
      .from("leads")
      .insert({
        property_id: body.propertyId,
        visitor_session_id: body.visitorSessionId ?? null,
        name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        consent_given: true,
        requested_pdf: brochureRequested,
        requested_showing: showingRequested,
        notes: noteParts.length > 0 ? noteParts.join("\n") : null,
        buyer_intent_score: buyerIntentScore,
        buyer_interests: buyerInterests,
        buyer_concerns: buyerConcerns,
        ai_conversation_summary: aiConversationSummary,
        crm_status: "new",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    const { data: property } = await supabase
      .from("properties")
      .select("street, city, owner_id")
      .eq("id", body.propertyId)
      .maybeSingle();

    let crmSync: { attempted: boolean; success: boolean; error: string | null } = {
      attempted: false,
      success: false,
      error: null,
    };

    if (property) {
      crmSync = await trySyncLeadToGhl(supabase, {
        leadId: data.id,
        propertyId: body.propertyId,
        propertyAddress: `${property.street}, ${property.city}`,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        buyerIntentScore,
        buyerInterests,
        buyerConcerns,
        brochureRequested,
        showingRequested,
        aiConversationSummary,
      });
    }

    return NextResponse.json(
      { data: { id: data.id, saved: true, crmSync }, error: null },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lead capture failed";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

async function trySyncLeadToGhl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lead: GhlLeadPayload,
) {
  try {
    const ghl = new GhlService(supabase);
    const result = await ghl.syncLeadToGHL(lead);
    return {
      attempted: true,
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      attempted: true,
      success: false,
      error: error instanceof Error ? error.message : "GHL sync failed",
    };
  }
}

function normalizeList(value: string[] | undefined, fallback: Array<string | null>): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }

  return fallback
    .filter((item): item is string => Boolean(item?.trim()))
    .map((item) => item.trim());
}

function scoreBuyerIntent(input: {
  intent?: string;
  timeline?: string;
  showingRequested: boolean;
  brochureRequested: boolean;
}) {
  let score = input.brochureRequested ? 45 : 25;
  if (input.showingRequested) score += 30;
  if (input.intent === "buying" || input.intent === "investing") score += 15;
  if (input.timeline === "immediate") score += 10;
  if (input.timeline === "1-3months") score += 5;
  return Math.min(score, 100);
}
