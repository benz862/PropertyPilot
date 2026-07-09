import { AlertTriangle, ArrowRight, Lightbulb, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiCopilotPanelProps {
  suggestions?: string[];
  missingItems?: string[];
  warnings?: string[];
  publishingIssues?: string[];
  recommendedNextAction?: string | null;
  publishingChecklist?: Array<{ label: string; done: boolean }>;
}

export function AiCopilotPanel({
  suggestions = [],
  missingItems = [],
  warnings = [],
  publishingIssues = [],
  recommendedNextAction,
  publishingChecklist = [],
}: AiCopilotPanelProps) {
  const hasContent =
    suggestions.length > 0 ||
    missingItems.length > 0 ||
    warnings.length > 0 ||
    publishingIssues.length > 0 ||
    recommendedNextAction ||
    publishingChecklist.length > 0;

  return (
    <aside
      className="w-80 shrink-0 border-l border-border bg-secondary/30 p-4"
      aria-label="AI copilot panel"
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            AI Copilot
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            What should you do next?
          </p>
        </div>

        {recommendedNextAction && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-primary">
                <ArrowRight className="size-4" aria-hidden />
                Recommended Next Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">{recommendedNextAction}</p>
            </CardContent>
          </Card>
        )}

        {!hasContent && (
          <Card className="border-dashed shadow-none">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No issues detected. Your property is looking good.
            </CardContent>
          </Card>
        )}

        {publishingChecklist.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Publishing Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {publishingChecklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={
                      item.done
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                    aria-hidden
                  >
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>
                    {item.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {suggestions.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-accent" aria-hidden />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((item) => (
                <p key={item} className="text-sm leading-relaxed text-foreground">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {missingItems.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="size-4 text-primary" aria-hidden />
                Missing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {missingItems.map((item) => (
                <Badge key={item} variant="outline" className="block w-fit text-xs">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {warnings.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-amber-600" aria-hidden />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {warnings.map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {publishingIssues.length > 0 && (
          <Card className="border-amber-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Publishing Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {publishingIssues.map((item) => (
                <p key={item} className="text-sm text-amber-800">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {recommendedNextAction && (
          <Button variant="outline" size="sm" className="w-full">
            View all suggestions
          </Button>
        )}
      </div>
    </aside>
  );
}
