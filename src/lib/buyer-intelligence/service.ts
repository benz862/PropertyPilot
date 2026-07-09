import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  detectConcernsFromObjections,
  detectConcernsFromQuestions,
} from "./concern-engine";
import { calculateIntentScore, getIntentLevel } from "./intent-engine";
import {
  estimateSentiment,
  generateExecutiveSummary,
  generateFollowUpRecommendations,
  generateTalkingPoints,
  mapInterestSignals,
} from "./summary-generator";
import { buildBuyerTimeline } from "./timeline-builder";
import type { BuyerIntelligenceReport, EngagementMetrics } from "./types";

type Client = SupabaseClient<Database>;

export async function buildBuyerIntelligenceReport(
  client: Client,
  visitorSessionId: string,
): Promise<BuyerIntelligenceReport | null> {
  const { data: session, error: sessionError } = await client
    .from("visitor_sessions")
    .select("*")
    .eq("id", visitorSessionId)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) return null;

  const [
    interestsResult,
    objectionsResult,
    eventsResult,
    turnsResult,
    unansweredResult,
    leadResult,
    poisResult,
  ] = await Promise.all([
    client
      .from("buyer_interests")
      .select("*")
      .eq("visitor_session_id", visitorSessionId),
    client
      .from("buyer_objections")
      .select("*")
      .eq("visitor_session_id", visitorSessionId),
    client
      .from("analytics_events")
      .select("*")
      .eq("visitor_session_id", visitorSessionId)
      .order("created_at"),
    client
      .from("conversation_turns")
      .select("question, intent")
      .eq("visitor_session_id", visitorSessionId),
    client
      .from("unanswered_questions")
      .select("question")
      .eq("visitor_session_id", visitorSessionId),
    client
      .from("leads")
      .select("id")
      .eq("visitor_session_id", visitorSessionId)
      .maybeSingle(),
    client
      .from("points_of_interest")
      .select("id, title")
      .eq("property_id", session.property_id),
  ]);

  const events = eventsResult.data ?? [];
  const turns = turnsResult.data ?? [];
  const questions = turns.map((t) => t.question);
  const poiMap = new Map((poisResult.data ?? []).map((p) => [p.id, p.title]));

  const durationMinutes = session.ended_at
    ? Math.round(
        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) /
          60000,
      )
    : null;

  const poisViewed = events
    .filter((e) => e.event_type === "poi_viewed" && e.poi_id)
    .map((e) => poiMap.get(e.poi_id!) ?? e.poi_id!)
    .filter(Boolean);

  const engagement: EngagementMetrics = {
    tourStarted: events.some((e) => e.event_type === "qr_scan") || turns.length > 0,
    tourCompleted:
      turns.length >= 3 && durationMinutes !== null && durationMinutes >= 5,
    poisViewed: Array.from(new Set(poisViewed)),
    questionsAsked: turns.length,
    voiceInteractions: turns.length,
    photoViews: events.filter((e) => e.event_type === "poi_viewed").length,
    documentViews: events.filter((e) => e.event_type === "pdf_download").length,
    brochureRequests: events.filter((e) => e.event_type === "pdf_download").length,
    showingRequests: events.filter((e) => e.event_type === "showing_request").length,
    exitPoint: events.find((e) => e.event_type === "exit_point")?.event_data?.label as string | null ?? null,
    durationMinutes,
  };

  const showingRequested = engagement.showingRequests > 0 ||
    turns.some((t) => t.intent === "showing");
  const brochureRequested = engagement.brochureRequests > 0 ||
    turns.some((t) => t.intent === "brochure");

  const interests = mapInterestSignals(interestsResult.data ?? [], questions);
  const concerns = [
    ...detectConcernsFromQuestions(questions),
    ...detectConcernsFromObjections(objectionsResult.data ?? []),
  ];

  const intentScore = calculateIntentScore({
    engagement,
    showingRequested,
    brochureRequested,
  });
  const intentLevel = getIntentLevel(intentScore);
  const sentiment = estimateSentiment({
    concerns,
    intentLevel,
    questionsCount: questions.length,
  });

  const topPois = engagement.poisViewed.slice(0, 3);
  const topQuestions = questions.slice(0, 5);
  const unanswered = (unansweredResult.data ?? []).map((q) => q.question);

  const executiveSummary = generateExecutiveSummary({
    durationMinutes,
    topPois,
    topInterests: interests,
    concerns,
    questionsCount: questions.length,
    intentLevel,
    showingRequested,
    brochureRequested,
  });

  return {
    sessionId: visitorSessionId,
    propertyId: session.property_id,
    isAnonymous: !leadResult.data,
    leadId: leadResult.data?.id ?? null,
    sessionInfo: {
      startedAt: session.started_at,
      endedAt: session.ended_at,
      durationMinutes,
      device: session.device_type,
      language: session.language,
    },
    engagement,
    interests,
    concerns,
    intentLevel,
    intentScore,
    sentiment,
    executiveSummary,
    topQuestions: [...topQuestions, ...unanswered].slice(0, 8),
    timeline: buildBuyerTimeline(events, session.started_at),
    followUpRecommendations: generateFollowUpRecommendations({
      interests,
      concerns,
      intentLevel,
      topQuestions,
    }),
    suggestedTalkingPoints: generateTalkingPoints({ interests, concerns, engagement }),
    aiConfidence: Math.min(100, 50 + turns.length * 5),
  };
}

export async function buildReportsForProperty(
  client: Client,
  propertyId: string,
  limit = 20,
): Promise<BuyerIntelligenceReport[]> {
  const { data: sessions, error } = await client
    .from("visitor_sessions")
    .select("id")
    .eq("property_id", propertyId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!sessions?.length) return [];

  const reports = await Promise.all(
    sessions.map((s) => buildBuyerIntelligenceReport(client, s.id)),
  );

  return reports.filter((r): r is BuyerIntelligenceReport => r !== null);
}
