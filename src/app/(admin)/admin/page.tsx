import { createPlatformAdminService } from "@/lib/platform-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await createPlatformAdminService();
  const dashboard = await admin.getDashboard();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Platform Administration</h1>
          <p className="text-sm text-muted-foreground">
            Internal operations console — authorized staff only.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetric label="Platform Health" value={dashboard.platformHealth} />
          <AdminMetric label="Active Properties" value={dashboard.activeProperties} />
          <AdminMetric label="Today&apos;s Tours" value={dashboard.todaysTours} />
          <AdminMetric label="Today&apos;s Leads" value={dashboard.todaysLeads} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>All services operational</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Admin API available at <code>/api/v1/admin/dashboard</code> with platform admin credentials.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl capitalize">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
