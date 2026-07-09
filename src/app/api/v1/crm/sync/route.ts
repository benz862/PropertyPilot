import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { GhlService, type GhlLeadPayload } from "@/services/crm/ghl.service";

export const runtime = "nodejs";

type CrmSyncBody =
  | ({ leadId: string } & Partial<GhlLeadPayload>)
  | (GhlLeadPayload & { leadId?: string });

interface LeadCrmSyncRow {
  id: string;
  property_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  requested_pdf: boolean;
  requested_showing: boolean;
  notes: string | null;
  buyer_intent_score: number | null;
  buyer_interests: unknown;
  buyer_concerns: unknown;
  ai_conversation_summary: string | null;
}

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser();

    const body = (await request.json()) as CrmSyncBody;
    const supabase = await createClient();
    const ghl = new GhlService(supabase);
    const lead = body.leadId
      ? await loadLeadPayload(supabase, body.leadId)
      : normalizeLeadPayload(body);

    if (!lead.email && !lead.phone) {
      return apiError("Lead must include an email or phone before syncing to GHL", 400);
    }

    const result = await ghl.syncLeadToGHL(lead);
    return apiSuccess(result, result.success ? 200 : 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM sync failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

async function loadLeadPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
): Promise<GhlLeadPayload> {
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, property_id, name, email, phone, requested_pdf, requested_showing, notes, buyer_intent_score, buyer_interests, buyer_concerns, ai_conversation_summary",
    )
    .eq("id", leadId)
    .single();

  if (error || !lead) {
    throw new Error(error?.message ?? "Lead not found");
  }
  const leadRow = lead as unknown as LeadCrmSyncRow;

  const { data: property } = await supabase
    .from("properties")
    .select("street, city, province_state, postal_code")
    .eq("id", leadRow.property_id)
    .maybeSingle();

  const { firstName, lastName } = splitName(leadRow.name);

  return {
    leadId: leadRow.id,
    propertyId: leadRow.property_id,
    propertyAddress: property
      ? [property.street, property.city, property.province_state, property.postal_code]
          .filter(Boolean)
          .join(", ")
      : leadRow.property_id,
    firstName,
    lastName,
    email: leadRow.email,
    phone: leadRow.phone,
    buyerIntentScore:
      typeof leadRow.buyer_intent_score === "number" ? leadRow.buyer_intent_score : null,
    buyerInterests: toStringArray(leadRow.buyer_interests),
    buyerConcerns: toStringArray(leadRow.buyer_concerns),
    brochureRequested: Boolean(leadRow.requested_pdf),
    showingRequested: Boolean(leadRow.requested_showing),
    aiConversationSummary: leadRow.ai_conversation_summary ?? leadRow.notes,
  };
}

function normalizeLeadPayload(input: Partial<GhlLeadPayload>): GhlLeadPayload {
  if (!input.propertyId || !input.propertyAddress) {
    throw new Error("propertyId and propertyAddress are required");
  }

  return {
    leadId: input.leadId,
    propertyId: input.propertyId,
    propertyAddress: input.propertyAddress,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    buyerIntentScore: input.buyerIntentScore ?? null,
    buyerInterests: input.buyerInterests ?? [],
    buyerConcerns: input.buyerConcerns ?? [],
    brochureRequested: Boolean(input.brochureRequested),
    showingRequested: Boolean(input.showingRequested),
    aiConversationSummary: input.aiConversationSummary ?? null,
  };
}

function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  if (!name) return { firstName: null, lastName: null };
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
