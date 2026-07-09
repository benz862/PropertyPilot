import { apiError, apiSuccess } from "@/lib/api/response";
import { createKnowledgeEngineService } from "@/lib/knowledge-engine";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ propertyId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { propertyId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    if (!query) return apiError("Query parameter q is required", 400);
    if (!env.supabase.url) return apiError("Database not configured", 503);

    const engine = await createKnowledgeEngineService();
    const results = await engine.search(propertyId, query);
    return apiSuccess(results);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Search failed");
  }
}
