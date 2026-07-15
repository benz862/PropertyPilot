import type { SupabaseClient } from "@supabase/supabase-js";

import { GhlService, type GhlLeadPayload } from "@/services/crm/ghl.service";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface BuyerLeadSyncInput {
  propertyId: string;
  propertyAddress: string;
  selectedRoom: string;
  question: string;
  answer: string;
  needsAgentFollowup: boolean;
  requestedFeatureSheet: boolean;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  leadId?: string;
}

export interface BuyerLeadSyncResult {
  synced: boolean;
  skipped: boolean;
  contactId: string | null;
  opportunityId: string | null;
  taskCreated: boolean;
  tags: string[];
  error: string | null;
}

/**
 * GHLSyncService — the ONLY place GoHighLevel logic lives. It syncs contacts,
 * tags, notes, and tasks for PropertyPilot buyer leads. It never throws; a GHL
 * failure must never break local lead capture.
 */
export class GHLSyncService {
  private readonly ghl: GhlService;

  constructor(client: Client, ghl?: GhlService) {
    this.ghl = ghl ?? new GhlService(client);
  }

  isConfigured(): boolean {
    return this.ghl.isConfigured();
  }

  async syncBuyerLead(input: BuyerLeadSyncInput): Promise<BuyerLeadSyncResult> {
    const tags = buildBuyerTags(input);

    if (!this.ghl.isConfigured()) {
      return { synced: false, skipped: true, contactId: null, opportunityId: null, taskCreated: false, tags, error: null };
    }

    try {
      const { firstName, lastName } = splitName(input.buyerName);
      const payload: GhlLeadPayload = {
        leadId: input.leadId,
        propertyId: input.propertyId,
        propertyAddress: input.propertyAddress,
        firstName,
        lastName,
        email: input.buyerEmail,
        phone: input.buyerPhone,
        buyerIntentScore: null,
        buyerInterests: [input.selectedRoom].filter(Boolean),
        buyerConcerns: [],
        brochureRequested: input.requestedFeatureSheet,
        showingRequested: false,
        aiConversationSummary: null,
      };

      const contact = await this.ghl.createOrUpdateContact(payload);
      await this.ghl.addContactTags(contact.contactId, tags);
      await this.ghl.addContactNoteText(contact.contactId, buildNote(input));

      const opportunity = await this.ghl.createOpportunity(contact.contactId, payload);

      let taskCreated = false;
      if (input.needsAgentFollowup) {
        await this.ghl.createContactTask(contact.contactId, {
          title: "Answer PropertyPilot buyer question",
          body: buildTaskBody(input),
        });
        taskCreated = true;
      }

      return {
        synced: true,
        skipped: false,
        contactId: contact.contactId,
        opportunityId: opportunity.opportunityId,
        taskCreated,
        tags,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "GHL sync failed";
      return { synced: false, skipped: false, contactId: null, opportunityId: null, taskCreated: false, tags, error: message };
    }
  }
}

export function createGHLSyncService(client: Client, ghl?: GhlService): GHLSyncService {
  return new GHLSyncService(client, ghl);
}

export function buildBuyerTags(
  input: Pick<BuyerLeadSyncInput, "propertyAddress" | "selectedRoom" | "requestedFeatureSheet">,
): string[] {
  return [
    "PropertyPilot",
    "QR Tour",
    `Property: ${input.propertyAddress}`,
    `Room: ${input.selectedRoom}`,
    ...(input.requestedFeatureSheet ? ["Feature Sheet Requested"] : []),
  ];
}

function buildNote(input: BuyerLeadSyncInput): string {
  return [
    "PropertyPilot QR Tour Lead",
    "",
    `Property: ${input.propertyAddress}`,
    `Room: ${input.selectedRoom}`,
    `Question: ${input.question}`,
    `AI Answer: ${input.answer}`,
    `Needs follow-up: ${input.needsAgentFollowup ? "true" : "false"}`,
    `Feature sheet requested: ${input.requestedFeatureSheet ? "true" : "false"}`,
  ].join("\n");
}

function buildTaskBody(input: BuyerLeadSyncInput): string {
  return [
    `Property: ${input.propertyAddress}`,
    `Room: ${input.selectedRoom}`,
    `Question: ${input.question}`,
    input.buyerName ? `Buyer: ${input.buyerName}` : null,
    input.buyerEmail ? `Email: ${input.buyerEmail}` : null,
    input.buyerPhone ? `Phone: ${input.buyerPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  if (!name) return { firstName: null, lastName: null };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null };
  return { firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") };
}
