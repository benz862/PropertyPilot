import { env } from "@/lib/env";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

/**
 * Resend email adapter — mock when RESEND_API_KEY is not configured.
 */
export class ResendAdapter {
  isConfigured(): boolean {
    return Boolean(env.resend.apiKey);
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        error: null,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resend.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.resend.fromEmail ?? "PropertyPilot <noreply@propertypilot.app>",
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, messageId: null, error: text };
      }

      const data = (await response.json()) as { id?: string };
      return { success: true, messageId: data.id ?? null, error: null };
    } catch (error) {
      return {
        success: false,
        messageId: null,
        error: error instanceof Error ? error.message : "Email send failed",
      };
    }
  }
}

export const resendAdapter = new ResendAdapter();

export async function sendBillingEmail(
  to: string,
  template: "welcome" | "trial_ending" | "payment_success" | "payment_failure" | "cancellation",
): Promise<EmailResult> {
  const subjects: Record<typeof template, string> = {
    welcome: "Welcome to PropertyPilot",
    trial_ending: "Your PropertyPilot trial ends soon",
    payment_success: "Payment received — thank you",
    payment_failure: "Payment failed — action required",
    cancellation: "Subscription cancelled",
  };

  return resendAdapter.send({
    to,
    subject: subjects[template],
    html: `<p>${subjects[template]}</p><p>PropertyPilot Billing</p>`,
  });
}
