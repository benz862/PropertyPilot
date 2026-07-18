import { notFound } from "next/navigation";

import { AiCopilotPanel } from "@/components/realtor/ai-copilot-panel";
import { PropertyEditorNav } from "@/components/property/property-editor-nav";
import { PropertyHealthBadge } from "@/components/property/property-health-badge";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";
import { calculatePropertyHealth } from "@/lib/property-health/score";
import { createPropertyDNAService, generateRecommendations } from "@/lib/property-dna";
import { loadPropertyTwinContext } from "@/lib/repositories/property-repository";
import { getPropertyVoiceNotes } from "@/lib/repositories/workspace-repository";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PropertyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function PropertyLayout({ children, params }: PropertyLayoutProps) {
  const { id } = await params;

  let address = "Property";
  let health = null;
  let suggestions: string[] = [];
  let missingItems: string[] = [];
  let recommendedNextAction: string | null = null;
  let publishingChecklist: Array<{ label: string; done: boolean }> = [];

  if (env.supabase.url && env.supabase.anonKey) {
    const client = await createClient();
    const context = await loadPropertyTwinContext(client, id);
    if (!context) {
      notFound();
    }
    address = `${context.property.street}, ${context.property.city}`;
    const voiceNotes = await getPropertyVoiceNotes(client, id);
    health = calculatePropertyHealth(context, voiceNotes.length);

    const dna = await createPropertyDNAService(client).getPropertyDNA(id);
    const recommendations = dna ? generateRecommendations(dna) : [];
    suggestions = recommendations.slice(0, 5).map((item) => item.detail);
    missingItems = recommendations
      .filter((item) => item.priority === "critical" || item.priority === "important")
      .slice(0, 6)
      .map((item) => item.title);
    recommendedNextAction = recommendations[0]?.title ?? (health.total < 90 ? "Complete missing sections to improve health score." : null);

    publishingChecklist = [
      { label: "Knowledge completeness 80%+", done: health.breakdown.knowledgeCompleteness >= 80 },
      { label: "Photos uploaded", done: context.photos.length >= 3 },
      { label: "Knowledge objects added", done: context.knowledgeObjects.length >= 3 },
      { label: "POIs configured", done: context.pointsOfInterest.length > 0 },
      { label: "Voice personality set", done: context.voicePersonality !== null },
      { label: "Health score 90+", done: health.total >= 90 },
    ];
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PropertyEditorNav propertyId={id} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{address}</h1>
            {health && (
              <PropertyHealthBadge
                score={health.total}
                status={health.status}
                label={health.label}
              />
            )}
            <Badge variant="outline">Draft</Badge>
          </div>
        </header>
        <div className="flex flex-1">
          <div className="min-w-0 flex-1 p-6">{children}</div>
          <AiCopilotPanel
            suggestions={suggestions}
            missingItems={missingItems}
            warnings={health && health.total < 60 ? ["Property health is below recommended threshold."] : []}
            publishingIssues={
              health && health.total < 90
                ? ["Complete more sections before publishing for best results."]
                : []
            }
            recommendedNextAction={recommendedNextAction}
            publishingChecklist={publishingChecklist}
          />
        </div>
      </div>
    </div>
  );
}
