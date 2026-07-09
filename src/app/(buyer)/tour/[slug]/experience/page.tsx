import { notFound } from "next/navigation";

import { TourExperienceClient } from "@/components/buyer/tour-experience-client";
import { defaultTourAreas } from "@/lib/navigation/routes";
import { getPhotosForPoi, getTourPropertyBySlug } from "@/lib/tour/get-tour-property";

export const dynamic = "force-dynamic";

interface TourExperiencePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ poi?: string }>;
}

export default async function TourExperiencePage({
  params,
  searchParams,
}: TourExperiencePageProps) {
  const { slug } = await params;
  const { poi: poiId } = await searchParams;
  const tour = await getTourPropertyBySlug(slug);

  if (!tour) {
    notFound();
  }

  const selectedPoi = poiId
    ? tour.pois.find((poi) => poi.id === poiId)
    : tour.pois[0];

  const defaultArea = defaultTourAreas.find((area) => area.id === poiId);

  const areaTitle = selectedPoi?.title ?? defaultArea?.title ?? "Property Tour";
  const welcomePrompt = selectedPoi?.welcome_prompt
    ? `You've selected the ${selectedPoi.title}. ${selectedPoi.welcome_prompt}`
    : defaultArea
      ? `You've selected the ${defaultArea.title}. ${defaultArea.description}.`
      : `Welcome to ${tour.property.street}. I'm here to help you explore every detail of this home.`;

  const photos = getPhotosForPoi(tour.context, poiId ?? defaultArea?.id);

  return (
    <TourExperienceClient
      slug={slug}
      propertyId={tour.property.id}
      agentName={tour.agentName}
      agentPhone={tour.agentPhone}
      agentEmail={tour.agentEmail}
      areaTitle={areaTitle}
      welcomePrompt={`${welcomePrompt} I'm here when you're ready — just ask.`}
      poiId={poiId}
      context={tour.context}
      photos={photos}
    />
  );
}
