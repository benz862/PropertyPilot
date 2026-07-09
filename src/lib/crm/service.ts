import { env } from "@/lib/env";

import { createCrmAdapter } from "./adapter";
import type {
  CrmAuditEntry,
  CrmConnection,
  CrmLeadPayload,
  CrmProvider,
  CrmSyncEvent,
  CrmSyncStatus,
  PropertyCrmMapping,
} from "./types";

const connectionStore = new Map<string, CrmConnection>();
const mappingStore = new Map<string, PropertyCrmMapping>();
const queueStore = new Map<string, CrmSyncEvent>();
const auditLog: CrmAuditEntry[] = [];

const DEFAULT_FIELD_MAPPINGS = [
  { propertyPilotField: "propertyAddress", crmField: "property_viewed" },
  { propertyPilotField: "buyerIntent", crmField: "buyer_intent" },
  { propertyPilotField: "interestScore", crmField: "interest_score" },
  { propertyPilotField: "conversationSummary", crmField: "conversation_summary" },
];

/**
 * CRM Integration Framework (PRD-014) — adapter-based sync with queue retry.
 */
export class CrmService {
  async connect(userId: string, provider: CrmProvider, oauthCode: string): Promise<CrmConnection> {
    const adapter = createCrmAdapter(provider);
    const connection = await adapter.connect(oauthCode);
    connection.userId = userId;
    connectionStore.set(connection.id, connection);
    this.logAudit(connection.id, "connect", "completed", 0, null);
    return connection;
  }

  getConnection(connectionId: string): CrmConnection | null {
    return connectionStore.get(connectionId) ?? null;
  }

  getConnectionForUser(userId: string): CrmConnection | null {
    return [...connectionStore.values()].find((c) => c.userId === userId) ?? null;
  }

  async syncLead(connectionId: string, lead: CrmLeadPayload): Promise<CrmSyncEvent> {
    const connection = connectionStore.get(connectionId);
    const event: CrmSyncEvent = {
      id: crypto.randomUUID(),
      connectionId,
      direction: "outbound",
      eventType: "lead_sync",
      payload: lead as unknown as Record<string, unknown>,
      status: "pending",
      retries: 0,
      error: null,
      correlationId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      processedAt: null,
    };
    queueStore.set(event.id, event);

    if (!connection) {
      event.status = "failed";
      event.error = "Connection not found";
      queueStore.set(event.id, event);
      return event;
    }

    const start = Date.now();
    const adapter = createCrmAdapter(connection.provider);
    const result = await adapter.createOrUpdateContact(connection, lead);

    if (result.success && result.externalId) {
      if (lead.conversationSummary) {
        await adapter.addNote(connection, result.externalId, lead.conversationSummary);
      }
      if (lead.showingRequested) {
        await adapter.createTask(connection, result.externalId, "Follow up: showing requested");
      } else if (lead.brochureRequested) {
        await adapter.createTask(connection, result.externalId, "Send property brochure");
      }

      event.status = "completed";
      event.processedAt = new Date().toISOString();
      connection.lastSyncAt = event.processedAt;
      connectionStore.set(connectionId, connection);
      this.logAudit(connectionId, "lead_sync", "completed", Date.now() - start, null);
    } else {
      event.status = "failed";
      event.error = result.error;
      this.logAudit(connectionId, "lead_sync", "failed", Date.now() - start, result.error);
    }

    queueStore.set(event.id, event);
    return event;
  }

  async processQueue(maxRetries = 3): Promise<CrmSyncEvent[]> {
    const processed: CrmSyncEvent[] = [];

    for (const event of queueStore.values()) {
      if (event.status !== "pending" && event.status !== "failed") continue;
      if (event.retries >= maxRetries) {
        event.status = "dead_letter";
        queueStore.set(event.id, event);
        continue;
      }

      const connection = connectionStore.get(event.connectionId);
      if (!connection) continue;

      event.retries += 1;
      event.status = "processing";
      const adapter = createCrmAdapter(connection.provider);
      const lead = event.payload as unknown as CrmLeadPayload;
      const result = await adapter.createOrUpdateContact(connection, lead);

      event.status = result.success ? "completed" : "failed";
      event.error = result.error;
      event.processedAt = result.success ? new Date().toISOString() : null;
      queueStore.set(event.id, event);
      processed.push(event);
    }

    return processed;
  }

  setPropertyMapping(mapping: PropertyCrmMapping): PropertyCrmMapping {
    mappingStore.set(mapping.propertyId, mapping);
    return mapping;
  }

  getPropertyMapping(propertyId: string): PropertyCrmMapping | null {
    return mappingStore.get(propertyId) ?? null;
  }

  getSyncStatus(connectionId: string) {
    const connection = connectionStore.get(connectionId);
    const events = [...queueStore.values()].filter((e) => e.connectionId === connectionId);
    const failed = events.filter((e) => e.status === "failed" || e.status === "dead_letter");

    return {
      connected: connection?.isConnected ?? false,
      pipelineConnected: Boolean(connection?.pipelineId),
      calendarConnected: Boolean(connection?.calendarId),
      lastSync: connection?.lastSyncAt ?? null,
      pendingCount: events.filter((e) => e.status === "pending").length,
      errorCount: failed.length,
      provider: connection?.provider ?? null,
      mockMode: !env.ghl.privateIntegrationToken,
    };
  }

  getFieldMappings() {
    return DEFAULT_FIELD_MAPPINGS;
  }

  getAuditLog(connectionId?: string): CrmAuditEntry[] {
    if (connectionId) {
      return auditLog.filter((e) => e.connectionId === connectionId);
    }
    return auditLog;
  }

  private logAudit(
    connectionId: string,
    action: string,
    status: CrmSyncStatus,
    durationMs: number,
    error: string | null,
  ) {
    auditLog.push({
      id: crypto.randomUUID(),
      connectionId,
      action,
      status,
      durationMs,
      error,
      correlationId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }
}

export async function createCrmService(): Promise<CrmService> {
  return new CrmService();
}

export { DEFAULT_FIELD_MAPPINGS };
