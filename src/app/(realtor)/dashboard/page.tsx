import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { ActivityTimelineCard } from "@/components/realtor/activity-timeline";
import { PropertyCard } from "@/components/realtor/property-card";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { realtorRoutes } from "@/lib/navigation/routes";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await loadWorkspaceDashboard();

  return (
    <RealtorLayoutShell
      title={`Welcome back, ${data.realtorName}`}
      description="What does the realtor need to do next?"
      notifications={data.notifications}
      actions={
        <Button asChild>
          <Link href={realtorRoutes.newProperty}>
            <Plus className="size-4" aria-hidden />
            New Property
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {data.recommendations.length > 0 && (
          <section aria-labelledby="ai-recommendations-heading">
            <h2 id="ai-recommendations-heading" className="mb-3 text-lg font-semibold">
              Today&apos;s AI Recommendations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.recommendations.slice(0, 4).map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="flex items-start gap-3 py-4">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed">{rec.message}</p>
                      {rec.propertyAddress && (
                        <p className="mt-1 text-xs text-muted-foreground">{rec.propertyAddress}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Listings</CardTitle>
                  <CardDescription>Published and active property tours</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={realtorRoutes.properties}>View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.properties.filter((p) => p.status === "active" || p.status === "published").length === 0 ? (
                  <EmptyListings />
                ) : (
                  <div className="grid gap-4">
                    {data.properties
                      .filter((p) => p.status === "active" || p.status === "published")
                      .slice(0, 3)
                      .map((property) => (
                        <PropertyCard key={property.id} property={property} compact />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {data.attentionListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Listings Requiring Attention</CardTitle>
                  <CardDescription>Health below 90 or still in draft</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {data.attentionListings.slice(0, 3).map((property) => (
                    <PropertyCard key={property.id} property={property} compact />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="secondary">{data.subscription.label}</Badge>
              <p className="text-sm text-muted-foreground">
                {data.subscription.propertyCount} of {data.subscription.propertyLimit ?? "∞"}{" "}
                properties used
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={realtorRoutes.billing}>Manage Subscription</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DashboardPanel title="Analytics Summary" description="Last 30 days">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="QR Scans" value={data.analytics.qrScans || "—"} />
              <Stat label="Tour Starts" value={data.analytics.tourStarts || "—"} />
              <Stat label="Questions" value={data.analytics.questionsAsked || "—"} />
              <Stat label="Leads" value={data.analytics.leadsCaptured || "—"} />
            </div>
          </DashboardPanel>

          <DashboardPanel title="Recent Leads" description="Latest buyer interest">
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentLeads.slice(0, 5).map((lead) => (
                  <li key={lead.id} className="text-sm">
                    <p className="font-medium">{lead.name ?? lead.email ?? "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{lead.propertyAddress}</p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel title="Unread Buyer Questions" description="Needs your attention">
            <p className="text-2xl font-bold">{data.unansweredQuestionCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.unansweredQuestionCount === 0
                ? "All questions answered"
                : "Questions the AI could not answer"}
            </p>
          </DashboardPanel>

          <DashboardPanel title="Health Scores" description="Latest property health">
            {data.properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No properties yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.properties.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span className="truncate text-muted-foreground">{p.address}</span>
                    <span className="font-medium">{p.healthScore}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <div className="xl:col-span-2">
            <ActivityTimelineCard events={data.activity} />
          </div>
        </div>
      </div>
    </RealtorLayoutShell>
  );
}

function EmptyListings() {
  return (
    <div className="py-8 text-center">
      <p className="font-medium">No published listings yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first property tour to get started.
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href={realtorRoutes.newProperty}>New Property</Link>
      </Button>
    </div>
  );
}

function DashboardPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
