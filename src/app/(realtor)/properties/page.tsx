import Link from "next/link";
import { Plus } from "lucide-react";

import { PropertyCard } from "@/components/realtor/property-card";
import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadWorkspaceDashboard } from "@/lib/realtor-workspace";
import { realtorRoutes } from "@/lib/navigation/routes";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const data = await loadWorkspaceDashboard();

  return (
    <RealtorLayoutShell
      title="Properties"
      description="Every listing — created, managed, and improved."
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
      {data.properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-medium">No properties yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first listing in under 15 minutes.
            </p>
            <Button className="mt-4" asChild>
              <Link href={realtorRoutes.newProperty}>Start Wizard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </RealtorLayoutShell>
  );
}
