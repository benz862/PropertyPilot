"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Recommendation, RecommendationPriority } from "@/lib/property-dna/recommendations";

const PRIORITY_VARIANT: Record<RecommendationPriority, "default" | "secondary" | "outline"> = {
  critical: "default",
  important: "secondary",
  optional: "outline",
};

export function MakeBetterPanel({ recommendations }: { recommendations: Recommendation[] }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Make This Property Better</p>
              <p className="text-xs text-muted-foreground">
                {recommendations.length > 0
                  ? `${recommendations.length} AI recommendation${recommendations.length === 1 ? "" : "s"} from Property DNA`
                  : "Property DNA looks complete — nothing urgent right now."}
              </p>
            </div>
          </div>
          {recommendations.length > 0 && (
            <Button size="sm" variant={open ? "outline" : "default"} onClick={() => setOpen((value) => !value)}>
              {open ? "Hide recommendations" : "Show recommendations"}
            </Button>
          )}
        </div>

        {open && recommendations.length > 0 && (
          <ul className="space-y-2">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <Badge variant={PRIORITY_VARIANT[rec.priority]} className="mt-0.5 capitalize">
                  {rec.priority}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
