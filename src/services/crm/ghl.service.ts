import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database, Json } from "@/types/database";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "v3";
const DEFAULT_GHL_TAGS = ["PropertyPilot", "AI Tour Lead"] as const;

export interface GhlLeadPayload {
  leadId?: string;
  propertyId: string;
  propertyAddress: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  buyerIntentScore: number | null;
  buyerInterests: string[];
  buyerConcerns: string[];
  brochureRequested: boolean;
  showingRequested: boolean;
  aiConversationSummary: string | null;
}

export interface GhlContactResult {
  contactId: string;
  raw: Json;
}

export interface GhlOpportunityResult {
  opportunityId: string | null;
  raw: Json;
  skipped?: boolean;
}

export interface GhlSyncResult {
  success: boolean;
  contactId: string | null;
  opportunityId: string | null;
  error: string | null;
  tags: string[];
}

interface GhlServiceOptions {
  token?: string;
  locationId?: string;
  fetchImpl?: typeof fetch;
}

interface CrmConnectionRow {
  id: string;
  provider: string;
  auth_type: string;
  profile_id: string | null;
  organization_id: string | null;
  location_id: string;
  status: string;
}

type CrmDatabase = {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      crm_connections: {
        Row: CrmConnectionRow;
        Insert: Partial<CrmConnectionRow> & Record<string, unknown>;
        Update: Partial<CrmConnectionRow> & Record<string, unknown>;
        Relationships: [];
      };
      crm_sync_events: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
  };
};

export class GhlService {
  private readonly token: string | undefined;
  private readonly locationId: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly crmClient: SupabaseClient<CrmDatabase>;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    options: GhlServiceOptions = {},
  ) {
    this.token = options.token ?? env.ghl.privateIntegrationToken;
    this.locationId = options.locationId ?? env.ghl.locationId;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.crmClient = supabase as unknown as SupabaseClient<CrmDatabase>;
  }

  isConfigured(): boolean {
    return Boolean(this.token && this.locationId);
  }

  async createOrUpdateContact(lead: GhlLeadPayload): Promise<GhlContactResult> {
    this.requireConfiguration();

    const body = compactObject({
      locationId: this.locationId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || undefined,
      email: lead.email,
      phone: lead.phone,
      source: "PropertyPilot AI Tour",
    });

    const response = await this.request<Json>("/contacts/upsert", {
      method: "POST",
      body,
    });

    const contactId = extractId(response, ["contact.id", "contactId", "id"]);
    if (!contactId) {
      throw new Error("GHL contact upsert succeeded without a contact id");
    }

    return { contactId, raw: response };
  }

  async addContactTags(contactId: string, tags: string[]): Promise<Json> {
    this.requireConfiguration();
    if (tags.length === 0) return {};

    return this.request<Json>(`/contacts/${contactId}/tags`, {
      method: "POST",
      body: { tags },
    });
  }

  async createOpportunity(
    contactId: string,
    lead: GhlLeadPayload,
  ): Promise<GhlOpportunityResult> {
    this.requireConfiguration();

    const pipelineId = process.env.GHL_PIPELINE_ID;
    const stageId = process.env.GHL_PIPELINE_STAGE_ID;

    if (!pipelineId || !stageId) {
      return {
        opportunityId: null,
        raw: { skipped: true, reason: "GHL_PIPELINE_ID and GHL_PIPELINE_STAGE_ID are not configured" },
        skipped: true,
      };
    }

    const response = await this.request<Json>("/opportunities/", {
      method: "POST",
      body: compactObject({
        locationId: this.locationId,
        contactId,
        pipelineId,
        pipelineStageId: stageId,
        name: `PropertyPilot Lead - ${lead.propertyAddress}`,
        status: "open",
        monetaryValue: 0,
      }),
    });

    return {
      opportunityId: extractId(response, ["opportunity.id", "opportunityId", "id"]),
      raw: response,
    };
  }

  async addContactNote(contactId: string, lead: GhlLeadPayload): Promise<Json> {
    this.requireConfiguration();

    return this.request<Json>(`/contacts/${contactId}/notes`, {
      method: "POST",
      body: { body: buildLeadNote(lead) },
    });
  }

  async addContactNoteText(contactId: string, body: string): Promise<Json> {
    this.requireConfiguration();

    return this.request<Json>(`/contacts/${contactId}/notes`, {
      method: "POST",
      body: { body },
    });
  }

  async createContactTask(
    contactId: string,
    task: { title: string; body?: string; dueDate?: string },
  ): Promise<Json> {
    this.requireConfiguration();

    return this.request<Json>(`/contacts/${contactId}/tasks`, {
      method: "POST",
      body: compactObject({
        title: task.title,
        body: task.body,
        dueDate: task.dueDate,
        completed: false,
      }),
    });
  }

  async syncLeadToGHL(lead: GhlLeadPayload): Promise<GhlSyncResult> {
    const tags = buildTags(lead);
    const connection = await this.ensureConnection();

    try {
      const contact = await this.createOrUpdateContact(lead);
      await this.addContactTags(contact.contactId, tags);
      const opportunity = await this.createOpportunity(contact.contactId, lead);
      await this.addContactNote(contact.contactId, lead);

      await this.logSync({
        connectionId: connection?.id ?? null,
        lead,
        status: "success",
        contactId: contact.contactId,
        opportunityId: opportunity.opportunityId,
        requestPayload: toJson({ lead, tags }),
        responsePayload: toJson({
          contact: contact.raw,
          opportunity: opportunity.raw,
        }),
        error: null,
      });

      return {
        success: true,
        contactId: contact.contactId,
        opportunityId: opportunity.opportunityId,
        error: null,
        tags,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "GHL sync failed";
      await this.logSync({
        connectionId: connection?.id ?? null,
        lead,
        status: "failed",
        contactId: null,
        opportunityId: null,
        requestPayload: toJson({ lead, tags }),
        responsePayload: {},
        error: message,
      });

      return {
        success: false,
        contactId: null,
        opportunityId: null,
        error: message,
        tags,
      };
    }
  }

  private async ensureConnection(): Promise<CrmConnectionRow | null> {
    if (!this.locationId) return null;

    try {
      const { data } = await this.crmClient
        .from("crm_connections")
        .upsert(
          {
            provider: "gohighlevel",
            auth_type: "private_token",
            location_id: this.locationId,
            status: this.isConfigured() ? "active" : "error",
            last_sync_status: "pending",
            last_sync_error: this.isConfigured() ? null : "Missing GHL private token or location id",
            metadata: { source: "env_private_token" },
          },
          { onConflict: "provider,location_id,profile_id" },
        )
        .select("id, provider, auth_type, profile_id, organization_id, location_id, status")
        .maybeSingle();

      return (data as CrmConnectionRow | null) ?? null;
    } catch {
      return null;
    }
  }

  private async logSync(input: {
    connectionId: string | null;
    lead: GhlLeadPayload;
    status: "success" | "failed";
    contactId: string | null;
    opportunityId: string | null;
    requestPayload: Json;
    responsePayload: Json;
    error: string | null;
  }) {
    try {
      await this.crmClient.from("crm_sync_events").insert({
        connection_id: input.connectionId,
        lead_id: input.lead.leadId ?? null,
        provider: "gohighlevel",
        event_type: "lead_sync",
        status: input.status,
        external_contact_id: input.contactId,
        external_opportunity_id: input.opportunityId,
        request_payload: input.requestPayload,
        response_payload: input.responsePayload,
        error: input.error,
        processed_at: new Date().toISOString(),
      });

      if (input.connectionId) {
        await this.crmClient
          .from("crm_connections")
          .update({
            last_sync_status: input.status,
            last_sync_at: new Date().toISOString(),
            last_sync_error: input.error,
          })
          .eq("id", input.connectionId);
      }

      if (input.lead.leadId) {
        await this.supabase
          .from("leads")
          .update({
            crm_provider: "gohighlevel",
            crm_status: input.status === "success" ? "contacted" : "new",
            crm_external_contact_id: input.contactId,
            crm_external_opportunity_id: input.opportunityId,
            crm_last_sync_at: new Date().toISOString(),
            crm_last_sync_error: input.error,
          })
          .eq("id", input.lead.leadId);
      }
    } catch {
      // CRM logging is best effort; lead capture must never fail because GHL failed.
    }
  }

  private async request<T>(path: string, init: { method: string; body?: Record<string, unknown> }) {
    this.requireConfiguration();

    const response = await this.fetchImpl(`${GHL_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok) {
      throw new Error(
        `GHL ${init.method} ${path} failed (${response.status}): ${extractErrorMessage(payload, text)}`,
      );
    }

    return payload as T;
  }

  private requireConfiguration() {
    if (!this.token) {
      throw new Error("Missing GHL_PRIVATE_INTEGRATION_TOKEN");
    }

    if (!this.locationId) {
      throw new Error("Missing GHL_LOCATION_ID");
    }
  }
}

export function buildTags(lead: Pick<GhlLeadPayload, "brochureRequested" | "showingRequested">) {
  return [
    ...DEFAULT_GHL_TAGS,
    lead.brochureRequested ? "Brochure Requested" : null,
    lead.showingRequested ? "Showing Requested" : null,
  ].filter((tag): tag is string => Boolean(tag));
}

function buildLeadNote(lead: GhlLeadPayload): string {
  return [
    "PropertyPilot AI Tour Lead",
    `Property address: ${lead.propertyAddress}`,
    `PropertyPilot property ID: ${lead.propertyId}`,
    `Buyer intent score: ${lead.buyerIntentScore ?? "Not scored"}`,
    `Buyer interests: ${lead.buyerInterests.length > 0 ? lead.buyerInterests.join(", ") : "None captured"}`,
    `Buyer concerns: ${lead.buyerConcerns.length > 0 ? lead.buyerConcerns.join(", ") : "None captured"}`,
    `Brochure requested: ${lead.brochureRequested ? "Yes" : "No"}`,
    `Showing requested: ${lead.showingRequested ? "Yes" : "No"}`,
    lead.aiConversationSummary ? `AI conversation summary: ${lead.aiConversationSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as T;
}

function parseJson(text: string): Json {
  if (!text) return {};
  try {
    return JSON.parse(text) as Json;
  } catch {
    return { raw: text };
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function extractErrorMessage(payload: Json, fallback: string): string {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const maybeMessage = payload.message ?? payload.error ?? payload.msg;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback || "Unknown error";
}

function extractId(payload: Json, paths: string[]): string | null {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) return null;
      return (current as Record<string, unknown>)[key];
    }, payload);
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}
