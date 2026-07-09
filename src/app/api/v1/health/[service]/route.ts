import { apiError, apiSuccess } from "@/lib/api/response";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ service: string }>;
}

const serviceChecks = {
  database: () => Boolean(env.supabase.url && env.supabase.anonKey),
  storage: () => Boolean(env.supabase.url),
  openai: () => Boolean(env.openai.apiKey),
  stripe: () => Boolean(env.stripe.secretKey),
  resend: () => Boolean(env.resend.apiKey),
  crm: () => Boolean(env.ghl.privateIntegrationToken && env.ghl.locationId),
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  const startedAt = performance.now();
  const { service } = await params;

  if (!(service in serviceChecks)) {
    return apiError("Unknown health dependency", 404, "HEALTH_DEPENDENCY_NOT_FOUND");
  }

  const configured = serviceChecks[service as keyof typeof serviceChecks]();
  return apiSuccess({
    service,
    status: configured ? "ok" : "not_configured",
    latencyMs: Math.round(performance.now() - startedAt),
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
