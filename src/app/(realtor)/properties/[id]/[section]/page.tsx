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
  PropertyAnalyticsSection,
  PropertyTwinSection,
  PublishingSection,
  SettingsSection,
  VoiceNotesSection,
} from "@/components/realtor/property-section-views";
import {
  BuyerActivitySection,
  PropertyDNASection,
  RoomsSection,
} from "@/components/realtor/property-dna-views";
import { MakeBetterPanel } from "@/components/property/make-better-panel";
import { PropertyStudio } from "@/components/property/property-studio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import {
  STUDIO_SECTIONS,
  createBuyerActivityService,
  createPropertyDNAService,
  generateRecommendations,
  listAssetDefinitions,
} from "@/lib/property-dna";
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
  "property-dna",
  "rooms",
  "property-twin",
  "knowledge",
  "photos",
  "documents",
  "voice-notes",
  "buyer-questions",
  "buyer-activity",
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
    const dna = await createPropertyDNAService(client).getPropertyDNA(id);
    const recommendations = dna ? generateRecommendations(dna) : [];
    const [activitySummary, { data: recentQuestions }, { data: recentAssets }] = await Promise.all([
      createBuyerActivityService(client).summarize(id),
      client
        .from("buyer_questions")
        .select("question, selected_room, created_at, needs_agent_followup")
        .eq("property_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      client
        .from("property_assets")
        .select("title, asset_type, last_generated_at")
        .eq("property_id", id)
        .order("last_generated_at", { ascending: false })
        .limit(1),
    ]);
    const topTopic = Object.entries(activitySummary.topTopics).sort((a, b) => b[1] - a[1])[0];
    const lastAsset = recentAssets?.[0] ?? null;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.property.street}, {context.property.city}
          </p>
        </div>

        {dna && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <OverviewCard title="Knowledge Score" value={`${dna.health.knowledgeScore}`} />
            <OverviewCard title="Marketing Score" value={`${dna.health.marketingScore}`} />
            <OverviewCard title="Buyer Readiness" value={`${dna.health.buyerReadinessScore}`} />
            <OverviewCard title="Most Asked Topic" value={topTopic ? `${topTopic[0]} (${topTopic[1]})` : "—"} />
            <OverviewCard
              title="Last Generated Asset"
              value={lastAsset ? lastAsset.title : "None yet"}
            />
          </div>
        )}

        <MakeBetterPanel recommendations={recommendations} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Buyer Questions</CardTitle>
              <CardDescription>Latest questions from the QR tour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(recentQuestions ?? []).length === 0 ? (
                <p className="text-muted-foreground">No buyer questions yet.</p>
              ) : (
                (recentQuestions ?? []).map((item) => (
                  <div key={`${item.created_at}-${item.question}`} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{item.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.selected_room ?? "Whole Property"} ·{" "}
                      {new Date(item.created_at).toLocaleString()}
                      {item.needs_agent_followup ? " · Needs follow-up" : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Recommendations</CardTitle>
              <CardDescription>From Property DNA analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recommendations.length === 0 ? (
                <p className="text-muted-foreground">No recommendations right now.</p>
              ) : (
                recommendations.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-muted-foreground">{item.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
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
    case "property-dna": {
      const dna = await createPropertyDNAService(client).getPropertyDNA(id);
      if (!dna) return <SectionPlaceholder title={title} section={sectionKey} />;
      return <PropertyDNASection dna={dna} />;
    }
    case "rooms": {
      const dna = await createPropertyDNAService(client).getPropertyDNA(id);
      if (!dna) return <SectionPlaceholder title={title} section={sectionKey} />;
      return <RoomsSection rooms={dna.rooms} />;
    }
    case "buyer-activity": {
      const [summary, { data: questions }] = await Promise.all([
        createBuyerActivityService(client).summarize(id),
        client
          .from("buyer_questions")
          .select(
            "id, question, selected_room, confidence, needs_agent_followup, buyer_name, buyer_email, created_at",
          )
          .eq("property_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      return <BuyerActivitySection summary={summary} questions={questions ?? []} />;
    }
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
      const { data: assets } = await client
        .from("property_assets")
        .select("asset_type, title, content, file_url, status, last_generated_at")
        .eq("property_id", id);
      return (
        <PropertyStudio
          propertyId={id}
          sections={STUDIO_SECTIONS}
          definitions={listAssetDefinitions()}
          initialAssets={assets ?? []}
        />
      );
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
