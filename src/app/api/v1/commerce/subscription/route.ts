import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createCommerceService } from "@/lib/commerce";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const commerce = await createCommerceService();
    const summary = commerce.getUsageSummary(user.id);
    const invoices = await commerce.getInvoices(user.id);
    return apiSuccess({ ...summary, invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing fetch failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = (await request.json()) as { tier?: string };
    const commerce = await createCommerceService();
    const tier = (body.tier as import("@/lib/commerce").PlanTier) ?? "professional";
    const checkout = await commerce.createCheckout(user.id, tier);
    return apiSuccess(checkout);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
