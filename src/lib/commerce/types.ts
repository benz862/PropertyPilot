export type PlanTier = "starter" | "professional" | "brokerage" | "enterprise";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "paused";

export type EntitlementKey =
  | "voice_ai"
  | "buyer_intelligence"
  | "crm_integration"
  | "analytics"
  | "marketing_assets"
  | "template_marketplace"
  | "luxury_themes"
  | "custom_branding"
  | "enterprise_api"
  | "brokerage_dashboard";

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  maxListings: number;
  maxTeamMembers: number;
  maxAiMinutes: number;
  maxStorageGb: number;
  maxVoiceNotes: number;
  maxGeneratedAssets: number;
  entitlements: EntitlementKey[];
}

export interface License {
  id: string;
  userId: string;
  planId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  entitlements: EntitlementKey[];
  renewalDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
}

export interface UsageRecord {
  id: string;
  userId: string;
  metric: UsageMetric;
  quantity: number;
  recordedAt: string;
}

export type UsageMetric =
  | "listings"
  | "storage_gb"
  | "voice_minutes"
  | "ai_tokens"
  | "generated_pdfs"
  | "visitors"
  | "buyer_sessions"
  | "api_calls"
  | "email_sends";

export interface UsageSummary {
  plan: SubscriptionPlan;
  license: License;
  usage: Record<UsageMetric, number>;
  limits: Record<UsageMetric, number>;
  remaining: Record<UsageMetric, number>;
}

export interface BillingEvent {
  id: string;
  userId: string;
  action: string;
  amountCents: number | null;
  result: "success" | "failure";
  reference: string | null;
  correlationId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: "paid" | "open" | "void";
  amountCents: number;
  taxCents: number;
  date: string;
  pdfUrl: string | null;
}
