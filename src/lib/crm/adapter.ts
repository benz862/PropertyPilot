import type { CrmAdapterResult, CrmConnection, CrmLeadPayload, CrmProvider } from "./types";

export interface CrmAdapter {
  provider: CrmProvider;
  connect(oauthCode: string): Promise<CrmConnection>;
  refreshToken(connection: CrmConnection): Promise<CrmConnection>;
  createOrUpdateContact(
    connection: CrmConnection,
    lead: CrmLeadPayload,
  ): Promise<CrmAdapterResult>;
  addNote(
    connection: CrmConnection,
    contactId: string,
    note: string,
  ): Promise<CrmAdapterResult>;
  createTask(
    connection: CrmConnection,
    contactId: string,
    title: string,
  ): Promise<CrmAdapterResult>;
}

export function createCrmAdapter(provider: CrmProvider): CrmAdapter {
  switch (provider) {
    case "gohighlevel":
      return new GoHighLevelAdapter();
    default:
      throw new Error(`CRM provider not supported: ${provider}`);
  }
}

class GoHighLevelAdapter implements CrmAdapter {
  provider: CrmProvider = "gohighlevel";

  async connect(oauthCode: string): Promise<CrmConnection> {
    const apiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;

    if (!apiKey) {
      return {
        id: crypto.randomUUID(),
        userId: "mock-user",
        provider: "gohighlevel",
        accessToken: null,
        refreshToken: null,
        locationId: locationId ?? null,
        pipelineId: null,
        calendarId: null,
        isConnected: false,
        lastSyncAt: null,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: crypto.randomUUID(),
      userId: "oauth-user",
      provider: "gohighlevel",
      accessToken: `ghl_${oauthCode.slice(0, 8)}`,
      refreshToken: `refresh_${oauthCode.slice(0, 8)}`,
      locationId: locationId ?? null,
      pipelineId: "default-pipeline",
      calendarId: "default-calendar",
      isConnected: true,
      lastSyncAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  async refreshToken(connection: CrmConnection): Promise<CrmConnection> {
    if (!connection.refreshToken) return connection;
    return {
      ...connection,
      accessToken: `ghl_refreshed_${Date.now()}`,
      lastSyncAt: new Date().toISOString(),
    };
  }

  async createOrUpdateContact(
    connection: CrmConnection,
    lead: CrmLeadPayload,
  ): Promise<CrmAdapterResult> {
    if (!connection.isConnected || !connection.accessToken) {
      return {
        success: false,
        externalId: null,
        error: "GoHighLevel not connected. Configure GHL_PRIVATE_INTEGRATION_TOKEN.",
      };
    }

    const externalId = `ghl_contact_${lead.email.replace(/[^a-z0-9]/gi, "_")}`;
    return { success: true, externalId, error: null };
  }

  async addNote(
    connection: CrmConnection,
    contactId: string,
    note: string,
  ): Promise<CrmAdapterResult> {
    if (!connection.isConnected) {
      return { success: false, externalId: null, error: "Not connected" };
    }
    return { success: true, externalId: `note_${contactId}_${note.length}`, error: null };
  }

  async createTask(
    connection: CrmConnection,
    contactId: string,
    title: string,
  ): Promise<CrmAdapterResult> {
    if (!connection.isConnected) {
      return { success: false, externalId: null, error: "Not connected" };
    }
    return { success: true, externalId: `task_${contactId}_${title.length}`, error: null };
  }
}
