import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AiGuideIntro } from "@/components/buyer/ai-guide-intro";
import { Button } from "@/components/ui/button";
import { buyerRoutes } from "@/lib/navigation/routes";
import { getTourPropertyBySlug } from "@/lib/tour/get-tour-property";

export const dynamic = "force-dynamic";

interface TourWelcomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourWelcomePage({ params }: TourWelcomePageProps) {
  const { slug } = await params;
  const tour = await getTourPropertyBySlug(slug);

  if (!tour) {
    notFound();
  }

  const { property, heroImageUrl, agentName, agentPhotoUrl, welcomeMessage, aiGuideIntro } = tour;
  const address = `${property.street}, ${property.city}, ${property.province_state}`;

  return (
    <main className="min-h-screen">
      <div className="relative aspect-[16/10] w-full bg-secondary sm:aspect-[16/9]">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={address}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full min-h-[40vh] items-center justify-center text-muted-foreground">
            {address}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="relative -mt-24 mx-auto max-w-lg px-4 pb-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          <div className="flex items-center gap-3">
            {agentPhotoUrl ? (
              <Image
                src={agentPhotoUrl}
                alt={agentName}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {agentName.charAt(0)}
              </div>
            )}
            <p className="text-sm font-medium text-muted-foreground">{agentName}</p>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
            {address}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {welcomeMessage}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" className="min-h-12 text-base" asChild>
              <Link href={buyerRoutes.start(slug)}>Start My Tour</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-h-12 text-base" asChild>
              <Link href={`${buyerRoutes.start(slug)}#browse`}>Browse Property</Link>
            </Button>
            <div className="text-center">
              <AiGuideIntro intro={aiGuideIntro} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
