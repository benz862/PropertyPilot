import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AiSuggestionRow,
  AnalyticsEvent,
  Database,
  GeneratedPdf,
  Lead,
  Photo,
  Property,
  QrCode,
  TwinAuditLogRow,
  UnansweredQuestion,
  VoiceNoteRow,
} from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getWorkspaceOwnerId(client: Client): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

export async function getOwnerProperties(
  client: Client,
  ownerId: string,
): Promise<Property[]> {
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOwnerLeads(
  client: Client,
  ownerId: string,
  limit = 20,
): Promise<Array<Lead & { property: Pick<Property, "street" | "city" | "slug"> }>> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const { data, error } = await client
    .from("leads")
    .select("*")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((lead) => ({
    ...lead,
    property: {
      street: propertyMap.get(lead.property_id)?.street ?? "",
      city: propertyMap.get(lead.property_id)?.city ?? "",
      slug: propertyMap.get(lead.property_id)?.slug ?? "",
    },
  }));
}

export async function getAnalyticsSummaryForOwner(
  client: Client,
  ownerId: string,
): Promise<{
  events: AnalyticsEvent[];
  sessionCount: number;
}> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) {
    return { events: [], sessionCount: 0 };
  }

  const propertyIds = properties.map((p) => p.id);

  const [eventsResult, sessionsResult] = await Promise.all([
    client
      .from("analytics_events")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
      .limit(500),
    client
      .from("visitor_sessions")
      .select("id", { count: "exact", head: true })
      .in("property_id", propertyIds),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  return {
    events: eventsResult.data ?? [],
    sessionCount: sessionsResult.count ?? 0,
  };
}

export async function getAuditLogsForOwner(
  client: Client,
  ownerId: string,
  limit = 30,
): Promise<Array<TwinAuditLogRow & { property: Pick<Property, "street" | "city"> }>> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const { data, error } = await client
    .from("twin_audit_log")
    .select("*")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((log) => ({
    ...log,
    property: {
      street: propertyMap.get(log.property_id)?.street ?? "",
      city: propertyMap.get(log.property_id)?.city ?? "",
    },
  }));
}

export async function getPendingSuggestionsForOwner(
  client: Client,
  ownerId: string,
): Promise<Array<AiSuggestionRow & { property: Pick<Property, "street" | "city"> }>> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const { data, error } = await client
    .from("ai_suggestions")
    .select("*")
    .in("property_id", propertyIds)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  return (data ?? []).map((suggestion) => ({
    ...suggestion,
    property: {
      street: propertyMap.get(suggestion.property_id)?.street ?? "",
      city: propertyMap.get(suggestion.property_id)?.city ?? "",
    },
  }));
}

export async function getUnansweredQuestionsForOwner(
  client: Client,
  ownerId: string,
  limit = 20,
): Promise<Array<UnansweredQuestion & { property: Pick<Property, "street" | "city"> }>> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const { data, error } = await client
    .from("unanswered_questions")
    .select("*")
    .in("property_id", propertyIds)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((question) => ({
    ...question,
    property: {
      street: propertyMap.get(question.property_id)?.street ?? "",
      city: propertyMap.get(question.property_id)?.city ?? "",
    },
  }));
}

export async function getPropertyPhotos(
  client: Client,
  propertyId: string,
): Promise<Photo[]> {
  const { data, error } = await client
    .from("photos")
    .select("*")
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .order("display_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPropertyLeadCount(
  client: Client,
  propertyId: string,
): Promise<number> {
  const { count, error } = await client
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getPropertyVisitorCount(
  client: Client,
  propertyId: string,
): Promise<number> {
  const { count, error } = await client
    .from("visitor_sessions")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getPropertyQrCode(
  client: Client,
  propertyId: string,
): Promise<QrCode | null> {
  const { data, error } = await client
    .from("qr_codes")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPropertyVoiceNotes(
  client: Client,
  propertyId: string,
): Promise<VoiceNoteRow[]> {
  const { data, error } = await client
    .from("voice_notes")
    .select("*")
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getGeneratedPdfsForOwner(
  client: Client,
  ownerId: string,
): Promise<Array<GeneratedPdf & { property: Pick<Property, "street" | "city" | "slug"> }>> {
  const properties = await getOwnerProperties(client, ownerId);
  if (properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const { data, error } = await client
    .from("generated_pdfs")
    .select("*")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((pdf) => ({
    ...pdf,
    property: {
      street: propertyMap.get(pdf.property_id)?.street ?? "",
      city: propertyMap.get(pdf.property_id)?.city ?? "",
      slug: propertyMap.get(pdf.property_id)?.slug ?? "",
    },
  }));
}

export async function getOwnerProfileName(
  client: Client,
  ownerId: string,
): Promise<string> {
  const { data, error } = await client
    .from("profiles")
    .select("name")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.name ?? "Realtor";
}
