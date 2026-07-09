export type CrmProvider = "gohighlevel" | "hubspot" | "salesforce" | "follow_up_boss";

export type CrmSyncDirection = "outbound" | "inbound";

export type CrmSyncStatus = "pending" | "processing" | "completed" | "failed" | "dead_letter";

export interface CrmConnection {
  id: string;
  userId: string;
  provider: CrmProvider;
  accessToken: string | null;
  refreshToken: string | null;
  locationId: string | null;
  pipelineId: string | null;
  calendarId: string | null;
  isConnected: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export interface PropertyCrmMapping {
  propertyId: string;
  connectionId: string;
  locationId: string;
  pipelineId: string | null;
  calendarId: string | null;
  workflowId: string | null;
  tags: string[];
}

export interface CrmLeadPayload {
  propertyId: string;
  name: string;
  email: string;
  phone: string | null;
  propertyAddress: string;
  buyerIntent: string | null;
  interestScore: number | null;
  concernSummary: string | null;
  conversationSummary: string | null;
  tourDurationMinutes: number | null;
  brochureRequested: boolean;
  showingRequested: boolean;
  tags: string[];
}

export interface CrmSyncEvent {
  id: string;
  connectionId: string;
  direction: CrmSyncDirection;
  eventType: string;
  payload: Record<string, unknown>;
  status: CrmSyncStatus;
  retries: number;
  error: string | null;
  correlationId: string;
  createdAt: string;
  processedAt: string | null;
}

export interface CrmAuditEntry {
  id: string;
  connectionId: string;
  action: string;
  status: CrmSyncStatus;
  durationMs: number;
  error: string | null;
  correlationId: string;
  createdAt: string;
}

export interface CrmFieldMapping {
  propertyPilotField: string;
  crmField: string;
}

export interface CrmAdapterResult {
  success: boolean;
  externalId: string | null;
  error: string | null;
}
