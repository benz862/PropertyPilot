import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createPlatformAdminService } from "@/lib/platform-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const admin = await createPlatformAdminService();
    if (!admin.isAdminUser(user.id)) {
      return apiError("Forbidden", 403);
    }
    const dashboard = await admin.getDashboard();
    return apiSuccess(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin fetch failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
