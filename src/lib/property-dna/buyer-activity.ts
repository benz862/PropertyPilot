import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalyticsEventType, Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type BuyerEventType =
  | "qr_scan"
  | "page_open"
  | "room_selected"
  | "question_asked"
  | "answer_returned"
  | "answer_given"
  | "unknown_question"
  | "lead_submitted"
  | "asset_downloaded"
  | "session_started"
  | "session_ended";

const EVENT_MAP: Record<BuyerEventType, AnalyticsEventType> = {
  qr_scan: "qr_scan",
  page_open: "qr_scan",
  room_selected: "poi_viewed",
  question_asked: "question_asked",
  answer_returned: "question_asked",
  answer_given: "question_asked",
  unknown_question: "feature_requested",
  lead_submitted: "showing_request",
  asset_downloaded: "pdf_download",
  session_started: "time_spent",
  session_ended: "time_spent",
};

export interface RecordBuyerEventInput {
  propertyId: string;
  type: BuyerEventType;
  room?: string | null;
  visitorSessionId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BuyerActivitySummary {
  totalEvents: number;
  scans: number;
  questions: number;
  unknownQuestions: number;
  leads: number;
  downloads: number;
  sessions: number;
  roomSelections: Record<string, number>;
  topTopics: Record<string, number>;
}

/**
 * BuyerActivityService — captures buyer behavior. Recording is best-effort and
 * never throws, so the buyer experience is never broken by analytics.
 */
export class BuyerActivityService {
  constructor(private readonly client: Client) {}

  async recordEvent(input: RecordBuyerEventInput): Promise<void> {
    try {
      await this.client.from("analytics_events").insert({
        property_id: input.propertyId,
        visitor_session_id: input.visitorSessionId ?? null,
        event_type: EVENT_MAP[input.type],
        event_data: {
          buyerEvent: input.type,
          room: input.room ?? null,
          ...(input.metadata ?? {}),
          recordedAt: new Date().toISOString(),
        },
      });
    } catch {
      // best-effort only
    }
  }

  async summarize(propertyId: string): Promise<BuyerActivitySummary> {
    const summary: BuyerActivitySummary = {
      totalEvents: 0,
      scans: 0,
      questions: 0,
      unknownQuestions: 0,
      leads: 0,
      downloads: 0,
      sessions: 0,
      roomSelections: {},
      topTopics: {},
    };

    const { data } = await this.client
      .from("analytics_events")
      .select("event_type, event_data")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(500);

    for (const row of data ?? []) {
      summary.totalEvents += 1;
      const buyerEvent = readBuyerEvent(row.event_data);
      switch (buyerEvent ?? row.event_type) {
        case "qr_scan":
        case "page_open":
          summary.scans += 1;
          break;
        case "question_asked":
        case "answer_returned":
        case "answer_given":
          summary.questions += 1;
          trackTopic(summary, row.event_data);
          break;
        case "unknown_question":
        case "feature_requested":
          summary.unknownQuestions += 1;
          break;
        case "lead_submitted":
        case "showing_request":
          summary.leads += 1;
          break;
        case "asset_downloaded":
        case "pdf_download":
          summary.downloads += 1;
          break;
        case "room_selected":
        case "poi_viewed": {
          const room = readRoom(row.event_data);
          if (room) summary.roomSelections[room] = (summary.roomSelections[room] ?? 0) + 1;
          break;
        }
        case "session_started":
        case "session_ended":
          summary.sessions += 1;
          break;
      }
    }

    return summary;
  }
}

function trackTopic(summary: BuyerActivitySummary, eventData: unknown) {
  if (!eventData || typeof eventData !== "object" || !("question" in eventData)) return;
  const question = String((eventData as Record<string, unknown>).question ?? "").toLowerCase();
  if (!question) return;
  const topics: Array<[string, string[]]> = [
    ["roof", ["roof", "shingle"]],
    ["school", ["school", "district"]],
    ["tax", ["tax", "taxes"]],
    ["hvac", ["hvac", "furnace", "air condition"]],
    ["utilities", ["utility", "utilities", "electric", "water bill"]],
  ];
  for (const [topic, keywords] of topics) {
    if (keywords.some((keyword) => question.includes(keyword))) {
      summary.topTopics[topic] = (summary.topTopics[topic] ?? 0) + 1;
    }
  }
}

export function createBuyerActivityService(client: Client): BuyerActivityService {
  return new BuyerActivityService(client);
}

function readBuyerEvent(eventData: unknown): string | null {
  if (eventData && typeof eventData === "object" && "buyerEvent" in eventData) {
    const value = (eventData as Record<string, unknown>).buyerEvent;
    return typeof value === "string" ? value : null;
  }
  return null;
}

function readRoom(eventData: unknown): string | null {
  if (eventData && typeof eventData === "object" && "room" in eventData) {
    const value = (eventData as Record<string, unknown>).room;
    return typeof value === "string" && value.trim() ? value : null;
  }
  return null;
}
