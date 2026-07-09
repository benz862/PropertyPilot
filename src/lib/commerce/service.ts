import { getPlanByTier, hasEntitlement, planLimitsToUsageLimits, SUBSCRIPTION_PLANS } from "./entitlements";
import { stripeAdapter } from "./stripe-adapter";
import type {
  BillingEvent,
  EntitlementKey,
  License,
  SubscriptionPlan,
  UsageMetric,
  UsageRecord,
  UsageSummary,
} from "./types";

const licenseStore = new Map<string, License>();
const usageStore = new Map<string, UsageRecord[]>();
const billingLog: BillingEvent[] = [];

/**
 * Commerce Platform (PRD-015) — licensing, usage, Stripe billing.
 */
export class CommerceService {
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getOrCreateLicense(userId: string, tier: SubscriptionPlan["tier"] = "starter"): License {
    const existing = licenseStore.get(userId);
    if (existing) return existing;

    const plan = getPlanByTier(tier);
    const license: License = {
      id: crypto.randomUUID(),
      userId,
      planId: plan.id,
      tier: plan.tier,
      status: "trialing",
      entitlements: plan.entitlements,
      renewalDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    };
    licenseStore.set(userId, license);
    return license;
  }

  checkEntitlement(userId: string, key: EntitlementKey): boolean {
    const license = this.getOrCreateLicense(userId);
    if (license.status === "canceled" || license.status === "past_due") {
      return false;
    }
    return hasEntitlement(license.entitlements, key);
  }

  recordUsage(userId: string, metric: UsageMetric, quantity = 1): UsageRecord {
    const record: UsageRecord = {
      id: crypto.randomUUID(),
      userId,
      metric,
      quantity,
      recordedAt: new Date().toISOString(),
    };
    const existing = usageStore.get(userId) ?? [];
    existing.push(record);
    usageStore.set(userId, existing);
    return record;
  }

  getUsageSummary(userId: string): UsageSummary {
    const license = this.getOrCreateLicense(userId);
    const plan = getPlanByTier(license.tier);
    const limits = planLimitsToUsageLimits(plan) as Record<UsageMetric, number>;
    const records = usageStore.get(userId) ?? [];

    const usage = {} as Record<UsageMetric, number>;
    for (const metric of Object.keys(limits) as UsageMetric[]) {
      usage[metric] = records
        .filter((r) => r.metric === metric)
        .reduce((sum, r) => sum + r.quantity, 0);
    }

    const remaining = {} as Record<UsageMetric, number>;
    for (const metric of Object.keys(limits) as UsageMetric[]) {
      remaining[metric] = Math.max(0, limits[metric] - usage[metric]);
    }

    return { plan, license, usage, limits, remaining };
  }

  async createCheckout(userId: string, tier: SubscriptionPlan["tier"]) {
    const plan = getPlanByTier(tier);
    const result = await stripeAdapter.createCheckoutSession({
      userId,
      planId: plan.id,
      priceCents: plan.monthlyPriceCents,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?success=1`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing`,
    });

    if (result.success && result.customerId) {
      const license = this.getOrCreateLicense(userId);
      license.planId = plan.id;
      license.tier = tier;
      license.entitlements = plan.entitlements;
      license.stripeCustomerId = result.customerId;
      license.stripeSubscriptionId = result.subscriptionId;
      licenseStore.set(userId, license);
    }

    this.logBilling(userId, "checkout_created", plan.monthlyPriceCents, result.success ? "success" : "failure");
    return result;
  }

  async handleStripeWebhook(payload: string, signature: string | null) {
    const event = await stripeAdapter.parseWebhook(payload, signature);
    if (!event) return null;

    for (const license of licenseStore.values()) {
      if (license.stripeCustomerId === event.customerId && event.status) {
        license.status = event.status;
        licenseStore.set(license.userId, license);
      }
    }

    this.logBilling("webhook", event.type, null, "success", event.subscriptionId);
    return event;
  }

  async getInvoices(userId: string) {
    const license = this.getOrCreateLicense(userId);
    if (!license.stripeCustomerId) return [];
    return stripeAdapter.listInvoices(license.stripeCustomerId);
  }

  getBillingEvents(userId?: string): BillingEvent[] {
    if (userId) return billingLog.filter((e) => e.userId === userId);
    return billingLog;
  }

  private logBilling(
    userId: string,
    action: string,
    amountCents: number | null,
    result: "success" | "failure",
    reference?: string | null,
  ) {
    billingLog.push({
      id: crypto.randomUUID(),
      userId,
      action,
      amountCents,
      result,
      reference: reference ?? null,
      correlationId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }
}

export async function createCommerceService(): Promise<CommerceService> {
  return new CommerceService();
}
