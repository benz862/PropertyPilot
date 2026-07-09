import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadCaptureForm } from "@/components/buyer/lead-capture-form";
import { Button } from "@/components/ui/button";
import { buyerRoutes } from "@/lib/navigation/routes";
import { getTourPropertyBySlug } from "@/lib/tour/get-tour-property";

export const dynamic = "force-dynamic";

interface TourLeadPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourLeadPage({ params }: TourLeadPageProps) {
  const { slug } = await params;
  const tour = await getTourPropertyBySlug(slug);

  if (!tour) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Before you go</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tour.property.street}, {tour.property.city}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <LeadCaptureForm slug={slug} propertyId={tour.property.id} />
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" asChild>
          <Link href={buyerRoutes.welcome(slug)}>Return to tour</Link>
        </Button>
      </div>
    </main>
  );
}
