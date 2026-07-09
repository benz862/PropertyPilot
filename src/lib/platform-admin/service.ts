export interface AdminDashboardSnapshot {
  platformHealth: "healthy" | "degraded" | "down";
  activeUsers: number;
  activeOrganizations: number;
  activeProperties: number;
  todaysTours: number;
  todaysLeads: number;
  todaysConversations: number;
  revenueSnapshotCents: number;
  supportQueue: number;
  unreadAlerts: number;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  subscriptionTier: string;
  propertyCount: number;
  status: "active" | "suspended";
  lastActivityAt: string | null;
}

export interface AdminAuditEntry {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reversible: boolean;
  createdAt: string;
}

const adminAudit: AdminAuditEntry[] = [];

/**
 * Platform Administration (PRD-021) — internal ops console data layer.
 */
export class PlatformAdminService {
  isAdminUser(userId: string): boolean {
    const admins = process.env.PLATFORM_ADMIN_USER_IDS?.split(",") ?? [];
    return admins.includes(userId);
  }

  async getDashboard(): Promise<AdminDashboardSnapshot> {
    return {
      platformHealth: "healthy",
      activeUsers: 0,
      activeOrganizations: 0,
      activeProperties: 0,
      todaysTours: 0,
      todaysLeads: 0,
      todaysConversations: 0,
      revenueSnapshotCents: 0,
      supportQueue: 0,
      unreadAlerts: 0,
    };
  }

  logAdminAction(input: Omit<AdminAuditEntry, "id" | "createdAt">): AdminAuditEntry {
    const entry: AdminAuditEntry = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    adminAudit.push(entry);
    return entry;
  }

  getAuditLog(limit = 50): AdminAuditEntry[] {
    return adminAudit.slice(-limit);
  }
}

export async function createPlatformAdminService(): Promise<PlatformAdminService> {
  return new PlatformAdminService();
}
