import Link from "next/link";

import { GeneratedAssetsSection } from "@/components/realtor/property-section-views";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent } from "@/components/ui/card";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { realtorRoutes } from "@/lib/navigation/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getGeneratedPdfsForOwner, getWorkspaceOwnerId } from "@/lib/repositories/workspace-repository";

export const dynamic = "force-dynamic";

export default async function GeneratedAssetsPage() {
  const data = await loadWorkspaceDashboard();
  let pdfs: Awaited<ReturnType<typeof getGeneratedPdfsForOwner>> = [];

  if (env.supabase.url && env.supabase.anonKey) {
    const client = await createClient();
    const ownerId = await getWorkspaceOwnerId(client);
    if (ownerId) {
      pdfs = await getGeneratedPdfsForOwner(client, ownerId);
    }
  }

  return (
    <RealtorLayoutShell
      title="Generated Assets"
      description="AI marketing materials across all listings."
      notifications={data.notifications}
    >
      {pdfs.length === 0 ? (
        <div className="space-y-6">
          <GeneratedAssetsSection pdfs={[]} />
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Generate assets from a property workspace after building the twin.
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {pdfs.map((pdf) => (
            <div key={pdf.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pdf.property.street}, {pdf.property.city}
                </p>
                <Link
                  href={realtorRoutes.propertySection(pdf.property_id, "generated-assets")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open property
                </Link>
              </div>
              <GeneratedAssetsSection pdfs={[pdf]} />
            </div>
          ))}
        </div>
      )}
    </RealtorLayoutShell>
  );
}
