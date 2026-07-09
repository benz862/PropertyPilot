import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, FileText, Globe, Phone, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buyerRoutes } from "@/lib/navigation/routes";
import { getTourPropertyBySlug } from "@/lib/tour/get-tour-property";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

interface TourThanksPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourThanksPage({ params }: TourThanksPageProps) {
  const { slug } = await params;
  const tour = await getTourPropertyBySlug(slug);

  if (!tour) {
    notFound();
  }

  const agentPhone = tour.agentPhone;

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <FileText className="size-8" aria-hidden />
      </div>

      <h1 className="mt-6 text-3xl font-bold text-foreground">Thank you</h1>
      <p className="mt-3 text-muted-foreground">
        Your property guide is on its way. We hope the tour was helpful.
      </p>

      <div className="mt-10 grid gap-3">
        <Button size="lg" className="min-h-12 justify-start gap-3" asChild>
          <Link href={buyerRoutes.start(slug)}>
            Continue Tour
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="min-h-12 justify-start gap-3" asChild>
          <Link href={buyerRoutes.lead(slug)}>
            <Calendar className="size-5" aria-hidden />
            Schedule Showing
          </Link>
        </Button>
        {agentPhone ? (
          <Button size="lg" variant="outline" className="min-h-12 justify-start gap-3" asChild>
            <a href={`tel:${agentPhone}`}>
              <Phone className="size-5" aria-hidden />
              Call Listing Agent
            </a>
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="min-h-12 justify-start gap-3" asChild>
            <Link href={buyerRoutes.lead(slug)}>
              <Phone className="size-5" aria-hidden />
              Contact Agent
            </Link>
          </Button>
        )}
        <Button size="lg" variant="outline" className="min-h-12 justify-start gap-3" asChild>
          <Link href={siteConfig.url}>
            <Globe className="size-5" aria-hidden />
            Visit Website
          </Link>
        </Button>
        <Button size="lg" variant="ghost" className="min-h-12 justify-start gap-3" asChild>
          <Link href={buyerRoutes.start(slug)}>
            <RotateCcw className="size-5" aria-hidden />
            Restart Tour
          </Link>
        </Button>
      </div>
    </main>
  );
}
