import { apiError, apiSuccess } from "@/lib/api/response";
import { createKnowledgeEngineService } from "@/lib/knowledge-engine";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ propertyId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { propertyId } = await params;
    if (!env.supabase.url) {
      return apiError("Database not configured", 503);
    }
    const engine = await createKnowledgeEngineService();
    const [health, faqs, suggestions] = await Promise.all([
      engine.getHealth(propertyId),
      engine.getFaqs(propertyId),
      engine.getSuggestions(propertyId),
    ]);
    return apiSuccess({ health, faqs, suggestions });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Knowledge fetch failed");
  }
}
