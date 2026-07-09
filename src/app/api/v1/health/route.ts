import { apiSuccess } from "@/lib/api/response";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return apiSuccess({
    status: "ok",
    version: "0.1.0",
    services: {
      database: env.supabase.url && env.supabase.anonKey ? "configured" : "not_configured",
      storage: env.supabase.url ? "configured" : "not_configured",
      openai: env.openai.apiKey ? "configured" : "not_configured",
      stripe: env.stripe.secretKey ? "configured" : "not_configured",
      crm:
        env.ghl.privateIntegrationToken && env.ghl.locationId
          ? "configured"
          : "not_configured",
    },
  });
}
