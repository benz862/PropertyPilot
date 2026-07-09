import Link from "next/link";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { realtorRoutes } from "@/lib/navigation/routes";

export default function KnowledgeBuilderPage() {
  return (
    <RealtorLayoutShell
      title="Knowledge Center"
      description="Property knowledge engine — facts, search, FAQs, and health scores."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Knowledge Objects"
          description="Manage facts per property in the Knowledge tab of each listing."
          href={realtorRoutes.properties}
        />
        <FeatureCard
          title="Search & Graph"
          description="Fuzzy search and relationship graph via Knowledge Engine API."
          href={realtorRoutes.properties}
        />
        <FeatureCard
          title="Health & FAQs"
          description="Coverage scores and auto-generated FAQs from verified facts."
          href={realtorRoutes.intelligence}
        />
      </div>
    </RealtorLayoutShell>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          Open workspace
        </Link>
      </CardContent>
    </Card>
  );
}
