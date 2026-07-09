import Link from "next/link";

import { RealtorLayoutShell } from "@/components/layout/realtor-layout-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { realtorRoutes } from "@/lib/navigation/routes";

const helpTopics = [
  {
    title: "Create your first property",
    description: "Use the wizard to build a Digital Property Twin in under 15 minutes.",
    href: realtorRoutes.newProperty,
  },
  {
    title: "Improve property health",
    description: "Follow AI recommendations to reach 90+ before publishing.",
    href: realtorRoutes.dashboard,
  },
  {
    title: "Manage leads",
    description: "Review buyer interest and CRM status from captured tours.",
    href: realtorRoutes.leads,
  },
  {
    title: "Workspace settings",
    description: "Configure voice personality, branding, and notifications.",
    href: realtorRoutes.settings,
  },
] as const;

export default function HelpPage() {
  return (
    <RealtorLayoutShell title="Help" description="Guides and support resources.">
      <div className="grid gap-4 sm:grid-cols-2">
        {helpTopics.map((topic) => (
          <Card key={topic.title}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={topic.href} className="hover:text-primary">
                  {topic.title}
                </Link>
              </CardTitle>
              <CardDescription>{topic.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={topic.href} className="text-sm font-medium text-primary hover:underline">
                Learn more →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </RealtorLayoutShell>
  );
}
