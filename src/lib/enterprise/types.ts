export interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColors: { primary: string; accent: string };
  billingAccountId: string | null;
  subscriptionTier: string;
  createdAt: string;
}

export interface Office {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  phone: string | null;
  managerId: string | null;
  timezone: string;
}

export interface Team {
  id: string;
  officeId: string;
  name: string;
  memberIds: string[];
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  officeId: string | null;
  teamId: string | null;
  role: "broker_owner" | "office_administrator" | "realtor" | "assistant";
}
