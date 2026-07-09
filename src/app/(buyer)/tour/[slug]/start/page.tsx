import { notFound } from "next/navigation";

import { TourAreaCard } from "@/components/buyer/tour-area-card";
import { defaultTourAreas } from "@/lib/navigation/routes";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import { getTourPropertyBySlug } from "@/lib/tour/get-tour-property";

export const dynamic = "force-dynamic";

interface TourStartPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TourStartPage({ params }: TourStartPageProps) {
  const { slug } = await params;
  const tour = await getTourPropertyBySlug(slug);

  if (!tour) {
    notFound();
  }

  const areas =
    tour.pois.length > 0
      ? tour.pois.map((poi) => ({
          id: poi.id,
          title: poi.title,
          description: poi.subtitle ?? poi.welcome_prompt ?? "Explore this area of the home",
          estimatedMinutes: poi.estimated_viewing_minutes ?? 2,
          imageUrl: poi.thumbnail_url,
        }))
      : defaultTourAreas.map((area) => {
          const matchingPhoto = tour.context.photos.find(
            (photo) =>
              photo.detected_room?.toLowerCase().includes(area.id.replace("-", " ")) ||
              photo.tags.some((tag) => tag.toLowerCase().includes(area.id.replace("-", " "))),
          );
          return {
            id: area.id,
            title: area.title,
            description: area.description,
            estimatedMinutes: area.estimatedMinutes,
            imageUrl: matchingPhoto ? getPhotoPublicUrl(matchingPhoto) : null,
          };
        });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-normal text-foreground">
          Where would you like to begin?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Choose an area to start your self-guided tour of {tour.property.street}.
        </p>
      </div>

      <div
        id="browse"
        className="mt-10 grid gap-6 sm:grid-cols-2"
        role="list"
        aria-label="Tour starting areas"
      >
        {areas.map((area) => (
          <TourAreaCard
            key={area.id}
            slug={slug}
            id={area.id}
            title={area.title}
            description={area.description}
            estimatedMinutes={area.estimatedMinutes}
            imageUrl={area.imageUrl}
            accessible={area.id === "primary-suite" || area.title.toLowerCase().includes("main")}
          />
        ))}
      </div>
    </main>
  );
}
