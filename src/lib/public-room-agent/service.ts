import type { SupabaseClient } from "@supabase/supabase-js";

import { createBuyerActivityService } from "@/lib/property-dna/buyer-activity";
import { createGHLSyncService } from "@/lib/property-dna/ghl-sync";
import { answerQuestionFromDNA, UNKNOWN_ANSWER } from "@/lib/property-dna/question-answering";
import { createPropertyDNAService } from "@/lib/property-dna/service";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import type { Database, Photo, Property, PropertyRoom } from "@/types/database";

export { UNKNOWN_ANSWER };

const DEFAULT_ROOMS = [
  "Whole Property",
  "Kitchen",
  "Living Room",
  "Primary Bedroom",
  "Bathroom",
  "Basement",
  "Garage",
  "Backyard",
  "Exterior",
  "Neighborhood",
];

type Client = SupabaseClient<Database>;

export interface PublicRoom {
  id: string | null;
  name: string;
  description: string | null;
  features: string[];
  updates: string[];
  includedItems: string[];
  talkingPoints: string[];
  cautions: string[];
}

export interface PublicPropertyPayload {
  id: string;
  slug: string;
  address: string;
  price: number | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  description: string | null;
  summary: string;
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  heroImageUrl: string | null;
  rooms: PublicRoom[];
}

export interface AskRoomQuestionInput {
  roomId?: string | null;
  selectedRoom: string;
  question: string;
  inputType: "voice" | "text";
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  userAgent?: string | null;
}

export interface AskRoomQuestionResult {
  answer: string;
  confidence: "high" | "medium" | "low";
  needsAgentFollowup: boolean;
  answeredFromSources: Array<{ source: string; excerpt: string }>;
  questionId: string | null;
}

export interface AttachLeadToQuestionInput {
  questionId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
}

export async function getPublicPropertyBySlugOrId(
  client: Client,
  slugOrId: string,
): Promise<PublicPropertyPayload | null> {
  const property = await findProperty(client, slugOrId);
  if (!property) return null;

  const [rooms, photos, profile] = await Promise.all([
    listRooms(client, property.id),
    listPhotos(client, property.id),
    property.owner_id
      ? client.from("profiles").select("email, phone").eq("id", property.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const primaryPhoto = photos.find((photo) => photo.is_primary) ?? photos[0] ?? null;
  const heroImageUrl = primaryPhoto ? getPhotoPublicUrl(primaryPhoto) : null;
  const publicRooms = mergeDefaultRooms(rooms);

  return {
    id: property.id,
    slug: property.slug,
    address: formatAddress(property),
    price: property.listing_price,
    beds: property.bedrooms,
    baths: property.bathrooms,
    squareFeet: property.finished_sq_ft,
    lotSize: property.lot_size_sq_ft,
    yearBuilt: property.year_built,
    description: property.public_remarks ?? property.property_description ?? null,
    summary: buildSummary(property),
    agentName: property.agent_name ?? null,
    agentEmail: profile.data?.email ?? null,
    agentPhone: profile.data?.phone ?? null,
    heroImageUrl,
    rooms: publicRooms,
  };
}

export async function askRoomQuestion(
  client: Client,
  slugOrId: string,
  input: AskRoomQuestionInput,
): Promise<AskRoomQuestionResult> {
  const property = await findProperty(client, slugOrId);
  if (!property) {
    throw new Error("Property not found");
  }

  const dnaService = createPropertyDNAService(client);
  const dna = await dnaService.getPropertyDNA(property.id);
  if (!dna) {
    throw new Error("Property not found");
  }

  const matchedRoom =
    dna.rooms.find((room) => room.id === input.roomId) ??
    dna.rooms.find((room) => room.name.toLowerCase() === input.selectedRoom.toLowerCase()) ??
    null;
  const selectedRoom = matchedRoom?.name ?? input.selectedRoom;

  const qa = answerQuestionFromDNA(dna, {
    selectedRoom,
    question: input.question,
  });

  const answeredFromSources = qa.answeredFromSources;
  const activity = createBuyerActivityService(client);

  await activity.recordEvent({
    propertyId: property.id,
    type: "question_asked",
    room: selectedRoom,
    metadata: { inputType: input.inputType },
  });

  if (qa.needsAgentFollowup) {
    await activity.recordEvent({
      propertyId: property.id,
      type: "unknown_question",
      room: selectedRoom,
      metadata: { question: input.question },
    });
  } else {
    await activity.recordEvent({
      propertyId: property.id,
      type: "answer_returned",
      room: selectedRoom,
      metadata: { confidence: qa.confidence },
    });
  }

  const questionId = await logBuyerQuestion(client, property.id, {
    ...input,
    roomId: matchedRoom?.id ?? input.roomId ?? null,
    selectedRoom,
    answer: qa.answer,
    confidence: qa.confidence,
    answeredFromSources,
    needsAgentFollowup: qa.needsAgentFollowup,
  });

  if (qa.needsAgentFollowup && input.buyerEmail && input.buyerName) {
    await createLeadFromQuestion(client, property, input, questionId, {
      answer: qa.answer,
      needsAgentFollowup: qa.needsAgentFollowup,
    });
  }

  return {
    answer: qa.answer,
    confidence: qa.confidence,
    needsAgentFollowup: qa.needsAgentFollowup,
    answeredFromSources,
    questionId,
  };
}

export async function attachLeadToQuestion(
  client: Client,
  slugOrId: string,
  input: AttachLeadToQuestionInput,
): Promise<{ saved: true }> {
  const property = await findProperty(client, slugOrId);
  if (!property) throw new Error("Property not found");

  const { data: question, error: questionError } = await client
    .from("buyer_questions")
    .select("id, question, selected_room")
    .eq("id", input.questionId)
    .eq("property_id", property.id)
    .maybeSingle();

  if (questionError) throw new Error(questionError.message);
  if (!question) throw new Error("Question not found");

  await client
    .from("buyer_questions")
    .update({
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone ?? null,
    })
    .eq("id", input.questionId)
    .eq("property_id", property.id);

  await createLeadFromQuestion(
    client,
    property,
    {
      selectedRoom: question.selected_room ?? "Whole Property",
      question: question.question,
      inputType: "text",
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone ?? null,
    },
    input.questionId,
    { needsAgentFollowup: true },
  );

  return { saved: true };
}

async function findProperty(client: Client, slugOrId: string): Promise<Property | null> {
  const query = client.from("properties").select("*").is("deleted_at", null);
  const { data, error } = await (isUuid(slugOrId)
    ? query.eq("id", slugOrId).maybeSingle()
    : query.eq("slug", slugOrId).maybeSingle());
  if (error) throw new Error(error.message);
  return data;
}

async function listRooms(client: Client, propertyId: string): Promise<PropertyRoom[]> {
  const { data, error } = await client
    .from("property_rooms")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function listPhotos(client: Client, propertyId: string): Promise<Photo[]> {
  const { data, error } = await client
    .from("photos")
    .select("*")
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .order("display_order");
  if (error) return [];
  return data ?? [];
}

function mergeDefaultRooms(rooms: PropertyRoom[]): PublicRoom[] {
  const mapped = rooms.map(mapRoom);
  const existing = new Set(mapped.map((room) => room.name.toLowerCase()));
  const defaults = DEFAULT_ROOMS.filter((room) => !existing.has(room.toLowerCase())).map((name) => ({
    id: null,
    name,
    description: null,
    features: [],
    updates: [],
    includedItems: [],
    talkingPoints: [],
    cautions: [],
  }));
  return [...defaults.slice(0, 1), ...mapped, ...defaults.slice(1)];
}

function mapRoom(room: PropertyRoom): PublicRoom {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    features: stringArray(room.features),
    updates: stringArray(room.updates),
    includedItems: stringArray(room.included_items),
    talkingPoints: stringArray(room.talking_points),
    cautions: stringArray(room.cautions),
  };
}


async function logBuyerQuestion(
  client: Client,
  propertyId: string,
  input: AskRoomQuestionInput & {
    roomId: string | null;
    answer: string;
    confidence: string;
    answeredFromSources: Array<{ source: string; excerpt: string }>;
    needsAgentFollowup: boolean;
  },
): Promise<string | null> {
  const { data, error } = await client
    .from("buyer_questions")
    .insert({
      property_id: propertyId,
      room_id: input.roomId,
      selected_room: input.selectedRoom,
      question: input.question,
      normalized_question: input.question.trim().toLowerCase(),
      answer: input.answer,
      confidence: input.confidence,
      answered_from_sources: input.answeredFromSources,
      needs_agent_followup: input.needsAgentFollowup,
      buyer_name: input.buyerName ?? null,
      buyer_email: input.buyerEmail ?? null,
      buyer_phone: input.buyerPhone ?? null,
      input_type: input.inputType,
      user_agent: input.userAgent ?? null,
      status: input.needsAgentFollowup ? "needs_review" : "answered",
      intent: input.roomId ? "room_question" : "property_question",
      metadata: { mvp: "qr_room_voice_agent" },
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id;
}

async function createLeadFromQuestion(
  client: Client,
  property: Property,
  input: AskRoomQuestionInput,
  questionId: string | null,
  extras: { answer?: string; needsAgentFollowup?: boolean } = {},
) {
  const { data: lead } = await client
    .from("leads")
    .insert({
      property_id: property.id,
      name: input.buyerName ?? null,
      email: input.buyerEmail ?? null,
      phone: input.buyerPhone ?? null,
      consent_given: true,
      requested_pdf: false,
      requested_showing: false,
      notes: [`Room: ${input.selectedRoom}`, `Question: ${input.question}`, questionId ? `Question ID: ${questionId}` : null]
        .filter(Boolean)
        .join("\n"),
      crm_status: "new",
    })
    .select("id")
    .maybeSingle();

  const activity = createBuyerActivityService(client);
  await activity.recordEvent({
    propertyId: property.id,
    type: "lead_submitted",
    room: input.selectedRoom,
  });

  // GHL is isolated: syncing a lead must never break local capture.
  try {
    const ghl = createGHLSyncService(client);
    if (ghl.isConfigured()) {
      await ghl.syncBuyerLead({
        propertyId: property.id,
        propertyAddress: formatAddress(property),
        selectedRoom: input.selectedRoom,
        question: input.question,
        answer: extras.answer ?? "",
        needsAgentFollowup: extras.needsAgentFollowup ?? true,
        buyerName: input.buyerName ?? null,
        buyerEmail: input.buyerEmail ?? null,
        buyerPhone: input.buyerPhone ?? null,
        leadId: lead?.id,
      });
    }
  } catch {
    // best-effort GHL sync
  }
}

function formatAddress(property: Property): string {
  return `${property.street}, ${property.city}, ${property.province_state}`;
}

function buildSummary(property: Property): string {
  if (property.property_description) return property.property_description;
  if (property.public_remarks) return property.public_remarks;
  return [
    formatAddress(property),
    property.bedrooms != null && property.bathrooms != null ? `${property.bedrooms} bed / ${property.bathrooms} bath` : null,
    property.finished_sq_ft != null ? `${property.finished_sq_ft.toLocaleString()} sq ft` : null,
  ].filter(Boolean).join(" · ");
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
