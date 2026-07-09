import Link from "next/link";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent } from "@/components/ui/card";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { realtorRoutes } from "@/lib/navigation/routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getOwnerProperties, getWorkspaceOwnerId } from "@/lib/repositories/workspace-repository";
import { getDocuments } from "@/lib/repositories/property-repository";
import { formatPropertyAddress } from "@/lib/realtor-workspace/types";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const data = await loadWorkspaceDashboard();
  const allDocuments: Array<{
    id: string;
    title: string;
    type: string;
    propertyId: string;
    propertyAddress: string;
    uploadedAt: string;
  }> = [];

  if (env.supabase.url && env.supabase.anonKey) {
    const client = await createClient();
    const ownerId = await getWorkspaceOwnerId(client);
    if (ownerId) {
      const properties = await getOwnerProperties(client, ownerId);
      for (const property of properties) {
        const docs = await getDocuments(client, property.id);
        for (const doc of docs) {
          allDocuments.push({
            id: doc.id,
            title: doc.title,
            type: doc.document_type.replace(/_/g, " "),
            propertyId: property.id,
            propertyAddress: formatPropertyAddress(property),
            uploadedAt: doc.created_at,
          });
        }
      }
    }
  }

  return (
    <RealtorLayoutShell
      title="Documents"
      description="All property documents across your listings."
      notifications={data.notifications}
    >
      {allDocuments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Upload inspection reports, disclosures, and warranties from property workspaces.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.propertyAddress} · {doc.type} ·{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={realtorRoutes.propertySection(doc.propertyId, "documents")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RealtorLayoutShell>
  );
}
