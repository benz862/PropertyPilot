export type PlatformRole =
  | "platform_administrator"
  | "broker_owner"
  | "office_administrator"
  | "realtor"
  | "assistant"
  | "read_only"
  | "visitor";

export type DataClassification = "public" | "internal" | "confidential" | "restricted";

export interface SecurityAuditEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  classification: DataClassification;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

export const ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  platform_administrator: ["*"],
  broker_owner: ["org:read", "org:write", "property:*", "billing:read"],
  office_administrator: ["office:read", "office:write", "property:read", "property:write"],
  realtor: ["property:read", "property:write", "lead:read", "lead:write"],
  assistant: ["property:read", "lead:read"],
  read_only: ["property:read", "analytics:read"],
  visitor: ["tour:read"],
};
