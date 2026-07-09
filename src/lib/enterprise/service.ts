import { colors } from "@/styles";

import type { Organization, Office, OrganizationMember, Team } from "./types";

const orgStore = new Map<string, Organization>();
const officeStore = new Map<string, Office>();
const teamStore = new Map<string, Team>();
const memberStore = new Map<string, OrganizationMember>();

/**
 * Enterprise & Brokerage Platform (PRD-020) — org hierarchy and inheritance.
 */
export class EnterpriseService {
  createOrganization(input: {
    name: string;
    ownerId: string;
    brandColors?: { primary: string; accent: string };
  }): Organization {
    const org: Organization = {
      id: crypto.randomUUID(),
      name: input.name,
      logoUrl: null,
      brandColors: input.brandColors ?? { primary: colors.primary, accent: colors.secondary },
      billingAccountId: null,
      subscriptionTier: "brokerage",
      createdAt: new Date().toISOString(),
    };
    orgStore.set(org.id, org);

    memberStore.set(input.ownerId, {
      userId: input.ownerId,
      organizationId: org.id,
      officeId: null,
      teamId: null,
      role: "broker_owner",
    });

    return org;
  }

  createOffice(organizationId: string, input: { name: string; address?: string }): Office {
    const office: Office = {
      id: crypto.randomUUID(),
      organizationId,
      name: input.name,
      address: input.address ?? null,
      phone: null,
      managerId: null,
      timezone: "America/New_York",
    };
    officeStore.set(office.id, office);
    return office;
  }

  createTeam(officeId: string, name: string): Team {
    const team: Team = {
      id: crypto.randomUUID(),
      officeId,
      name,
      memberIds: [],
    };
    teamStore.set(team.id, team);
    return team;
  }

  addMember(member: OrganizationMember): OrganizationMember {
    memberStore.set(member.userId, member);
    return member;
  }

  getOrganization(orgId: string): Organization | null {
    return orgStore.get(orgId) ?? null;
  }

  getOrganizationForUser(userId: string): Organization | null {
    const member = memberStore.get(userId);
    if (!member) return null;
    return orgStore.get(member.organizationId) ?? null;
  }

  listOffices(organizationId: string): Office[] {
    return [...officeStore.values()].filter((o) => o.organizationId === organizationId);
  }

  listTeams(officeId: string): Team[] {
    return [...teamStore.values()].filter((t) => t.officeId === officeId);
  }
}

export async function createEnterpriseService(): Promise<EnterpriseService> {
  return new EnterpriseService();
}
