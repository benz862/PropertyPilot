import type { EntitlementKey, SubscriptionPlan } from "./types";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    tier: "starter",
    name: "Starter",
    description: "Independent agents getting started with AI property tours.",
    monthlyPriceCents: 4900,
    annualPriceCents: 47000,
    maxListings: 3,
    maxTeamMembers: 1,
    maxAiMinutes: 120,
    maxStorageGb: 5,
    maxVoiceNotes: 20,
    maxGeneratedAssets: 10,
    entitlements: ["voice_ai", "marketing_assets", "analytics"],
  },
  {
    id: "plan_professional",
    tier: "professional",
    name: "Professional",
    description: "Full AI intelligence for active listing agents.",
    monthlyPriceCents: 9900,
    annualPriceCents: 95000,
    maxListings: 15,
    maxTeamMembers: 1,
    maxAiMinutes: 600,
    maxStorageGb: 25,
    maxVoiceNotes: 100,
    maxGeneratedAssets: 50,
    entitlements: [
      "voice_ai",
      "buyer_intelligence",
      "crm_integration",
      "analytics",
      "marketing_assets",
      "luxury_themes",
    ],
  },
  {
    id: "plan_brokerage",
    tier: "brokerage",
    name: "Brokerage",
    description: "Team-wide branding, shared templates, and centralized billing.",
    monthlyPriceCents: 29900,
    annualPriceCents: 287000,
    maxListings: 100,
    maxTeamMembers: 25,
    maxAiMinutes: 3000,
    maxStorageGb: 100,
    maxVoiceNotes: 500,
    maxGeneratedAssets: 250,
    entitlements: [
      "voice_ai",
      "buyer_intelligence",
      "crm_integration",
      "analytics",
      "marketing_assets",
      "luxury_themes",
      "custom_branding",
      "brokerage_dashboard",
    ],
  },
  {
    id: "plan_enterprise",
    tier: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale with API access and custom integrations.",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    maxListings: 9999,
    maxTeamMembers: 9999,
    maxAiMinutes: 99999,
    maxStorageGb: 9999,
    maxVoiceNotes: 99999,
    maxGeneratedAssets: 99999,
    entitlements: [
      "voice_ai",
      "buyer_intelligence",
      "crm_integration",
      "analytics",
      "marketing_assets",
      "template_marketplace",
      "luxury_themes",
      "custom_branding",
      "enterprise_api",
      "brokerage_dashboard",
    ],
  },
];

export function getPlanByTier(tier: SubscriptionPlan["tier"]): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  return plan;
}

export function hasEntitlement(
  entitlements: EntitlementKey[],
  required: EntitlementKey,
): boolean {
  return entitlements.includes(required);
}

export function planLimitsToUsageLimits(plan: SubscriptionPlan): Record<string, number> {
  return {
    listings: plan.maxListings,
    storage_gb: plan.maxStorageGb,
    voice_minutes: plan.maxAiMinutes,
    ai_tokens: plan.maxAiMinutes * 1000,
    generated_pdfs: plan.maxGeneratedAssets,
    visitors: plan.maxListings * 500,
    buyer_sessions: plan.maxListings * 200,
    api_calls: plan.maxListings * 1000,
    email_sends: plan.maxListings * 50,
  };
}
