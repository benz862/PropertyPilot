import Link from "next/link";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCommerceService, SUBSCRIPTION_PLANS } from "@/lib/commerce";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { requireAuthenticatedUser } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await loadWorkspaceDashboard();
  let usageSummary = null;

  try {
    const user = await getBillingUser();
    if (user) {
      const commerce = await createCommerceService();
      usageSummary = commerce.getUsageSummary(user.id);
    }
  } catch {
    // Unauthenticated demo state
  }

  return (
    <RealtorLayoutShell
      title="Billing"
      description="Subscription, usage, and licensing."
      notifications={data.notifications}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {usageSummary?.license.status ?? data.subscription.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="secondary" className="text-sm">
              {usageSummary?.plan.name ?? data.subscription.label}
            </Badge>
            {usageSummary && (
              <div className="space-y-2 text-sm">
                <UsageRow
                  label="Listings"
                  used={usageSummary.usage.listings}
                  limit={usageSummary.limits.listings}
                />
                <UsageRow
                  label="AI Minutes"
                  used={usageSummary.usage.voice_minutes}
                  limit={usageSummary.limits.voice_minutes}
                />
                <UsageRow
                  label="Generated Assets"
                  used={usageSummary.usage.generated_pdfs}
                  limit={usageSummary.limits.generated_pdfs}
                />
              </div>
            )}
            <Button asChild variant="outline">
              <Link href="/api/v1/commerce/subscription">Manage subscription</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Database-driven entitlements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SUBSCRIPTION_PLANS.filter((p) => p.tier !== "enterprise").map((plan) => (
              <div key={plan.id} className="flex items-center justify-between text-sm">
                <span>{plan.name}</span>
                <span className="font-medium">
                  ${(plan.monthlyPriceCents / 100).toFixed(0)}/mo
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RealtorLayoutShell>
  );
}

async function getBillingUser() {
  try {
    return await requireAuthenticatedUser();
  } catch {
    return null;
  }
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>
        {used} / {limit}
      </span>
    </div>
  );
}
