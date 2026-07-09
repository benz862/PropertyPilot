import { Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityEvent } from "@/lib/realtor-workspace/types";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  limit?: number;
  emptyMessage?: string;
}

export function ActivityTimeline({
  events,
  limit = 10,
  emptyMessage = "No recent activity.",
}: ActivityTimelineProps) {
  const visible = events.slice(0, limit);

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-4">
      {visible.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Activity className="size-3.5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            {event.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {event.propertyAddress} · {formatTime(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActivityTimelineCard({
  events,
  title = "Recent Activity",
  description = "Latest updates across your listings",
}: {
  events: ActivityEvent[];
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityTimeline events={events} />
      </CardContent>
    </Card>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
