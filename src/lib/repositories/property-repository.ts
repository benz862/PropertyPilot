import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AiPolicy,
  Appliance,
  Database,
  Document,
  Feature,
  KnowledgeObject,
  Photo,
  PointOfInterest,
  Property,
  PropertyTwinContext,
  System,
  VoicePersonality,
} from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getPropertyBySlug(
  client: Client,
  slug: string,
): Promise<Property | null> {
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPropertyById(
  client: Client,
  propertyId: string,
): Promise<Property | null> {
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPropertiesByOwner(
  client: Client,
  ownerId: string,
): Promise<Property[]> {
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getKnowledgeObjects(
  client: Client,
  propertyId: string,
): Promise<KnowledgeObject[]> {
  const { data, error } = await client
    .from("knowledge_objects")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as KnowledgeObject[];
}

export async function getSystems(
  client: Client,
  propertyId: string,
): Promise<System[]> {
  const { data, error } = await client
    .from("systems")
    .select("*")
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAppliances(
  client: Client,
  propertyId: string,
): Promise<Appliance[]> {
  const { data, error } = await client
    .from("appliances")
    .select("*")
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDocuments(
  client: Client,
  propertyId: string,
): Promise<Document[]> {
  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPhotos(
  client: Client,
  propertyId: string,
): Promise<Photo[]> {
  const { data, error } = await client
    .from("photos")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPointsOfInterest(
  client: Client,
  propertyId: string,
): Promise<PointOfInterest[]> {
  const { data, error } = await client
    .from("points_of_interest")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFeaturesForProperty(
  client: Client,
  propertyId: string,
): Promise<Feature[]> {
  const { data: koData, error: koError } = await client
    .from("knowledge_objects")
    .select("id")
    .eq("property_id", propertyId);

  if (koError) throw new Error(koError.message);
  if (!koData?.length) return [];

  const koIds = koData.map((ko) => ko.id);
  const { data: linkData, error: linkError } = await client
    .from("knowledge_object_features")
    .select("feature_id")
    .in("knowledge_object_id", koIds);

  if (linkError) throw new Error(linkError.message);
  if (!linkData?.length) return [];

  const featureIds = Array.from(new Set(linkData.map((row) => row.feature_id)));
  const { data: features, error: featuresError } = await client
    .from("features")
    .select("*")
    .in("id", featureIds);

  if (featuresError) throw new Error(featuresError.message);
  return features ?? [];
}

export async function getVoicePersonality(
  client: Client,
  propertyId: string,
): Promise<VoicePersonality | null> {
  const { data, error } = await client
    .from("voice_personalities")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAiPolicy(
  client: Client,
  propertyId: string,
): Promise<AiPolicy | null> {
  const { data, error } = await client
    .from("ai_policies")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? { ...data, rules: data.rules as string[] } : null;
}

export async function loadPropertyTwinContext(
  client: Client,
  propertyId: string,
  currentPoiId?: string | null,
): Promise<PropertyTwinContext | null> {
  const property = await getPropertyById(client, propertyId);
  if (!property) return null;

  const [
    knowledgeObjects,
    systems,
    appliances,
    documents,
    photos,
    pointsOfInterest,
    voicePersonality,
    aiPolicy,
    features,
  ] = await Promise.all([
    getKnowledgeObjects(client, propertyId),
    getSystems(client, propertyId),
    getAppliances(client, propertyId),
    getDocuments(client, propertyId),
    getPhotos(client, propertyId),
    getPointsOfInterest(client, propertyId),
    getVoicePersonality(client, propertyId),
    getAiPolicy(client, propertyId),
    getFeaturesForProperty(client, propertyId),
  ]);

  const currentPoi =
    currentPoiId != null
      ? (pointsOfInterest.find((p) => p.id === currentPoiId) ?? null)
      : null;

  return {
    property,
    knowledgeObjects: knowledgeObjects as KnowledgeObject[],
    systems,
    appliances,
    features,
    documents,
    photos,
    pointsOfInterest,
    voicePersonality,
    aiPolicy,
    currentPoi,
  };
}
