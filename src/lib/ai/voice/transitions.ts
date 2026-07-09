import type { PointOfInterest, PropertyTwinContext } from "@/types/database";

export function suggestRoomTransition(
  context: PropertyTwinContext,
  currentPoiId: string | null,
): string | undefined {
  const pois = context.pointsOfInterest;
  if (pois.length < 2) return undefined;

  const currentIndex = currentPoiId
    ? pois.findIndex((poi) => poi.id === currentPoiId)
    : -1;

  const nextPoi =
    currentIndex >= 0 && currentIndex < pois.length - 1
      ? pois[currentIndex + 1]
      : pois.find((poi) => poi.id !== currentPoiId);

  if (!nextPoi) return undefined;

  const current = currentPoiId ? pois.find((poi) => poi.id === currentPoiId) : null;

  if (current?.subtitle) {
    return `${current.title} connects naturally to the ${nextPoi.title}. Would you like to continue there?`;
  }

  if (nextPoi.subtitle) {
    return `If you're nearby, the ${nextPoi.title} is one of the property's most distinctive areas — ${nextPoi.subtitle}.`;
  }

  return `Would you like to explore the ${nextPoi.title} next?`;
}

export function formatPoiWelcome(poi: PointOfInterest): string {
  if (poi.welcome_prompt) return poi.welcome_prompt;
  const subtitle = poi.subtitle ? ` ${poi.subtitle}.` : "";
  return `Welcome to the ${poi.title}.${subtitle} I'm here if you have any questions about this area.`;
}
