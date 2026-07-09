import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { createIntelligenceCenterService } from "@/lib/intelligence-center";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const data = await loadWorkspaceDashboard();
  const intelligence = await createIntelligenceCenterService();
  const dashboard = await intelligence.getDashboard("workspace");
  const summary = await intelligence.getExecutiveSummary("workspace");

  return (
    <RealtorLayoutShell
      title="Intelligence Center"
      description="Actionable recommendations from buyer activity and property data."
      notifications={data.notifications}
    >
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Executive Summary</CardTitle>
          <CardDescription>{summary.date}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{summary.narrative}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            ~{summary.estimatedReadMinutes} min read
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical items right now.</p>
            ) : (
              dashboard.priorities.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline">{item.priority}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{item.reason}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{item.action}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Properties Needing Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.propertiesNeedingAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">All listings look healthy.</p>
            ) : (
              dashboard.propertiesNeedingAttention.slice(0, 5).map((score) => (
                <div key={score.propertyId} className="flex justify-between text-sm">
                  <span>{score.address}</span>
                  <span className="font-medium">{score.overallScore}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RealtorLayoutShell>
  );
}
