import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import type { Database, Photo, Property, PropertyIntelligenceRow, PropertyRoom } from "@/types/database";

export const UNKNOWN_ANSWER =
  "I don't have that detail yet. I can send this question to the listing agent.";

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

interface KnowledgeChunk {
  source: string;
  text: string;
  roomName?: string | null;
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

  const [rooms, intelligenceResult, knowledgeObjects] = await Promise.all([
    listRooms(client, property.id),
    client
      .from("property_intelligence")
      .select("*")
      .eq("property_id", property.id)
      .maybeSingle(),
    client
      .from("knowledge_objects")
      .select("id, name, summary, category, verified_facts, confidence_level")
      .eq("property_id", property.id)
      .is("deleted_at", null),
  ]);

  const selectedRoom =
    rooms.find((room) => room.id === input.roomId) ??
    rooms.find((room) => room.name.toLowerCase() === input.selectedRoom.toLowerCase()) ??
    null;
  const chunks = buildKnowledgeChunks({
    property,
    rooms,
    selectedRoomName: selectedRoom?.name ?? input.selectedRoom,
    intelligence: intelligenceResult.data ?? null,
    knowledgeObjects: knowledgeObjects.data ?? [],
  });
  const ranked = rankChunks(chunks, input.question, selectedRoom?.name ?? input.selectedRoom);

  let answer = UNKNOWN_ANSWER;
  let confidence: AskRoomQuestionResult["confidence"] = "low";
  let needsAgentFollowup = true;

  if (ranked.length > 0) {
    answer = await answerFromChunks(input.question, selectedRoom?.name ?? input.selectedRoom, ranked);
    const topRanked = ranked[0];
    confidence = topRanked && topRanked.score >= 4 ? "high" : "medium";
    needsAgentFollowup = false;
  }

  const answeredFromSources = needsAgentFollowup
    ? []
    : ranked.slice(0, 4).map((item) => ({
        source: item.chunk.source,
        excerpt: item.chunk.text.slice(0, 240),
      }));

  const questionId = await logBuyerQuestion(client, property.id, {
    ...input,
    roomId: selectedRoom?.id ?? input.roomId ?? null,
    selectedRoom: selectedRoom?.name ?? input.selectedRoom,
    answer,
    confidence,
    answeredFromSources,
    needsAgentFollowup,
  });

  if (needsAgentFollowup && input.buyerEmail && input.buyerName) {
    await createLeadFromQuestion(client, property.id, input, questionId);
  }

  return {
    answer,
    confidence,
    needsAgentFollowup,
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
    property.id,
    {
      selectedRoom: question.selected_room ?? "Whole Property",
      question: question.question,
      inputType: "text",
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone ?? null,
    },
    input.questionId,
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

function buildKnowledgeChunks(input: {
  property: Property;
  rooms: PropertyRoom[];
  selectedRoomName: string;
  intelligence: PropertyIntelligenceRow | null;
  knowledgeObjects: Array<Record<string, unknown>>;
}): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const { property } = input;
  const manualFacts = [
    property.listing_price != null ? `Asking price: $${property.listing_price.toLocaleString()}` : null,
    property.bedrooms != null ? `Beds: ${property.bedrooms}` : null,
    property.bathrooms != null ? `Baths: ${property.bathrooms}` : null,
    property.finished_sq_ft != null ? `Square footage: ${property.finished_sq_ft}` : null,
    property.lot_size_sq_ft != null ? `Lot size: ${property.lot_size_sq_ft} sq ft` : null,
    property.year_built != null ? `Year built: ${property.year_built}` : null,
    property.school_district ? `School district: ${property.school_district}` : null,
    property.public_remarks,
    property.property_description,
  ].filter((item): item is string => Boolean(item));

  for (const fact of manualFacts) chunks.push({ source: "manual property field", text: fact });

  for (const room of input.rooms) {
    const mapped = mapRoom(room);
    const text = [
      mapped.description,
      ...mapped.features.map((item) => `Feature: ${item}`),
      ...mapped.updates.map((item) => `Update: ${item}`),
      ...mapped.includedItems.map((item) => `Included: ${item}`),
      ...mapped.talkingPoints.map((item) => `Talking point: ${item}`),
      ...mapped.cautions.map((item) => `Caution / do not overstate: ${item}`),
    ].filter(Boolean).join("\n");
    if (text) chunks.push({ source: `room:${mapped.name}`, text, roomName: mapped.name });
  }

  const intelligence = input.intelligence?.intelligence as Record<string, unknown> | undefined;
  if (intelligence) {
    addIntelligenceChunks(chunks, intelligence);
  }

  for (const object of input.knowledgeObjects) {
    const name = typeof object.name === "string" ? object.name : "Knowledge";
    const summary = typeof object.summary === "string" ? object.summary : null;
    if (summary) chunks.push({ source: `knowledge:${name}`, text: summary });
    const verifiedFacts = Array.isArray(object.verified_facts) ? object.verified_facts : [];
    for (const fact of verifiedFacts) {
      if (fact && typeof fact === "object" && "value" in fact) {
        chunks.push({ source: `knowledge:${name}`, text: String((fact as { value: unknown }).value) });
      }
    }
  }

  return chunks;
}

function addIntelligenceChunks(chunks: KnowledgeChunk[], intelligence: Record<string, unknown>) {
  const addList = (field: string, source: string) => {
    for (const item of stringArray(intelligence[field])) {
      chunks.push({ source, text: item });
    }
  };
  if (typeof intelligence.propertySummary === "string") {
    chunks.push({ source: "property intelligence:summary", text: intelligence.propertySummary });
  }
  addList("keyFeatures", "property intelligence:key feature");
  addList("upgrades", "property intelligence:upgrade");
  addList("exteriorFeatures", "property intelligence:exterior");
  addList("lotFeatures", "property intelligence:lot");
  addList("neighborhoodNotes", "property intelligence:neighborhood");

  if (Array.isArray(intelligence.rooms)) {
    for (const room of intelligence.rooms) {
      if (!room || typeof room !== "object") continue;
      const record = room as { name?: unknown; features?: unknown };
      const name = typeof record.name === "string" ? record.name : "Room";
      for (const feature of stringArray(record.features)) {
        chunks.push({ source: `property intelligence:${name}`, text: feature, roomName: name });
      }
    }
  }
}

function rankChunks(chunks: KnowledgeChunk[], question: string, selectedRoom: string) {
  const terms = tokenize(`${question} ${selectedRoom === "Whole Property" ? "" : selectedRoom}`);
  return chunks
    .map((chunk) => {
      const text = chunk.text.toLowerCase();
      const roomBoost =
        chunk.roomName && selectedRoom !== "Whole Property" && chunk.roomName.toLowerCase() === selectedRoom.toLowerCase()
          ? 3
          : 0;
      const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0) + roomBoost;
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

async function answerFromChunks(
  question: string,
  selectedRoom: string,
  ranked: Array<{ chunk: KnowledgeChunk; score: number }>,
): Promise<string> {
  const snippets = ranked.map((item, index) => `[${index + 1}] ${item.chunk.text}`).join("\n");
  const fallback = ranked[0]?.chunk.text ?? UNKNOWN_ANSWER;

  if (!env.openai.apiKey) {
    return fallback;
  }

  try {
    const client = new OpenAI({ apiKey: env.openai.apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "Answer buyer property questions using only the provided source snippets. If the snippets do not answer the question, reply exactly: I don't have that detail yet. I can send this question to the listing agent.",
        },
        {
          role: "user",
          content: `Selected room: ${selectedRoom}\nQuestion: ${question}\nSource snippets:\n${snippets}`,
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
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
  propertyId: string,
  input: AskRoomQuestionInput,
  questionId: string | null,
) {
  await client.from("leads").insert({
    property_id: propertyId,
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
  });
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

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length > 2 && !["the", "and", "for", "this", "that", "about", "what", "how"].includes(term)),
    ),
  );
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
