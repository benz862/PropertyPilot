import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPropertyTwinExplorerModel } from "@/lib/property-twin";
import type { PropertyTwinContext } from "@/types/database";
import type { VoiceNoteRow } from "@/types/database";
import type { UnansweredQuestion } from "@/types/database";
import type { GeneratedPdf } from "@/types/database";
import type { QrCode } from "@/types/database";
import type { AnalyticsEvent } from "@/types/database";

interface PropertyTwinSectionProps {
  context: PropertyTwinContext;
}

export function PropertyTwinSection({ context }: PropertyTwinSectionProps) {
  const explorer = buildPropertyTwinExplorerModel(context);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Property Twin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Knowledge graph, systems, features, and relationships
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TwinStat label="Knowledge Objects" value={explorer.counts.knowledgeObjects} />
        <TwinStat label="Verified Facts" value={explorer.counts.facts} />
        <TwinStat label="Systems" value={context.systems.length} />
        <TwinStat label="Appliances" value={context.appliances.length} />
        <TwinStat label="POIs" value={explorer.counts.pointsOfInterest} />
        <TwinStat label="Features" value={context.features.length} />
        <TwinStat label="Documents" value={explorer.counts.documents} />
        <TwinStat label="Photos" value={explorer.counts.photos} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Systems</CardTitle>
            <CardDescription>Mechanical and structural systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {context.systems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No systems recorded.</p>
            ) : (
              context.systems.map((system) => (
                <div key={system.id} className="flex justify-between text-sm">
                  <span className="capitalize">{system.system_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">
                    {system.manufacturer ?? "Unknown"}
                    {system.age_years ? ` · ${system.age_years}y` : ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Features</CardTitle>
            <CardDescription>Property features linked to knowledge</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {context.features.length === 0 ? (
              <p className="text-sm text-muted-foreground">No features linked yet.</p>
            ) : (
              context.features.map((feature) => (
                <Badge key={feature.id} variant="secondary">
                  {feature.name}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Knowledge Graph</CardTitle>
            <CardDescription>Objects and their relationships</CardDescription>
          </CardHeader>
          <CardContent>
            {context.knowledgeObjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Build the property twin to populate the graph.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {context.knowledgeObjects.map((ko) => (
                  <div
                    key={ko.id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <p className="font-medium">{ko.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{ko.category}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ko.verified_facts.length} facts · v{ko.revision_number}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Points of Interest</CardTitle>
            <CardDescription>Tour stops and welcome prompts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {context.pointsOfInterest.length === 0 ? (
              <p className="text-sm text-muted-foreground">No POIs configured.</p>
            ) : (
              context.pointsOfInterest.map((poi) => (
                <div key={poi.id} className="flex justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span className="font-medium">{poi.title}</span>
                  <span className="text-muted-foreground">
                    {poi.estimated_viewing_minutes ?? "—"} min
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TwinStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

interface VoiceNotesSectionProps {
  voiceNotes: VoiceNoteRow[];
}

export function VoiceNotesSection({ voiceNotes }: VoiceNotesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Voice Notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Timeline of recordings with transcripts and extracted knowledge
        </p>
      </div>

      {voiceNotes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Record voice notes to capture property knowledge quickly.
          </CardContent>
        </Card>
      ) : (
        <ol className="space-y-4">
          {voiceNotes.map((note) => (
            <li key={note.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {new Date(note.created_at).toLocaleString()}
                    </CardTitle>
                    <Badge variant="outline">Pending approval</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{note.transcript}</p>
                  {note.missing_information.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">AI Suggestions</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                        {note.missing_information.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface BuyerQuestionsSectionProps {
  questions: UnansweredQuestion[];
}

export function BuyerQuestionsSection({ questions }: BuyerQuestionsSectionProps) {
  const unresolved = questions.filter((q) => !q.resolved);
  const recent = questions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buyer Questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {unresolved.length} unanswered · track frequency and suggested knowledge additions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Unanswered</p>
            <p className="text-2xl font-bold">{unresolved.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total Asked</p>
            <p className="text-2xl font-bold">{questions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Needs Knowledge</p>
            <p className="text-2xl font-bold">
              {questions.filter((q) => q.suggested_knowledge_addition).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Buyer questions appear when the AI cannot answer during a tour.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recent.map((question) => (
            <Card key={question.id}>
              <CardContent className="py-4">
                <p className="font-medium">{question.question}</p>
                {question.suggested_knowledge_addition && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Suggested: {question.suggested_knowledge_addition}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(question.created_at).toLocaleDateString()}
                  {question.resolved ? " · Resolved" : " · Unanswered"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface PropertyAnalyticsSectionProps {
  events: AnalyticsEvent[];
  visitorCount: number;
  leadCount: number;
}

export function PropertyAnalyticsSection({
  events,
  visitorCount,
  leadCount,
}: PropertyAnalyticsSectionProps) {
  const qrScans = events.filter((e) => e.event_type === "qr_scan").length;
  const questions = events.filter((e) => e.event_type === "question_asked").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tour engagement for this property</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TwinStat label="Visitors" value={visitorCount} />
        <TwinStat label="QR Scans" value={qrScans} />
        <TwinStat label="Questions" value={questions} />
        <TwinStat label="Leads" value={leadCount} />
      </div>
    </div>
  );
}

interface GeneratedAssetsSectionProps {
  pdfs: GeneratedPdf[];
}

const ASSET_TYPES = [
  "Buyer Brochure",
  "Luxury Brochure",
  "Feature Sheet",
  "Flyer",
  "QR Sign",
  "Open House Sign",
  "Social Posts",
  "Property Description",
  "Voice Introductions",
  "FAQ",
  "Email Templates",
] as const;

export function GeneratedAssetsSection({ pdfs }: GeneratedAssetsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generated Assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated marketing materials · versioned and downloadable
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ASSET_TYPES.map((type) => {
          const pdf = pdfs.find((p) => p.title.toLowerCase().includes(type.toLowerCase().split(" ")[0] ?? ""));
          return (
            <Card key={type}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{type}</p>
                  <p className="text-xs text-muted-foreground">
                    {pdf ? `v1 · ${new Date(pdf.created_at).toLocaleDateString()}` : "Not generated"}
                  </p>
                </div>
                <Badge variant={pdf ? "default" : "outline"}>
                  {pdf ? "Ready" : "Pending"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface PublishingSectionProps {
  context: PropertyTwinContext;
  qrCode: QrCode | null;
  healthScore: number;
}

export function PublishingSection({ context, qrCode, healthScore }: PublishingSectionProps) {
  const isPublished = Boolean(context.property.published_at);
  const canPublish = healthScore >= 60;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Publishing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Go live with QR code and buyer tour
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publishing Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Health Score</span>
              <span className="font-medium">{healthScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">QR Code</span>
              <Badge variant={qrCode ? "default" : "outline"}>
                {qrCode ? `Active · ${qrCode.scan_count} scans` : "Not generated"}
              </Badge>
            </div>
            {!canPublish && (
              <p className="text-sm text-amber-700">
                Improve property health to at least 60 before publishing.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publish Preview</CardTitle>
            <CardDescription>Review before going live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CheckItem done={context.pointsOfInterest.length > 0} label="Tour POIs configured" />
            <CheckItem done={context.photos.length >= 3} label="Minimum photos uploaded" />
            <CheckItem done={context.knowledgeObjects.length >= 3} label="Knowledge coverage" />
            <CheckItem done={context.voicePersonality !== null} label="Voice personality set" />
            <CheckItem done={healthScore >= 90} label="Health score 90+ (recommended)" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={done ? "text-emerald-600" : "text-muted-foreground"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

interface SettingsSectionProps {
  context: PropertyTwinContext;
}

export function SettingsSection({ context }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workspace Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Voice personality, lead capture, branding, and integrations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingsCard
          title="Voice Personality"
          value={context.voicePersonality?.tone ?? "Not configured"}
          description={context.voicePersonality?.greeting ?? "Set greeting and conversation style"}
        />
        <SettingsCard
          title="Lead Capture Rules"
          value={context.aiPolicy ? `${context.aiPolicy.rules.length} rules` : "Default"}
          description="When to prompt buyers for contact info"
        />
        <SettingsCard title="Branding" value="Default theme" description="QR style and brochure theme" />
        <SettingsCard title="Conversation Mode" value="Guided tour" description="Buyer experience mode" />
        <SettingsCard title="Notifications" value="Enabled" description="Lead and question alerts" />
        <SettingsCard title="CRM Integration" value="Not connected" description="GoHighLevel sync" />
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
