import { apiError, apiSuccess } from "@/lib/api/response";
import { createPropertyAccessService } from "@/lib/property-access";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const preview = new URL(request.url).searchParams.get("preview") === "1";
    const access = await createPropertyAccessService();
    const resolution = await access.resolveToken(token, preview);
    if (!resolution) return apiError("Invalid access token", 404);
    return apiSuccess(resolution);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Token resolution failed");
  }
}
