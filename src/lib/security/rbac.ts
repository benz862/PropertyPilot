import { APP_LIMITS, TIME } from "@/lib/constants";

import type { PlatformRole, RateLimitResult, SecurityAuditEntry } from "./types";
import { ROLE_PERMISSIONS } from "./types";

const auditLog: SecurityAuditEntry[] = [];
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function hasPermission(role: PlatformRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(":");
  return perms.includes(`${resource}:*`);
}

export function checkRateLimit(
  key: string,
  limit = APP_LIMITS.publicRateLimitPerMinute,
  windowMs = TIME.minuteMs,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs).toISOString(),
    };
  }

  entry.count += 1;
  rateLimitMap.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.resetAt).toISOString(),
  };
}

export function logSecurityEvent(input: Omit<SecurityAuditEntry, "id" | "createdAt">): SecurityAuditEntry {
  const entry: SecurityAuditEntry = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

export function getSecurityAuditLog(limit = 100): SecurityAuditEntry[] {
  return auditLog.slice(-limit);
}

export function maskSensitiveValue(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}
