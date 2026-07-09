import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await loadWorkspaceDashboard();

  return (
    <RealtorLayoutShell
      title="Analytics"
      description="Tour engagement and buyer behavior."
      notifications={data.notifications}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard metric="QR Scans" value={data.analytics.qrScans} />
        <MetricCard metric="Tour Starts" value={data.analytics.tourStarts} />
        <MetricCard
          metric="Avg. Duration"
          value={data.analytics.avgDurationMinutes ? `${data.analytics.avgDurationMinutes}m` : "—"}
        />
        <MetricCard
          metric="Lead Rate"
          value={
            data.analytics.tourStarts > 0
              ? `${Math.round((data.analytics.leadsCaptured / data.analytics.tourStarts) * 100)}%`
              : "—"
          }
        />
      </div>
    </RealtorLayoutShell>
  );
}

function MetricCard({ metric, value }: { metric: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{metric}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Across all properties</p>
      </CardContent>
    </Card>
  );
}
