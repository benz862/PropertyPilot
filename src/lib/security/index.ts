export {
  hasPermission,
  checkRateLimit,
  logSecurityEvent,
  getSecurityAuditLog,
  maskSensitiveValue,
} from "./rbac";
export { ROLE_PERMISSIONS } from "./types";
export type { PlatformRole, DataClassification, SecurityAuditEntry, RateLimitResult } from "./types";
