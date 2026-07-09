import Link from "next/link";

import { BuyerIntelligenceCard } from "@/components/realtor/buyer-intelligence-card";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBuyerIntelligenceReport } from "@/lib/buyer-intelligence";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { CRM_STATUS_LABELS } from "@/lib/realtor-workspace/types";
import { realtorRoutes } from "@/lib/navigation/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  getOwnerProperties,
  getWorkspaceOwnerId,
} from "@/lib/repositories/workspace-repository";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const data = await loadWorkspaceDashboard();
  const intelligenceReports: NonNullable<
    Awaited<ReturnType<typeof buildBuyerIntelligenceReport>>
  >[] = [];

  if (env.supabase.url && env.supabase.anonKey) {
    const client = await createClient();
    const ownerId = await getWorkspaceOwnerId(client);
    if (ownerId) {
      const properties = await getOwnerProperties(client, ownerId);
      for (const property of properties.slice(0, 3)) {
        const { data: sessions } = await client
          .from("visitor_sessions")
          .select("id")
          .eq("property_id", property.id)
          .order("started_at", { ascending: false })
          .limit(2);
        for (const session of sessions ?? []) {
          const report = await buildBuyerIntelligenceReport(client, session.id);
          if (report) intelligenceReports.push(report);
        }
      }
    }
  }

  return (
    <RealtorLayoutShell
      title="Leads"
      description="Buyer intelligence and captured leads from property tours."
      notifications={data.notifications}
    >
      {intelligenceReports.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Buyer Intelligence</h2>
          <div className="space-y-4">
            {intelligenceReports.slice(0, 5).map((report) => (
              <BuyerIntelligenceCard key={report.sessionId} report={report} />
            ))}
          </div>
        </section>
      )}

      {data.recentLeads.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No leads yet</CardTitle>
            <CardDescription>
              When buyers complete a tour and share their contact info, leads appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={realtorRoutes.newProperty}>Create a property tour</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Captured Leads</h2>
          {data.recentLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{lead.name ?? "Anonymous"}</h3>
                      <Badge variant="outline">{CRM_STATUS_LABELS[lead.crm_status]}</Badge>
                      <Badge variant="secondary">Score {lead.interestScore}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{lead.propertyAddress}</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {lead.email && (
                        <div>
                          <dt className="text-muted-foreground">Email</dt>
                          <dd>{lead.email}</dd>
                        </div>
                      )}
                      {lead.phone && (
                        <div>
                          <dt className="text-muted-foreground">Phone</dt>
                          <dd>{lead.phone}</dd>
                        </div>
                      )}
                    </dl>
                    {lead.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {lead.requested_showing && <Badge>Requested showing</Badge>}
                    {lead.requested_pdf && <Badge variant="secondary">Requested brochure</Badge>}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={realtorRoutes.propertySection(lead.property_id, "buyer-questions")}>
                        View property
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RealtorLayoutShell>
  );
}
