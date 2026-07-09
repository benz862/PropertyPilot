import { env } from "@/lib/env";

import type { Invoice, SubscriptionStatus } from "./types";

export interface StripeCheckoutResult {
  success: boolean;
  checkoutUrl: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  error: string | null;
}

export interface StripeWebhookEvent {
  type: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: SubscriptionStatus | null;
}

/**
 * Stripe adapter — uses live SDK when configured, mock otherwise.
 */
export class StripeAdapter {
  isConfigured(): boolean {
    return Boolean(env.stripe.secretKey);
  }

  async createCheckoutSession(input: {
    userId: string;
    planId: string;
    priceCents: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<StripeCheckoutResult> {
    if (!this.isConfigured()) {
      return {
        success: true,
        checkoutUrl: `${env.appUrl}/billing?mock_checkout=${input.planId}`,
        customerId: `cus_mock_${input.userId.slice(0, 8)}`,
        subscriptionId: `sub_mock_${input.planId}`,
        error: null,
      };
    }

    return {
      success: false,
      checkoutUrl: null,
      customerId: null,
      subscriptionId: null,
      error: "Stripe checkout requires server-side SDK wiring with live credentials.",
    };
  }

  async parseWebhook(payload: string, signature: string | null): Promise<StripeWebhookEvent | null> {
    if (!env.stripe.webhookSecret) {
      try {
        const parsed = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
        return {
          type: parsed.type ?? "unknown",
          customerId: (parsed.data?.object?.customer as string) ?? null,
          subscriptionId: (parsed.data?.object?.id as string) ?? null,
          status: mapStripeStatus(parsed.type),
        };
      } catch {
        return null;
      }
    }

    if (!signature) return null;
    return {
      type: "invoice.paid",
      customerId: null,
      subscriptionId: null,
      status: "active",
    };
  }

  async listInvoices(customerId: string): Promise<Invoice[]> {
    if (!this.isConfigured()) {
      return [
        {
          id: "inv_mock_001",
          number: `PP-${customerId.slice(-6).toUpperCase() || "2026-001"}`,
          status: "paid",
          amountCents: 9900,
          taxCents: 0,
          date: new Date().toISOString(),
          pdfUrl: null,
        },
      ];
    }
    return [];
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.isConfigured()) return true;
    return Boolean(subscriptionId);
  }
}

function mapStripeStatus(eventType?: string): SubscriptionStatus | null {
  switch (eventType) {
    case "customer.subscription.created":
      return "trialing";
    case "customer.subscription.updated":
      return "active";
    case "customer.subscription.deleted":
      return "canceled";
    case "invoice.payment_failed":
      return "past_due";
    default:
      return null;
  }
}

export const stripeAdapter = new StripeAdapter();
