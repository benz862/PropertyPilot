import {
  getPointsOfInterest,
  getPropertyBySlug,
  loadPropertyTwinContext,
} from "@/lib/repositories/property-repository";
import { env } from "@/lib/env";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import { createClient } from "@/lib/supabase/server";
import type { PointOfInterest, Property, PropertyTwinContext } from "@/types/database";

export interface TourPropertyData {
  property: Property;
  context: PropertyTwinContext;
  pois: PointOfInterest[];
  heroImageUrl: string | null;
  agentName: string;
  agentPhotoUrl: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  welcomeMessage: string;
  aiGuideIntro: string;
}

const DEFAULT_AI_GUIDE_INTRO =
  "Welcome to the property. I'm your PropertyPilot guide. I'll answer questions as you explore the home. You can begin anywhere, and you can ask me about any part of the property at any time.";

export async function getTourPropertyBySlug(
  slug: string,
): Promise<TourPropertyData | null> {
  if (!env.supabase.url || !env.supabase.anonKey) {
    return null;
  }

  const client = await createClient();
  const property = await getPropertyBySlug(client, slug);

  if (!property || property.deleted_at) {
    return null;
  }

  const context = await loadPropertyTwinContext(client, property.id);
  if (!context) {
    return null;
  }

  const pois = await getPointsOfInterest(client, property.id);
  const primaryPhoto = context.photos.find((photo) => photo.is_primary);
  const fallbackPhoto = context.photos[0];
  const heroImageUrl =
    (primaryPhoto ? getPhotoPublicUrl(primaryPhoto) : null) ??
    (fallbackPhoto ? getPhotoPublicUrl(fallbackPhoto) : null);

  let agentPhotoUrl: string | null = null;
  let agentPhone: string | null = null;
  let agentEmail: string | null = null;

  if (property.owner_id) {
    const { data: profile } = await client
      .from("profiles")
      .select("photo_url, phone, email")
      .eq("id", property.owner_id)
      .maybeSingle();

    if (profile) {
      agentPhotoUrl = profile.photo_url;
      agentPhone = profile.phone;
      agentEmail = profile.email;
    }
  }

  return {
    property,
    context,
    pois,
    heroImageUrl,
    agentName: property.agent_name ?? "Your Listing Agent",
    agentPhotoUrl,
    agentPhone,
    agentEmail,
    welcomeMessage:
      context.voicePersonality?.greeting ??
      `Welcome to ${property.street}. Take a private AI-guided tour — ask questions naturally as you explore.`,
    aiGuideIntro: context.voicePersonality?.greeting ?? DEFAULT_AI_GUIDE_INTRO,
  };
}

export function getPhotosForPoi(
  context: PropertyTwinContext,
  poiId?: string,
): Array<{ id: string; url: string | null; caption: string | null }> {
  if (!poiId) {
    return context.photos.map((photo) => ({
      id: photo.id,
      url: getPhotoPublicUrl(photo),
      caption: photo.caption,
    }));
  }

  const roomMatch = context.photos.filter(
    (photo) =>
      photo.detected_room?.toLowerCase().includes(poiId.toLowerCase()) ||
      photo.tags.some((tag) => tag.toLowerCase().includes(poiId.toLowerCase())),
  );

  const photos = roomMatch.length > 0 ? roomMatch : context.photos.slice(0, 6);
  return photos.map((photo) => ({
    id: photo.id,
    url: getPhotoPublicUrl(photo),
    caption: photo.caption,
  }));
}
