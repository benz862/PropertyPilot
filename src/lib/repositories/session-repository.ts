import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AnalyticsEventType,
  Conversation,
  ConversationTurn,
  Database,
  VisitorSession,
} from "@/types/database";

type Client = SupabaseClient<Database>;

export async function createVisitorSession(
  client: Client,
  params: {
    propertyId: string;
    sessionToken: string;
    currentPoiId?: string | null;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    language?: string;
  },
): Promise<VisitorSession> {
  const { data, error } = await client
    .from("visitor_sessions")
    .insert({
      property_id: params.propertyId,
      session_token: params.sessionToken,
      current_poi_id: params.currentPoiId ?? null,
      device_type: params.deviceType ?? null,
      browser: params.browser ?? null,
      operating_system: params.operatingSystem ?? null,
      language: params.language ?? "en",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getVisitorSession(
  client: Client,
  sessionToken: string,
): Promise<VisitorSession | null> {
  const { data, error } = await client
    .from("visitor_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateVisitorSession(
  client: Client,
  sessionId: string,
  updates: Partial<Pick<VisitorSession, "current_poi_id" | "conversation_summary" | "ended_at">>,
): Promise<void> {
  const { error } = await client
    .from("visitor_sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function getOrCreateConversation(
  client: Client,
  propertyId: string,
  visitorSessionId: string,
): Promise<Conversation> {
  const { data: existing } = await client
    .from("conversations")
    .select("*")
    .eq("visitor_session_id", visitorSessionId)
    .maybeSingle();

  if (existing) {
    return {
      ...existing,
      transcript: existing.transcript as Conversation["transcript"],
      questions: existing.questions as string[],
      answers: existing.answers as string[],
      escalations: existing.escalations as Conversation["escalations"],
    };
  }

  const { data, error } = await client
    .from("conversations")
    .insert({
      property_id: propertyId,
      visitor_session_id: visitorSessionId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    ...data,
    transcript: data.transcript as Conversation["transcript"],
    questions: data.questions as string[],
    answers: data.answers as string[],
    escalations: data.escalations as Conversation["escalations"],
  };
}

export async function logConversationTurn(
  client: Client,
  turn: Omit<ConversationTurn, "id" | "created_at">,
): Promise<ConversationTurn> {
  const { data, error } = await client
    .from("conversation_turns")
    .insert(turn)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function recordUnansweredQuestion(
  client: Client,
  params: {
    propertyId: string;
    visitorSessionId: string;
    question: string;
    suggestedKnowledgeAddition?: string;
  },
): Promise<void> {
  const { error } = await client.from("unanswered_questions").insert({
    property_id: params.propertyId,
    visitor_session_id: params.visitorSessionId,
    question: params.question,
    suggested_knowledge_addition: params.suggestedKnowledgeAddition ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function upsertBuyerInterest(
  client: Client,
  params: {
    visitorSessionId: string;
    propertyId: string;
    interestTopic: string;
    scoreIncrement?: number;
  },
): Promise<void> {
  const { data: existing } = await client
    .from("buyer_interests")
    .select("id, score")
    .eq("visitor_session_id", params.visitorSessionId)
    .eq("interest_topic", params.interestTopic)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from("buyer_interests")
      .update({ score: existing.score + (params.scoreIncrement ?? 1) })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("buyer_interests").insert({
    visitor_session_id: params.visitorSessionId,
    property_id: params.propertyId,
    interest_topic: params.interestTopic,
    score: params.scoreIncrement ?? 1,
  });

  if (error) throw new Error(error.message);
}

export async function recordBuyerObjection(
  client: Client,
  params: {
    visitorSessionId: string;
    propertyId: string;
    objectionTopic: string;
    notes?: string;
  },
): Promise<void> {
  const { error } = await client.from("buyer_objections").insert({
    visitor_session_id: params.visitorSessionId,
    property_id: params.propertyId,
    objection_topic: params.objectionTopic,
    notes: params.notes ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function recordAnalyticsEvent(
  client: Client,
  params: {
    propertyId: string;
    visitorSessionId?: string;
    poiId?: string;
    eventType: AnalyticsEventType;
    eventData?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await client.from("analytics_events").insert({
    property_id: params.propertyId,
    visitor_session_id: params.visitorSessionId ?? null,
    poi_id: params.poiId ?? null,
    event_type: params.eventType,
    event_data: params.eventData ?? {},
  });

  if (error) throw new Error(error.message);
}
