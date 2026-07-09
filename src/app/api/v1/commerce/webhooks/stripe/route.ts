import { apiError, apiSuccess } from "@/lib/api/response";
import { createCommerceService } from "@/lib/commerce";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    const commerce = await createCommerceService();
    const event = await commerce.handleStripeWebhook(payload, signature);
    if (!event) return apiError("Invalid webhook", 400);
    return apiSuccess(event);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Webhook failed");
  }
}
