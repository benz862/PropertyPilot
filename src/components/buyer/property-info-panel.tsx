"use client";

import Link from "next/link";
import { Calendar, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buyerRoutes, buyerSidebarSections } from "@/lib/navigation/routes";
import type { BuyerSidebarSectionId } from "@/lib/navigation/routes";
import type { PropertyTwinContext } from "@/types/database";

interface PropertyInfoPanelProps {
  slug: string;
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  context: PropertyTwinContext;
  defaultTab?: BuyerSidebarSectionId;
}

export function PropertyInfoPanel({
  slug,
  agentName,
  agentPhone,
  agentEmail,
  context,
  defaultTab = "features",
}: PropertyInfoPanelProps) {
  const neighborhoodKo = context.knowledgeObjects.filter((ko) =>
    ["neighborhood", "schools", "community"].includes(ko.category),
  );
  const utilityKo = context.knowledgeObjects.filter((ko) =>
    ["utilities", "electrical", "plumbing", "hvac"].includes(ko.category),
  );

  return (
    <Tabs defaultValue={defaultTab} className="mt-4">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-transparent p-0">
        {buyerSidebarSections.map((section) => (
          <TabsTrigger
            key={section.id}
            value={section.id}
            className="min-h-10 flex-1 text-xs sm:text-sm"
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="features" className="mt-4 space-y-3">
        {context.features.length === 0 ? (
          <EmptyTab message="Feature details will appear as the property twin is built." />
        ) : (
          context.features.map((feature) => (
            <InfoItem key={feature.id} title={feature.name} description={feature.description} />
          ))
        )}
      </TabsContent>

      <TabsContent value="systems" className="mt-4 space-y-3">
        {context.systems.length === 0 ? (
          <EmptyTab message="System information not yet available." />
        ) : (
          context.systems.map((system) => (
            <InfoItem
              key={system.id}
              title={system.system_type.replace(/_/g, " ")}
              description={
                [system.manufacturer, system.age_years ? `${system.age_years} years` : null]
                  .filter(Boolean)
                  .join(" · ") || system.notes
              }
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="timeline" className="mt-4 space-y-3">
        <EmptyTab message="Property timeline events will appear from inspection and disclosure data." />
      </TabsContent>

      <TabsContent value="neighborhood" className="mt-4 space-y-3">
        {neighborhoodKo.length === 0 ? (
          <EmptyTab message="Neighborhood information coming soon." />
        ) : (
          neighborhoodKo.map((ko) => (
            <InfoItem key={ko.id} title={ko.name} description={ko.summary} />
          ))
        )}
      </TabsContent>

      <TabsContent value="schools" className="mt-4 space-y-3">
        {context.property.school_district ? (
          <InfoItem title="School District" description={context.property.school_district} />
        ) : (
          <EmptyTab message="School district information not yet available." />
        )}
      </TabsContent>

      <TabsContent value="utilities" className="mt-4 space-y-3">
        {utilityKo.length === 0 ? (
          <EmptyTab message="Utility information not yet available." />
        ) : (
          utilityKo.map((ko) => (
            <InfoItem key={ko.id} title={ko.name} description={ko.summary} />
          ))
        )}
      </TabsContent>

      <TabsContent value="documents" className="mt-4 space-y-3">
        {context.documents.length === 0 ? (
          <EmptyTab message="Documents will be available after the listing agent uploads them." />
        ) : (
          context.documents.map((doc) => (
            <InfoItem
              key={doc.id}
              title={doc.title}
              description={doc.document_type.replace(/_/g, " ")}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="agent" className="mt-4 space-y-4">
        <InfoItem title={agentName} description="Listing agent" />
        {agentPhone && (
          <Button variant="outline" className="w-full min-h-11 justify-start gap-2" asChild>
            <a href={`tel:${agentPhone}`}>
              <Phone className="size-4" aria-hidden />
              Call Agent
            </a>
          </Button>
        )}
        {agentEmail && (
          <Button variant="outline" className="w-full min-h-11 justify-start gap-2" asChild>
            <a href={`mailto:${agentEmail}`}>
              <Mail className="size-4" aria-hidden />
              Email Agent
            </a>
          </Button>
        )}
        <Button className="w-full min-h-11 justify-start gap-2" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <Calendar className="size-4" aria-hidden />
            Schedule Showing
          </Link>
        </Button>
      </TabsContent>
    </Tabs>
  );
}

function InfoItem({ title, description }: { title: string; description: string | null }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-medium capitalize text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}
