import type { AnalyticsEvent } from "@/types/database";

import type { BuyerTimelineEvent } from "./types";

const EVENT_LABELS: Record<string, string> = {
  qr_scan: "QR Scan",
  poi_viewed: "Area Viewed",
  time_spent: "Time Spent",
  question_asked: "Question Asked",
  feature_requested: "Feature Requested",
  pdf_download: "Brochure Requested",
  showing_request: "Showing Requested",
  conversation_length: "Conversation",
  exit_point: "Exit",
  lead_captured: "Lead Captured",
};

export function buildBuyerTimeline(
  events: AnalyticsEvent[],
  sessionStartedAt: string,
): BuyerTimelineEvent[] {
  const timeline: BuyerTimelineEvent[] = [
    {
      id: "welcome",
      type: "welcome",
      label: "Welcome",
      timestamp: sessionStartedAt,
    },
  ];

  for (const event of events) {
    timeline.push({
      id: event.id,
      type: event.event_type,
      label: EVENT_LABELS[event.event_type] ?? event.event_type,
      timestamp: event.created_at,
      poiId: event.poi_id,
    });
  }

  return timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
