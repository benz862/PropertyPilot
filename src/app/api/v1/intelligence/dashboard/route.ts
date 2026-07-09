import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createIntelligenceCenterService } from "@/lib/intelligence-center";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const service = await createIntelligenceCenterService();
    const [dashboard, summary] = await Promise.all([
      service.getDashboard(user.id),
      service.getExecutiveSummary(user.id),
    ]);
    return apiSuccess({ dashboard, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intelligence fetch failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
