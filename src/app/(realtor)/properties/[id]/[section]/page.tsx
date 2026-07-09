import { notFound, redirect } from "next/navigation";

import {
  PropertyHealthBreakdown,
  PropertyHealthBadge,
} from "@/components/property/property-health-badge";
import {
  DocumentsSection,
  KnowledgeSection,
  PhotosSection,
} from "@/components/realtor/property-sections";
import {
  BuyerQuestionsSection,
  GeneratedAssetsSection,
  PropertyAnalyticsSection,
  PropertyTwinSection,
  PublishingSection,
  SettingsSection,
  VoiceNotesSection,
} from "@/components/realtor/property-section-views";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { calculatePropertyHealth } from "@/lib/property-health/score";
import { getSectionTitle } from "@/lib/property-editor/sections";
import { loadPropertyTwinContext } from "@/lib/repositories/property-repository";
import {
  getPropertyLeadCount,
  getPropertyQrCode,
  getPropertyVisitorCount,
  getPropertyVoiceNotes,
} from "@/lib/repositories/workspace-repository";
import { createClient } from "@/lib/supabase/server";
import {
  legacySectionRedirects,
  realtorRoutes,
  type PropertyEditorSection,
} from "@/lib/navigation/routes";
import type { PropertyHealthBreakdown as HealthBreakdown } from "@/lib/property-health/score";

export const dynamic = "force-dynamic";

const HEALTH_LABELS: Record<keyof HealthBreakdown, string> = {
  knowledgeCompleteness: "Knowledge Completeness",
  knowledgeVerification: "Knowledge Verification",
  assetCoverage: "Asset Coverage",
  photography: "Photography",
  voiceDocumentation: "Voice Documentation",
  maintenanceHistory: "Maintenance History",
  timelineCompleteness: "Timeline Completeness",
  buyerQuestionsAnswered: "Buyer Questions Answered",
  marketingReadiness: "Marketing Readiness",
  accessibility: "Accessibility",
  documentCoverage: "Document Coverage",
  knowledgeFreshness: "Knowledge Freshness",
};

const HEALTH_WEIGHTS: Record<keyof HealthBreakdown, number> = {
  knowledgeCompleteness: 20,
  knowledgeVerification: 15,
  assetCoverage: 10,
  photography: 10,
  voiceDocumentation: 10,
  maintenanceHistory: 10,
  timelineCompleteness: 5,
  buyerQuestionsAnswered: 10,
  marketingReadiness: 5,
  accessibility: 5,
  documentCoverage: 5,
  knowledgeFreshness: 5,
};

interface SectionPageProps {
  params: Promise<{ id: string; section: string }>;
}

const validSections = new Set<PropertyEditorSection>([
  "overview",
  "property-twin",
  "knowledge",
  "photos",
  "documents",
  "voice-notes",
  "buyer-questions",
  "analytics",
  "generated-assets",
  "publishing",
  "settings",
]);

export default async function PropertySectionPage({ params }: SectionPageProps) {
  const { id, section } = await params;

  const legacyRedirect = legacySectionRedirects[section];
  if (legacyRedirect) {
    redirect(realtorRoutes.propertySection(id, legacyRedirect));
  }

  if (!validSections.has(section as PropertyEditorSection)) {
    notFound();
  }

  const sectionKey = section as PropertyEditorSection;
  const title = getSectionTitle(sectionKey);

  if (!env.supabase.url || !env.supabase.anonKey) {
    return <SectionPlaceholder title={title} section={sectionKey} />;
  }

  const client = await createClient();
  const context = await loadPropertyTwinContext(client, id);
  if (!context) {
    notFound();
  }

  const [voiceNotes, visitorCount, leadCount, qrCode] = await Promise.all([
    getPropertyVoiceNotes(client, id),
    getPropertyVisitorCount(client, id),
    getPropertyLeadCount(client, id),
    getPropertyQrCode(client, id),
  ]);

  const health = calculatePropertyHealth(context, voiceNotes.length);

  if (sectionKey === "overview") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.property.street}, {context.property.city}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Property Health</CardTitle>
              <CardDescription>Goal: 90+ for publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyHealthBreakdown
                breakdown={health.breakdown}
                labels={HEALTH_LABELS}
                weights={HEALTH_WEIGHTS}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PropertyHealthBadge
                score={health.total}
                status={health.status}
                label={health.label}
              />
              <dl className="space-y-2 text-sm">
                <ScoreRow label="Completeness" value={`${health.breakdown.knowledgeCompleteness}%`} />
                <ScoreRow label="Verification" value={`${health.breakdown.knowledgeVerification}%`} />
                <ScoreRow label="Marketing Readiness" value={`${health.breakdown.marketingReadiness}%`} />
                <ScoreRow label="Knowledge Objects" value={context.knowledgeObjects.length} />
                <ScoreRow label="Photos" value={context.photos.length} />
                <ScoreRow label="Status" value={context.property.status} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <OverviewCard title="Publishing Status" value={context.property.published_at ? "Published" : "Draft"} />
          <OverviewCard title="QR Status" value={qrCode ? "Active" : context.property.published_at ? "Inactive" : "Pending"} />
          <OverviewCard title="Visitors" value={visitorCount.toString()} />
          <OverviewCard title="Leads" value={leadCount.toString()} />
        </div>
      </div>
    );
  }

  switch (sectionKey) {
    case "property-twin":
      return <PropertyTwinSection context={context} />;
    case "knowledge":
      return <KnowledgeSection context={context} />;
    case "photos":
      return <PhotosSection context={context} />;
    case "documents":
      return <DocumentsSection context={context} />;
    case "voice-notes":
      return <VoiceNotesSection voiceNotes={voiceNotes} />;
    case "buyer-questions": {
      const { data: questions } = await client
        .from("unanswered_questions")
        .select("*")
        .eq("property_id", id)
        .order("created_at", { ascending: false });
      return <BuyerQuestionsSection questions={questions ?? []} />;
    }
    case "analytics": {
      const { data: events } = await client
        .from("analytics_events")
        .select("*")
        .eq("property_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (
        <PropertyAnalyticsSection
          events={events ?? []}
          visitorCount={visitorCount}
          leadCount={leadCount}
        />
      );
    }
    case "generated-assets": {
      const { data: pdfs } = await client
        .from("generated_pdfs")
        .select("*")
        .eq("property_id", id);
      return <GeneratedAssetsSection pdfs={pdfs ?? []} />;
    }
    case "publishing":
      return (
        <PublishingSection context={context} qrCode={qrCode} healthScore={health.total} />
      );
    case "settings":
      return <SettingsSection context={context} />;
    default:
      return <SectionPlaceholder title={title} section={sectionKey} />;
  }
}

function ScoreRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

function OverviewCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-lg">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function SectionPlaceholder({
  title,
  section,
}: {
  title: string;
  section: PropertyEditorSection;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Supabase to load {section} data.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Workspace content requires database connection.
        </CardContent>
      </Card>
    </div>
  );
}
