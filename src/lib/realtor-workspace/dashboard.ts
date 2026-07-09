import { calculatePropertyHealth } from "@/lib/property-health/score";
import {
  getAnalyticsSummaryForOwner,
  getAuditLogsForOwner,
  getOwnerLeads,
  getOwnerProfileName,
  getOwnerProperties,
  getPendingSuggestionsForOwner,
  getPropertyLeadCount,
  getPropertyPhotos,
  getPropertyQrCode,
  getPropertyVisitorCount,
  getUnansweredQuestionsForOwner,
  getWorkspaceOwnerId,
} from "@/lib/repositories/workspace-repository";
import { loadPropertyTwinContext } from "@/lib/repositories/property-repository";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SubscriptionTier } from "@/types/database";

import {
  formatPropertyAddress,
  type ActivityEvent,
  type AiRecommendation,
  type AnalyticsSummary,
  type PropertySummary,
  type SubscriptionInfo,
  type WorkspaceDashboardData,
  type WorkspaceNotification,
  type LeadWithProperty,
} from "./types";

const EMPTY_ANALYTICS: AnalyticsSummary = {
  qrScans: 0,
  tourStarts: 0,
  questionsAsked: 0,
  leadsCaptured: 0,
  avgDurationMinutes: null,
};

const EMPTY_SUBSCRIPTION: SubscriptionInfo = {
  tier: "free",
  label: "Free Trial",
  propertyCount: 0,
  propertyLimit: 3,
};

const SUBSCRIPTION_LIMITS: Record<SubscriptionTier | "brokerage", number | null> = {
  free: 3,
  starter: 3,
  professional: 15,
  brokerage: 100,
  enterprise: null,
};

const SUBSCRIPTION_LABELS: Record<SubscriptionTier | "brokerage", string> = {
  free: "Free Trial",
  starter: "Starter",
  professional: "Professional",
  brokerage: "Brokerage",
  enterprise: "Enterprise",
};

interface OrganizationMembershipSubscriptionRow {
  organization_id: string;
  profile_id: string;
  is_primary: boolean;
  deleted_at: string | null;
}

interface OrganizationSubscriptionRow {
  id: string;
  subscription_plan: string | null;
  max_properties: number | null;
}

type DashboardDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      organization_members: {
        Row: OrganizationMembershipSubscriptionRow;
        Insert: Partial<OrganizationMembershipSubscriptionRow>;
        Update: Partial<OrganizationMembershipSubscriptionRow>;
        Relationships: [];
      };
      organizations: {
        Row: OrganizationSubscriptionRow;
        Insert: Partial<OrganizationSubscriptionRow>;
        Update: Partial<OrganizationSubscriptionRow>;
        Relationships: [];
      };
    };
  };
};

export async function loadWorkspaceDashboard(): Promise<WorkspaceDashboardData> {
  if (!env.supabase.url || !env.supabase.anonKey) {
    return emptyDashboard();
  }

  const client = await createClient();
  const ownerId = await getWorkspaceOwnerId(client);

  if (!ownerId) {
    return emptyDashboard();
  }

  return loadDashboardForOwner(client, ownerId);
}

export async function loadDashboardForOwner(
  client: SupabaseClient<Database>,
  ownerId: string,
): Promise<WorkspaceDashboardData> {
  const [
    realtorName,
    properties,
    leads,
    analyticsData,
    auditLogs,
    suggestions,
    unansweredQuestions,
  ] = await Promise.all([
    getOwnerProfileName(client, ownerId),
    getOwnerProperties(client, ownerId),
    getOwnerLeads(client, ownerId, 10),
    getAnalyticsSummaryForOwner(client, ownerId),
    getAuditLogsForOwner(client, ownerId, 15),
    getPendingSuggestionsForOwner(client, ownerId),
    getUnansweredQuestionsForOwner(client, ownerId),
  ]);

  const propertySummaries = await Promise.all(
    properties.map((property) => buildPropertySummary(client, property.id, property)),
  );

  const attentionListings = propertySummaries.filter(
    (p) => p.healthScore < 90 || p.status === "draft",
  );

  const recommendations = buildRecommendations(suggestions, unansweredQuestions, propertySummaries);
  const analytics = buildAnalyticsSummary(analyticsData.events, analyticsData.sessionCount);
  const activity = buildActivityTimeline(auditLogs, leads);
  const notifications = buildNotifications(leads, suggestions, unansweredQuestions);
  const subscription = await loadSubscriptionInfo(client, ownerId, properties.length);

  const recentLeads: LeadWithProperty[] = leads.map((lead) => ({
    ...lead,
    propertyAddress: `${lead.property.street}, ${lead.property.city}`,
    propertySlug: lead.property.slug,
    interestScore: lead.requested_showing ? 85 : lead.requested_pdf ? 70 : 50,
  }));

  return {
    realtorName,
    properties: propertySummaries,
    attentionListings,
    recentLeads,
    recommendations,
    analytics,
    subscription,
    activity,
    notifications,
    unansweredQuestionCount: unansweredQuestions.length,
  };
}

async function loadSubscriptionInfo(
  client: SupabaseClient<Database>,
  ownerId: string,
  propertyCount: number,
): Promise<SubscriptionInfo> {
  const dashboardClient = client as unknown as SupabaseClient<DashboardDatabase>;
  const membershipResult = await dashboardClient
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", ownerId)
    .eq("is_primary", true)
    .is("deleted_at", null)
    .maybeSingle();
  const membership = membershipResult.data as OrganizationMembershipSubscriptionRow | null;

  const organizationResult = membership?.organization_id
    ? await dashboardClient
        .from("organizations")
        .select("subscription_plan, max_properties")
        .eq("id", membership.organization_id)
        .is("deleted_at", null)
        .maybeSingle()
    : { data: null };
  const organization = organizationResult.data as OrganizationSubscriptionRow | null;

  if (organization) {
    const tier = normalizeSubscriptionTier(organization.subscription_plan);
    return {
      tier,
      label: SUBSCRIPTION_LABELS[tier],
      propertyCount,
      propertyLimit:
        tier === "enterprise"
          ? null
          : typeof organization.max_properties === "number"
            ? organization.max_properties
            : SUBSCRIPTION_LIMITS[tier],
    };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("subscription_tier")
    .eq("id", ownerId)
    .maybeSingle();

  const tier = normalizeSubscriptionTier(profile?.subscription_tier);
  return {
    tier,
    label: SUBSCRIPTION_LABELS[tier],
    propertyCount,
    propertyLimit: SUBSCRIPTION_LIMITS[tier],
  };
}

function normalizeSubscriptionTier(tier: unknown): SubscriptionTier | "brokerage" {
  if (
    tier === "starter" ||
    tier === "professional" ||
    tier === "brokerage" ||
    tier === "enterprise"
  ) {
    return tier;
  }

  return "free";
}

async function buildPropertySummary(
  client: SupabaseClient<Database>,
  propertyId: string,
  property: Awaited<ReturnType<typeof getOwnerProperties>>[number],
): Promise<PropertySummary> {
  const [context, photos, visitorCount, leadCount, qrCode] = await Promise.all([
    loadPropertyTwinContext(client, propertyId),
    getPropertyPhotos(client, propertyId),
    getPropertyVisitorCount(client, propertyId),
    getPropertyLeadCount(client, propertyId),
    getPropertyQrCode(client, propertyId),
  ]);

  const health = context ? calculatePropertyHealth(context) : null;
  const primaryPhoto = photos.find((p) => p.is_primary) ?? photos[0] ?? null;
  const heroPhotoUrl = primaryPhoto ? getPhotoPublicUrl(primaryPhoto) : null;

  const filledFields = [
    property.street,
    property.city,
    property.bedrooms,
    property.bathrooms,
    property.finished_sq_ft,
  ].filter((v) => v !== null && v !== undefined && v !== "").length;
  const completeness = Math.round((filledFields / 5) * 100);

  let qrStatus: PropertySummary["qrStatus"] = "pending";
  if (property.published_at && qrCode) {
    qrStatus = "active";
  } else if (property.published_at) {
    qrStatus = "inactive";
  }

  return {
    id: property.id,
    slug: property.slug,
    address: formatPropertyAddress(property),
    status: property.status,
    heroPhotoUrl,
    healthScore: health?.total ?? 0,
    healthStatus: health?.status ?? "incomplete",
    aiReadiness: health?.breakdown.marketingReadiness ?? 0,
    completeness,
    visitorCount,
    leadCount,
    qrStatus,
    lastUpdated: property.updated_at,
  };
}

function buildRecommendations(
  suggestions: Awaited<ReturnType<typeof getPendingSuggestionsForOwner>>,
  questions: Awaited<ReturnType<typeof getUnansweredQuestionsForOwner>>,
  properties: PropertySummary[],
): AiRecommendation[] {
  const recs: AiRecommendation[] = suggestions.map((s) => ({
    id: s.id,
    propertyId: s.property_id,
    propertyAddress: `${s.property.street}, ${s.property.city}`,
    message: s.message,
    priority: s.priority,
    type: "suggestion",
  }));

  for (const question of questions.slice(0, 5)) {
    recs.push({
      id: question.id,
      propertyId: question.property_id,
      propertyAddress: `${question.property.street}, ${question.property.city}`,
      message: question.suggested_knowledge_addition
        ? `${question.question} — ${question.suggested_knowledge_addition}`
        : `Buyers asked: "${question.question}"`,
      priority: 80,
      type: "question",
    });
  }

  for (const property of properties.filter((p) => p.healthScore < 60)) {
    recs.push({
      id: `health-${property.id}`,
      propertyId: property.id,
      propertyAddress: property.address,
      message: `${property.address} needs attention — health score is ${property.healthScore}.`,
      priority: 90,
      type: "health",
    });
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 10);
}

function buildAnalyticsSummary(
  events: Awaited<ReturnType<typeof getAnalyticsSummaryForOwner>>["events"],
  sessionCount: number,
): AnalyticsSummary {
  const qrScans = events.filter((e) => e.event_type === "qr_scan").length;
  const tourStarts = sessionCount;
  const questionsAsked = events.filter((e) => e.event_type === "question_asked").length;
  const leadsCaptured = events.filter((e) => e.event_type === "lead_captured").length;

  const durationEvents = events.filter((e) => e.event_type === "time_spent");
  let avgDurationMinutes: number | null = null;
  if (durationEvents.length > 0) {
    const totalSeconds = durationEvents.reduce((sum, e) => {
      const seconds = typeof e.event_data.seconds === "number" ? e.event_data.seconds : 0;
      return sum + seconds;
    }, 0);
    avgDurationMinutes = Math.round(totalSeconds / durationEvents.length / 60);
  }

  return { qrScans, tourStarts, questionsAsked, leadsCaptured, avgDurationMinutes };
}

function buildActivityTimeline(
  auditLogs: Awaited<ReturnType<typeof getAuditLogsForOwner>>,
  leads: Awaited<ReturnType<typeof getOwnerLeads>>,
): ActivityEvent[] {
  const auditEvents: ActivityEvent[] = auditLogs.map((log) => ({
    id: log.id,
    propertyId: log.property_id,
    propertyAddress: `${log.property.street}, ${log.property.city}`,
    action: log.action,
    title: formatAuditAction(log.action),
    description: log.entity_type ? `${log.entity_type} ${log.action}` : null,
    createdAt: log.created_at,
  }));

  const leadEvents: ActivityEvent[] = leads.slice(0, 5).map((lead) => ({
    id: `lead-${lead.id}`,
    propertyId: lead.property_id,
    propertyAddress: `${lead.property.street}, ${lead.property.city}`,
    action: "lead_captured" as const,
    title: "Lead captured",
    description: lead.name ?? lead.email ?? "New buyer lead",
    createdAt: lead.created_at,
  }));

  return [...auditEvents, ...leadEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}

function buildNotifications(
  leads: Awaited<ReturnType<typeof getOwnerLeads>>,
  suggestions: Awaited<ReturnType<typeof getPendingSuggestionsForOwner>>,
  questions: Awaited<ReturnType<typeof getUnansweredQuestionsForOwner>>,
): WorkspaceNotification[] {
  const notifications: WorkspaceNotification[] = [];

  for (const lead of leads.slice(0, 3)) {
    notifications.push({
      id: `notif-lead-${lead.id}`,
      type: lead.requested_showing ? "showing_requested" : "new_lead",
      title: lead.requested_showing ? "Showing requested" : "New lead",
      message: lead.name ?? lead.email ?? "A buyer shared their contact info",
      propertyId: lead.property_id,
      createdAt: lead.created_at,
      read: false,
    });
  }

  for (const question of questions.slice(0, 3)) {
    notifications.push({
      id: `notif-q-${question.id}`,
      type: "unknown_question",
      title: "Unknown question asked",
      message: question.question,
      propertyId: question.property_id,
      createdAt: question.created_at,
      read: false,
    });
  }

  for (const suggestion of suggestions.slice(0, 2)) {
    notifications.push({
      id: `notif-s-${suggestion.id}`,
      type: "knowledge_review",
      title: "Knowledge needs review",
      message: suggestion.message,
      propertyId: suggestion.property_id,
      createdAt: suggestion.created_at,
      read: false,
    });
  }

  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}

function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    create: "Property created",
    update: "Property updated",
    verify: "Knowledge approved",
    publish: "Property published",
    suggestion_accept: "AI suggestion accepted",
    suggestion_dismiss: "AI suggestion dismissed",
    soft_delete: "Item archived",
    retire: "Knowledge retired",
  };
  return labels[action] ?? action.replace(/_/g, " ");
}

function emptyDashboard(): WorkspaceDashboardData {
  return {
    realtorName: "Realtor",
    properties: [],
    attentionListings: [],
    recentLeads: [],
    recommendations: [],
    analytics: EMPTY_ANALYTICS,
    subscription: EMPTY_SUBSCRIPTION,
    activity: [],
    notifications: [],
    unansweredQuestionCount: 0,
  };
}
