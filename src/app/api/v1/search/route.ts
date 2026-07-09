import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { APP_LIMITS } from "@/lib/constants";
import { searchWorkspace } from "@/lib/realtor-workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser();

    const body = (await request.json()) as { query?: string; limit?: number; cursor?: string };
    const query = body.query?.trim() ?? "";
    if (!query) {
      return apiError("query is required", 400, "VALIDATION_ERROR");
    }

    const results = await searchWorkspace(query);
    const limit =
      body.limit && body.limit > 0
        ? Math.min(body.limit, APP_LIMITS.maxPageSize)
        : APP_LIMITS.defaultPageSize;

    return apiSuccess(
      results.slice(0, limit),
      200,
      {
        cursor: body.cursor ?? null,
        nextCursor: results.length > limit ? String(limit) : null,
        limit,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
